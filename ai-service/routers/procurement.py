"""
MillStream ERP — AI Microservice
routers/procurement.py

AI Pillar 2: Smart Procurement endpoints.

Endpoints:
    GET  /procurement/prices      — Fetch + store latest commodity prices
    GET  /procurement/recommend   — Return buy/wait/increase recommendation
    GET  /procurement/history     — Return stored commodity price history
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import (
    ProcurementRecommendation,
    ProcurementPricesResponse,
    ProcurementHistoryResponse,
    ErrorResponse,
)
from services.procurement_service import ProcurementService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/procurement",
    tags=["Smart Procurement"],
    responses={500: {"model": ErrorResponse}},
)


@router.get(
    "/prices",
    response_model=ProcurementPricesResponse,
    summary="Fetch Latest Commodity Prices",
    description=(
        "Fetches the latest WHEAT commodity prices from Alpha Vantage API "
        "and stores them in the commodity_prices table. Requires "
        "ALPHA_VANTAGE_API_KEY to be set in .env. Falls back to mock data for development."
    ),
)
async def fetch_commodity_prices(
    material: str = Query(default="WHEAT", description="Commodity material to fetch (e.g., WHEAT)"),
    db: Session = Depends(get_db),
) -> ProcurementPricesResponse:
    """Fetch and persist latest commodity prices from external API."""
    logger.info(f"Commodity price fetch requested for material={material}")
    try:
        service = ProcurementService(db)
        result = service.fetch_and_store_prices()
        return result
    except Exception as e:
        logger.exception("Error fetching commodity prices")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/recommend",
    response_model=ProcurementRecommendation,
    summary="Get Procurement Recommendation",
    description=(
        "Analyzes stored WHEAT price history using 7-day and 30-day moving averages "
        "and current inventory stock levels. Returns one of: BUY_NOW, WAIT, "
        "INCREASE_STOCK, or HOLD — with a confidence score and plain-language reasoning."
    ),
)
async def get_procurement_recommendation(
    material: str = Query(default="WHEAT", description="Material to analyze (e.g., WHEAT)"),
    db: Session = Depends(get_db),
) -> ProcurementRecommendation:
    """Analyze price trends and return a buy/wait recommendation."""
    logger.info(f"Procurement recommendation requested for material={material}")
    try:
        service = ProcurementService(db)
        result = service.get_recommendation(material=material.upper())
        return result
    except Exception as e:
        logger.exception("Error generating procurement recommendation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/history",
    response_model=ProcurementHistoryResponse,
    summary="Get Price History",
    description="Returns stored commodity price records for the specified material and time window.",
)
async def get_price_history(
    material: str = Query(default="WHEAT", description="Material to fetch history for"),
    days: int = Query(default=30, ge=1, le=365, description="Number of past days to retrieve"),
    db: Session = Depends(get_db),
) -> ProcurementHistoryResponse:
    """Retrieve historical commodity price records from the database."""
    try:
        service = ProcurementService(db)
        return service.get_price_history(material=material.upper(), days=days)
    except Exception as e:
        logger.exception("Error fetching price history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
