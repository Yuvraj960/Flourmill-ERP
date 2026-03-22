"""
MillStream ERP — AI Microservice
models/schemas.py

All Pydantic request and response models for the three AI pillars.
These are validated on every request/response boundary by FastAPI.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────────────────────────────────────────
# Shared / Common
# ─────────────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# AI Pillar 1 — Demand Forecasting
# ─────────────────────────────────────────────────────────────────────────────

class ForecastRequest(BaseModel):
    """Optional parameters to control forecast generation."""
    periods: int = Field(default=30, ge=7, le=365, description="Number of future days to forecast")
    target_material: Optional[str] = Field(default=None, description="Filter to a specific material (e.g., WHEAT)")

    model_config = {"json_schema_extra": {"example": {"periods": 30}}}


class ForecastDataPoint(BaseModel):
    """A single day's forecast output from Prophet."""
    ds: datetime = Field(..., description="Date of forecast")
    yhat: float = Field(..., description="Predicted value")
    yhat_lower: float = Field(..., description="Lower bound (80% confidence)")
    yhat_upper: float = Field(..., description="Upper bound (80% confidence)")


class ForecastRecord(BaseModel):
    """Monthly aggregate stored in the ai_forecasts table."""
    id: Optional[int] = None
    target_month: datetime
    predicted_wheat_kg: float
    predicted_flour_kg: float
    predicted_revenue: float
    generated_at: Optional[datetime] = None


class ForecastResponse(BaseModel):
    """Full response from POST /forecast/generate."""
    status: str
    message: str
    forecast_record: ForecastRecord
    daily_forecast: List[ForecastDataPoint] = Field(
        default=[], description="Day-by-day Prophet output (max 30 days)"
    )
    chart_data: List[Dict[str, Any]] = Field(
        default=[], description="Recharts-compatible format: [{ds, yhat, yhat_lower, yhat_upper}]"
    )


class ForecastHistoryResponse(BaseModel):
    """Response from GET /forecast/history."""
    count: int
    forecasts: List[ForecastRecord]


# ─────────────────────────────────────────────────────────────────────────────
# AI Pillar 2 — Smart Procurement
# ─────────────────────────────────────────────────────────────────────────────

class RecommendationAction(str, Enum):
    BUY_NOW = "BUY_NOW"
    WAIT = "WAIT"
    INCREASE_STOCK = "INCREASE_STOCK"
    HOLD = "HOLD"


class CommodityPriceRecord(BaseModel):
    """A single price entry from the commodity_prices table."""
    id: Optional[int] = None
    material: str
    price_per_kg: float
    recorded_at: Optional[datetime] = None
    source_api: str = "alpha_vantage"


class PriceStatistics(BaseModel):
    """Statistical summary of recent commodity prices."""
    current_price: float
    avg_7_day: float
    avg_30_day: float
    price_change_7d_pct: float
    price_change_30d_pct: float
    data_points: int


class ProcurementRecommendation(BaseModel):
    """Full procurement recommendation response."""
    material: str
    action: RecommendationAction
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="0.0 to 1.0")
    reasoning: str
    price_stats: PriceStatistics
    generated_at: datetime


class ProcurementPricesResponse(BaseModel):
    """Response from GET /procurement/prices."""
    status: str
    message: str
    prices_fetched: int
    prices: List[CommodityPriceRecord]


class ProcurementHistoryResponse(BaseModel):
    """Response from GET /procurement/history."""
    material: str
    count: int
    prices: List[CommodityPriceRecord]


# ─────────────────────────────────────────────────────────────────────────────
# AI Pillar 3 — RAG Text-to-SQL Chat
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Admin's natural language question."""
    question: str = Field(..., min_length=5, max_length=500, description="Natural language query")

    model_config = {
        "json_schema_extra": {
            "example": {
                "question": "What was the total processing revenue last month?"
            }
        }
    }


class ChatResponse(BaseModel):
    """Full RAG pipeline response."""
    question: str
    generated_sql: str
    raw_data: List[Dict[str, Any]] = Field(default=[], description="Raw SQL result rows")
    row_count: int
    answer: str = Field(..., description="Human-readable summary from LLM")
    warning: Optional[str] = Field(None, description="Any safety or data warnings")
    generated_at: datetime
