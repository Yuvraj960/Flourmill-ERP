"""
MillStream ERP — AI Microservice
services/procurement_service.py

AI Pillar 2: Smart Procurement Optimization.

Workflow:
1. Fetch latest wheat commodity prices from Alpha Vantage API
2. Store fetched prices in commodity_prices table
3. Compute moving averages (7-day and 30-day) from stored history
4. Apply recommendation logic:
   - BUY_NOW:         price is ≥5% below 30-day MA (dip opportunity)
   - WAIT:            price is above 7-day MA and rising (wait for correction)
   - INCREASE_STOCK:  current stock at or below reorder threshold
   - HOLD:            no strong signal either way
5. Return ProcurementRecommendation with confidence score + reasoning
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

import requests
from sqlalchemy import text
from sqlalchemy.orm import Session

from config.settings import settings
from models.schemas import (
    CommodityPriceRecord,
    ProcurementRecommendation,
    ProcurementPricesResponse,
    ProcurementHistoryResponse,
    PriceStatistics,
    RecommendationAction,
)

logger = logging.getLogger(__name__)

# Alpha Vantage maps agricultural commodity to its ticker symbol
MATERIAL_TICKER_MAP = {
    "WHEAT": "WHEAT",
    "CORN": "CORN",
    "SOYBEAN": "SOYBEAN",
}

# Conversion: Alpha Vantage returns prices in USD per bushel for wheat.
# 1 bushel of wheat ≈ 27.2155 kg
BUSHEL_TO_KG = 27.2155


class ProcurementService:
    """Handles commodity price fetching and buy/wait recommendation logic."""

    def __init__(self, db: Session):
        self.db = db

    # ── Main entry points ─────────────────────────────────────────────────────

    def fetch_and_store_prices(self) -> ProcurementPricesResponse:
        """
        Fetch the latest commodity prices from Alpha Vantage and store them.
        Returns a ProcurementPricesResponse with the fetched records.
        """
        prices = self._fetch_from_alpha_vantage("WHEAT")

        if not prices:
            # Fallback: generate a mock price if API is not configured
            prices = self._mock_price_data()

        saved = self._save_prices(prices)

        return ProcurementPricesResponse(
            status="success" if prices else "mock",
            message=f"Fetched and stored {len(saved)} price records for WHEAT.",
            prices_fetched=len(saved),
            prices=saved,
        )

    def get_recommendation(self, material: str = "WHEAT") -> ProcurementRecommendation:
        """
        Analyze stored price history and return a buy/wait/increase recommendation.
        """
        history = self._get_price_history(material, days=60)

        if len(history) < 7:
            # Not enough data — check stock level and fall back
            return self._fallback_recommendation(material, history)

        stats = self._compute_statistics(history)
        action, confidence, reasoning = self._apply_recommendation_rules(stats, material)

        return ProcurementRecommendation(
            material=material,
            action=action,
            confidence_score=confidence,
            reasoning=reasoning,
            price_stats=stats,
            generated_at=datetime.utcnow(),
        )

    def get_price_history(self, material: str = "WHEAT", days: int = 30) -> ProcurementHistoryResponse:
        """Return stored price history for a material."""
        records = self._get_price_history(material, days)
        return ProcurementHistoryResponse(
            material=material,
            count=len(records),
            prices=records,
        )

    # ── Internal: Alpha Vantage API ───────────────────────────────────────────

    def _fetch_from_alpha_vantage(self, material: str) -> List[CommodityPriceRecord]:
        """
        Fetch monthly commodity prices from Alpha Vantage.
        Returns a list of CommodityPriceRecord (one per month, last 12 months).
        Returns empty list if API key is missing or request fails.
        """
        api_key = settings.ALPHA_VANTAGE_API_KEY
        if not api_key or api_key == "your-alpha-vantage-key":
            logger.warning("ALPHA_VANTAGE_API_KEY not configured. Using mock data.")
            return []

        ticker = MATERIAL_TICKER_MAP.get(material.upper(), "WHEAT")
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "WHEAT",     # Alpha Vantage global commodities endpoint
            "interval": "monthly",
            "apikey": api_key,
        }

        try:
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if "data" not in data:
                logger.warning(f"Unexpected Alpha Vantage response: {list(data.keys())}")
                return []

            records = []
            cutoff = datetime.utcnow() - timedelta(days=365)

            for entry in data["data"][:12]:  # Last 12 monthly entries
                try:
                    date = datetime.strptime(entry["date"], "%Y-%m-%d")
                    if date < cutoff:
                        continue
                    # Convert USD/bushel → USD/kg
                    price_per_bushel = float(entry["value"])
                    price_per_kg = round(price_per_bushel / BUSHEL_TO_KG, 4)
                    records.append(CommodityPriceRecord(
                        material=material,
                        price_per_kg=price_per_kg,
                        recorded_at=date,
                        source_api="alpha_vantage",
                    ))
                except (KeyError, ValueError) as e:
                    logger.debug(f"Skipping malformed price entry: {e}")

            return records

        except requests.RequestException as e:
            logger.error(f"Alpha Vantage API request failed: {e}")
            return []

    # ── Internal: Statistics & Rules ─────────────────────────────────────────

    def _compute_statistics(self, history: List[CommodityPriceRecord]) -> PriceStatistics:
        """Compute price statistics from stored history."""
        prices = [r.price_per_kg for r in history]
        current = prices[-1]                        # Most recent price
        last_7 = prices[-7:] if len(prices) >= 7 else prices
        last_30 = prices[-30:] if len(prices) >= 30 else prices

        avg_7 = sum(last_7) / len(last_7)
        avg_30 = sum(last_30) / len(last_30)

        change_7d_pct = ((current - last_7[0]) / last_7[0] * 100) if last_7[0] != 0 else 0
        change_30d_pct = ((current - last_30[0]) / last_30[0] * 100) if last_30[0] != 0 else 0

        return PriceStatistics(
            current_price=round(current, 4),
            avg_7_day=round(avg_7, 4),
            avg_30_day=round(avg_30, 4),
            price_change_7d_pct=round(change_7d_pct, 2),
            price_change_30d_pct=round(change_30d_pct, 2),
            data_points=len(prices),
        )

    def _apply_recommendation_rules(
        self,
        stats: PriceStatistics,
        material: str,
    ) -> tuple[RecommendationAction, float, str]:
        """
        Apply business rules to generate a recommendation.
        Returns (action, confidence_score, reasoning string).

        Rules (in priority order):
        1. INCREASE_STOCK if current stock is below reorder threshold
        2. BUY_NOW if current price is ≥5% below 30-day moving average
        3. WAIT if price is ≥3% above both 7-day and 30-day MA (downtrend expected)
        4. HOLD otherwise
        """
        # Rule 1: Stock-level check (highest priority)
        stock_below_reorder = self._is_stock_below_reorder(material)
        if stock_below_reorder:
            return (
                RecommendationAction.INCREASE_STOCK,
                0.92,
                (
                    f"Current {material} inventory is at or below the reorder threshold. "
                    f"Immediate procurement is recommended regardless of price conditions. "
                    f"Current price: ${stats.current_price:.4f}/kg."
                ),
            )

        # Rule 2: Price dip — BUY_NOW
        pct_below_30d = (stats.avg_30_day - stats.current_price) / stats.avg_30_day * 100
        if pct_below_30d >= 5.0:
            confidence = min(0.55 + (pct_below_30d - 5.0) * 0.04, 0.95)
            return (
                RecommendationAction.BUY_NOW,
                round(confidence, 2),
                (
                    f"Wheat price is {pct_below_30d:.1f}% below the 30-day moving average "
                    f"(${stats.avg_30_day:.4f}/kg). This is a favourable buying window. "
                    f"Current price: ${stats.current_price:.4f}/kg."
                ),
            )

        # Rule 3: Rising price — WAIT
        price_above_7d = (stats.current_price - stats.avg_7_day) / stats.avg_7_day * 100
        price_above_30d = (stats.current_price - stats.avg_30_day) / stats.avg_30_day * 100
        if price_above_7d >= 3.0 and price_above_30d >= 3.0:
            confidence = min(0.50 + (price_above_7d * 0.03), 0.88)
            return (
                RecommendationAction.WAIT,
                round(confidence, 2),
                (
                    f"Wheat price is {price_above_7d:.1f}% above the 7-day MA and "
                    f"{price_above_30d:.1f}% above the 30-day MA. "
                    f"Prices may correct in the coming days. "
                    f"Recommend waiting 1–2 weeks before bulk purchasing."
                ),
            )

        # Rule 4: No strong signal — HOLD
        return (
            RecommendationAction.HOLD,
            0.60,
            (
                f"Wheat prices are near their average. No strong signal for immediate action. "
                f"Current: ${stats.current_price:.4f}/kg, 7-day avg: ${stats.avg_7_day:.4f}/kg, "
                f"30-day avg: ${stats.avg_30_day:.4f}/kg. Monitor for the next 3–5 days."
            ),
        )

    # ── Internal: Database ────────────────────────────────────────────────────

    def _save_prices(self, prices: List[CommodityPriceRecord]) -> List[CommodityPriceRecord]:
        """Insert price records into commodity_prices. Skip duplicates (same material + date)."""
        saved = []
        for p in prices:
            try:
                result = self.db.execute(
                    text("""
                        INSERT INTO commodity_prices (material, price_per_kg, recorded_at, source_api)
                        VALUES (:material, :price_per_kg, :recorded_at, :source_api)
                        ON CONFLICT DO NOTHING
                        RETURNING id, recorded_at
                    """),
                    {
                        "material": p.material,
                        "price_per_kg": p.price_per_kg,
                        "recorded_at": p.recorded_at or datetime.utcnow(),
                        "source_api": p.source_api,
                    }
                )
                self.db.commit()
                row = result.fetchone()
                if row:
                    p.id = row[0]
                    p.recorded_at = row[1]
                    saved.append(p)
            except Exception as e:
                self.db.rollback()
                logger.warning(f"Failed to save price record: {e}")
        return saved

    def _get_price_history(self, material: str, days: int = 30) -> List[CommodityPriceRecord]:
        """Fetch price history for a material from the last N days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        try:
            result = self.db.execute(
                text("""
                    SELECT id, material, price_per_kg, recorded_at, source_api
                    FROM commodity_prices
                    WHERE UPPER(material) = :material
                      AND recorded_at >= :cutoff
                    ORDER BY recorded_at ASC
                """),
                {"material": material.upper(), "cutoff": cutoff}
            ).fetchall()

            return [
                CommodityPriceRecord(
                    id=r[0], material=r[1], price_per_kg=r[2],
                    recorded_at=r[3], source_api=r[4]
                )
                for r in result
            ]
        except Exception as e:
            logger.error(f"Error fetching price history: {e}")
            return []

    def _is_stock_below_reorder(self, material: str) -> bool:
        """Check if the current inventory for a material is at or below its reorder threshold."""
        try:
            result = self.db.execute(
                text("""
                    SELECT current_stock_kg < reorder_threshold_kg
                    FROM inventory
                    WHERE UPPER(item_name) LIKE :material
                    LIMIT 1
                """),
                {"material": f"%{material.upper()}%"}
            ).scalar()
            return bool(result)
        except Exception:
            return False  # Can't determine stock level — don't trigger alarm

    # ── Internal: Fallback & Mock ─────────────────────────────────────────────

    def _fallback_recommendation(
        self, material: str, history: List[CommodityPriceRecord]
    ) -> ProcurementRecommendation:
        """Recommendation when there's insufficient price history."""
        stats = PriceStatistics(
            current_price=0.0,
            avg_7_day=0.0,
            avg_30_day=0.0,
            price_change_7d_pct=0.0,
            price_change_30d_pct=0.0,
            data_points=len(history),
        )
        if history:
            stats.current_price = history[-1].price_per_kg

        return ProcurementRecommendation(
            material=material,
            action=RecommendationAction.HOLD,
            confidence_score=0.30,
            reasoning=(
                f"Insufficient price history ({len(history)} data points, need ≥7). "
                "Run GET /procurement/prices to fetch fresh data first."
            ),
            price_stats=stats,
            generated_at=datetime.utcnow(),
        )

    def _mock_price_data(self) -> List[CommodityPriceRecord]:
        """Generate 30 days of mock WHEAT prices (in USD/kg) for development."""
        import random, math
        random.seed(99)
        base = 0.22  # ~$0.22 USD/kg wheat
        records = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=30 - i)
            price = base + 0.02 * math.sin(i / 5) + random.uniform(-0.005, 0.005)
            records.append(CommodityPriceRecord(
                material="WHEAT",
                price_per_kg=round(price, 4),
                recorded_at=date,
                source_api="mock",
            ))
        return records
