"""
MillStream ERP — AI Microservice
routers/forecasting.py

API Pillar 1: Demand Forecasting endpoints.

Endpoints:
    POST /forecast/generate   — Run Prophet forecast for next month
    GET  /forecast/latest     — Return the most recent stored forecast
    GET  /forecast/history    — Return all historical forecasts
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import (
    ForecastRequest,
    ForecastResponse,
    ForecastRecord,
    ForecastHistoryResponse,
    ErrorResponse,
)
from services.forecasting_service import ForecastingService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/forecast",
    tags=["Demand Forecasting"],
    responses={500: {"model": ErrorResponse}},
)


@router.post(
    "/generate",
    response_model=ForecastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Demand Forecast",
    description=(
        "Runs a Prophet time-series model against historical TransactionLedger data "
        "to predict next month's wheat demand (kg), flour demand (kg), and "
        "processing fee revenue. Stores the aggregate in the ai_forecasts table "
        "and returns both the monthly summary and daily Recharts-ready data."
    ),
)
async def generate_forecast(
    request: ForecastRequest = ForecastRequest(),
    db: Session = Depends(get_db),
) -> ForecastResponse:
    """Trigger Prophet forecasting pipeline and persist results."""
    logger.info(f"Forecast generation requested — periods={request.periods}")
    try:
        service = ForecastingService(db)
        result = service.generate_forecast(periods=request.periods)
        logger.info(f"Forecast generated: status={result.status}")
        return result
    except RuntimeError as e:
        logger.error(f"Forecasting pipeline error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Unexpected error in forecast generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/latest",
    response_model=ForecastRecord,
    summary="Get Latest Forecast",
    description="Returns the most recently generated and stored demand forecast from the database.",
)
async def get_latest_forecast(
    db: Session = Depends(get_db),
) -> ForecastRecord:
    """Retrieve the latest stored forecast record."""
    try:
        service = ForecastingService(db)
        result = service.get_latest_forecast()
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No forecasts found. Run POST /forecast/generate first.",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching latest forecast")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/history",
    response_model=ForecastHistoryResponse,
    summary="Get Forecast History",
    description="Returns all historical forecasts ordered by generation date (newest first).",
)
async def get_forecast_history(
    db: Session = Depends(get_db),
) -> ForecastHistoryResponse:
    """Retrieve all stored forecast records."""
    try:
        service = ForecastingService(db)
        return service.get_forecast_history()
    except Exception as e:
        logger.exception("Error fetching forecast history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
