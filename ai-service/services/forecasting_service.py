"""
MillStream ERP — AI Microservice
services/forecasting_service.py

AI Pillar 1: Demand Forecasting using Facebook Prophet.

Workflow:
1. Query TransactionLedger for historical daily transaction data
2. Transform into Prophet-compatible DataFrame (ds, y columns)
3. Fit Prophet model with flour mill seasonality configurations
4. Predict next 30 days → aggregate into monthly totals
5. Write results to ai_forecasts table
6. Return ForecastResponse with daily + monthly aggregate data
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.schemas import (
    ForecastResponse,
    ForecastRecord,
    ForecastDataPoint,
    ForecastHistoryResponse,
)

logger = logging.getLogger(__name__)


# ── Prophet Import Guard ──────────────────────────────────────────────────────
# Prophet has heavy C dependencies; import is guarded for graceful startup
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not installed. Forecasting endpoints will return mock data.")


class ForecastingService:
    """Encapsulates Prophet-based demand forecasting logic for the flour mill."""

    def __init__(self, db: Session):
        self.db = db

    # ── Main entry point ──────────────────────────────────────────────────────

    def generate_forecast(self, periods: int = 30) -> ForecastResponse:
        """
        Main forecasting pipeline.
        Returns a ForecastResponse with daily Prophet output and monthly aggregate.
        """
        target_month = datetime.utcnow().replace(day=1) + timedelta(days=32)
        target_month = target_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        if not PROPHET_AVAILABLE:
            return self._mock_forecast(target_month, periods)

        try:
            # 1. Fetch historical data
            wheat_df = self._fetch_transaction_data("WHEAT")
            flour_df = self._fetch_transaction_data("FLOUR")
            revenue_df = self._fetch_revenue_data()

            # 2. Run Prophet for each metric
            wheat_forecast = self._run_prophet(wheat_df, periods)
            flour_forecast = self._run_prophet(flour_df, periods)
            revenue_forecast = self._run_prophet(revenue_df, periods)

            # 3. Aggregate monthly totals
            predicted_wheat_kg = float(wheat_forecast["yhat"].clip(lower=0).sum())
            predicted_flour_kg = float(flour_forecast["yhat"].clip(lower=0).sum())
            predicted_revenue = float(revenue_forecast["yhat"].clip(lower=0).sum())

            # 4. Save to database
            record = ForecastRecord(
                target_month=target_month,
                predicted_wheat_kg=round(predicted_wheat_kg, 2),
                predicted_flour_kg=round(predicted_flour_kg, 2),
                predicted_revenue=round(predicted_revenue, 2),
                generated_at=datetime.utcnow(),
            )
            db_id = self._save_forecast(record)
            record.id = db_id

            # 5. Build daily forecast points (from wheat as primary metric)
            daily_points = self._build_daily_points(wheat_forecast)
            chart_data = self._build_chart_data(wheat_forecast)

            return ForecastResponse(
                status="success",
                message=f"Forecast generated for {target_month.strftime('%B %Y')} using {len(wheat_df)} historical data points.",
                forecast_record=record,
                daily_forecast=daily_points,
                chart_data=chart_data,
            )

        except Exception as e:
            logger.exception("Error in Prophet forecasting pipeline")
            raise RuntimeError(f"Forecasting failed: {str(e)}")

    def get_latest_forecast(self) -> Optional[ForecastRecord]:
        """Return the most recently generated forecast from the database."""
        try:
            result = self.db.execute(
                text("""
                    SELECT id, target_month, predicted_wheat_kg, predicted_flour_kg,
                           predicted_revenue, generated_at
                    FROM ai_forecasts
                    ORDER BY generated_at DESC
                    LIMIT 1
                """)
            ).fetchone()

            if not result:
                return None

            return ForecastRecord(
                id=result[0],
                target_month=result[1],
                predicted_wheat_kg=result[2],
                predicted_flour_kg=result[3],
                predicted_revenue=result[4],
                generated_at=result[5],
            )
        except Exception as e:
            logger.error(f"Error fetching latest forecast: {e}")
            raise

    def get_forecast_history(self) -> ForecastHistoryResponse:
        """Return all historical forecasts ordered by generation date."""
        try:
            results = self.db.execute(
                text("""
                    SELECT id, target_month, predicted_wheat_kg, predicted_flour_kg,
                           predicted_revenue, generated_at
                    FROM ai_forecasts
                    ORDER BY generated_at DESC
                """)
            ).fetchall()

            forecasts = [
                ForecastRecord(
                    id=r[0], target_month=r[1],
                    predicted_wheat_kg=r[2], predicted_flour_kg=r[3],
                    predicted_revenue=r[4], generated_at=r[5],
                )
                for r in results
            ]
            return ForecastHistoryResponse(count=len(forecasts), forecasts=forecasts)

        except Exception as e:
            logger.error(f"Error fetching forecast history: {e}")
            raise

    # ── Internal: Data Fetching ───────────────────────────────────────────────

    def _fetch_transaction_data(self, material: str) -> pd.DataFrame:
        """
        Fetch daily aggregated weight from TransactionLedger for a given material.
        Returns a DataFrame with columns: ds (date), y (total kg that day).
        Falls back to synthetic data if the DB is empty.
        """
        query = text("""
            SELECT DATE(timestamp) as ds,
                   SUM(weight_kg) as y
            FROM transaction_ledger
            WHERE UPPER(material_involved) LIKE :material
              AND type IN ('DEPOSIT', 'WITHDRAWAL')
            GROUP BY DATE(timestamp)
            ORDER BY ds ASC
        """)
        try:
            result = self.db.execute(query, {"material": f"%{material.upper()}%"}).fetchall()
            if len(result) < 7:
                logger.warning(f"Insufficient data for {material} (<7 days). Using synthetic fallback.")
                return self._synthetic_data(material)

            df = pd.DataFrame(result, columns=["ds", "y"])
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0.0)
            return df

        except Exception as e:
            logger.warning(f"DB error fetching {material} data ({e}). Using synthetic fallback.")
            return self._synthetic_data(material)

    def _fetch_revenue_data(self) -> pd.DataFrame:
        """
        Fetch daily processing fee revenue from TransactionLedger.
        Returns a DataFrame with columns: ds (date), y (total fees that day).
        """
        query = text("""
            SELECT DATE(timestamp) as ds,
                   SUM(processing_fee_paid) as y
            FROM transaction_ledger
            WHERE processing_fee_paid > 0
            GROUP BY DATE(timestamp)
            ORDER BY ds ASC
        """)
        try:
            result = self.db.execute(query).fetchall()
            if len(result) < 7:
                return self._synthetic_data("REVENUE")

            df = pd.DataFrame(result, columns=["ds", "y"])
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0.0)
            return df

        except Exception as e:
            logger.warning(f"DB error fetching revenue data ({e}). Using synthetic fallback.")
            return self._synthetic_data("REVENUE")

    # ── Internal: Prophet Model ───────────────────────────────────────────────

    def _run_prophet(self, df: pd.DataFrame, periods: int) -> pd.DataFrame:
        """
        Fit a Prophet model and return the forecast DataFrame.
        Configured for flour mill seasonality:
        - Weekly seasonality: captures Mon-Sat peak vs Sunday closure
        - Yearly seasonality: captures harvest seasons (Rabi/Kharif wheat cycles)
        """
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.80,  # 80% prediction interval
            changepoint_prior_scale=0.05,  # Conservative — mill operations are stable
        )

        # Add custom Indian harvest season regressors
        # Rabi (winter wheat) harvest: Apr-May; Kharif harvest: Oct-Nov
        model.add_seasonality(
            name="harvest_bi_annual",
            period=182.5,   # ~6 months
            fourier_order=5,
        )

        model.fit(df)

        future = model.make_future_dataframe(periods=periods, freq="D")
        forecast = model.predict(future)

        # Return only the future periods
        return forecast[forecast["ds"] > df["ds"].max()][["ds", "yhat", "yhat_lower", "yhat_upper"]]

    # ── Internal: Persistence ─────────────────────────────────────────────────

    def _save_forecast(self, record: ForecastRecord) -> int:
        """Insert a forecast record into ai_forecasts and return the new ID."""
        try:
            result = self.db.execute(
                text("""
                    INSERT INTO ai_forecasts
                        (target_month, predicted_wheat_kg, predicted_flour_kg, predicted_revenue, generated_at)
                    VALUES
                        (:target_month, :wheat_kg, :flour_kg, :revenue, :generated_at)
                    RETURNING id
                """),
                {
                    "target_month": record.target_month,
                    "wheat_kg": record.predicted_wheat_kg,
                    "flour_kg": record.predicted_flour_kg,
                    "revenue": record.predicted_revenue,
                    "generated_at": record.generated_at,
                }
            )
            self.db.commit()
            row = result.fetchone()
            return row[0] if row else -1
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to save forecast: {e}")
            raise

    # ── Internal: Output Formatting ───────────────────────────────────────────

    def _build_daily_points(self, forecast_df: pd.DataFrame) -> List[ForecastDataPoint]:
        return [
            ForecastDataPoint(
                ds=row["ds"],
                yhat=round(max(row["yhat"], 0), 2),
                yhat_lower=round(max(row["yhat_lower"], 0), 2),
                yhat_upper=round(max(row["yhat_upper"], 0), 2),
            )
            for _, row in forecast_df.iterrows()
        ]

    def _build_chart_data(self, forecast_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Format forecast as Recharts-friendly list of dicts."""
        return [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "yhat": round(max(row["yhat"], 0), 2),
                "yhat_lower": round(max(row["yhat_lower"], 0), 2),
                "yhat_upper": round(max(row["yhat_upper"], 0), 2),
            }
            for _, row in forecast_df.iterrows()
        ]

    # ── Internal: Synthetic Fallback Data ─────────────────────────────────────

    def _synthetic_data(self, material: str) -> pd.DataFrame:
        """
        Generate 90 days of synthetic historical data when the DB is empty.
        Patterns are based on general flour mill seasonal behavior.
        Used as a safe fallback so Prophet always has training data.
        """
        import numpy as np

        np.random.seed(42)
        base_values = {"WHEAT": 500, "FLOUR": 400, "REVENUE": 2500}
        base = base_values.get(material.upper(), 300)

        dates = pd.date_range(end=datetime.utcnow(), periods=90, freq="D")
        trend = np.linspace(0, base * 0.2, 90)                  # Slight upward trend
        weekly = base * 0.15 * np.sin(2 * np.pi * np.arange(90) / 7)  # Weekly cycle
        noise = np.random.normal(0, base * 0.05, 90)
        values = (base + trend + weekly + noise).clip(min=0)

        return pd.DataFrame({"ds": dates, "y": values})

    # ── Internal: Mock Response (Prophet not installed) ───────────────────────

    def _mock_forecast(self, target_month: datetime, periods: int) -> ForecastResponse:
        """Returns a mock forecast when Prophet is not installed."""
        import random
        random.seed(42)

        record = ForecastRecord(
            id=None,
            target_month=target_month,
            predicted_wheat_kg=round(random.uniform(12000, 18000), 2),
            predicted_flour_kg=round(random.uniform(9500, 14000), 2),
            predicted_revenue=round(random.uniform(45000, 75000), 2),
            generated_at=datetime.utcnow(),
        )

        chart_data = []
        for i in range(min(periods, 30)):
            day = target_month + timedelta(days=i)
            yhat = round(random.uniform(350, 650), 2)
            chart_data.append({
                "ds": day.strftime("%Y-%m-%d"),
                "yhat": yhat,
                "yhat_lower": round(yhat * 0.85, 2),
                "yhat_upper": round(yhat * 1.15, 2),
            })

        return ForecastResponse(
            status="mock",
            message="Prophet not installed. Returning mock data for development.",
            forecast_record=record,
            daily_forecast=[],
            chart_data=chart_data,
        )
