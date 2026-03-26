"""
MillStream ERP — AI Microservice
routers/chat.py

AI Pillar 3: RAG Text-to-SQL Chat Assistant endpoint.

Endpoint:
    POST /chat/query   — Accepts natural language question, returns SQL + answer
    POST /chat/refresh — Forces schema cache refresh (admin utility)
"""

import logging
from fastapi import APIRouter, HTTPException, status

from models.schemas import ChatRequest, ChatResponse, ErrorResponse
from services.rag_service import rag_service_instance

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["RAG Text-to-SQL Chat"],
    responses={500: {"model": ErrorResponse}},
)


@router.post(
    "/query",
    response_model=ChatResponse,
    summary="Natural Language Database Query",
    description=(
        "Accepts an admin's natural language question and runs the full RAG "
        "Text-to-SQL pipeline:\n"
        "1. Schema context is injected into the LLM prompt\n"
        "2. LLM generates a validated, read-only SELECT query\n"
        "3. Query is executed against the Supabase PostgreSQL database\n"
        "4. LLM formats the results into a human-readable answer\n\n"
        "**Safety:** Only SELECT statements are executed. All queries have a "
        "5-second timeout and 100-row result cap.\n\n"
        "**Example questions:**\n"
        "- 'What was total processing revenue last quarter?'\n"
        "- 'Show customers with vault balance > 500kg'\n"
        "- 'How many WHEAT deposits were made this month?'"
    ),
)
async def query_database(request: ChatRequest) -> ChatResponse:
    """RAG pipeline: natural language -> SQL -> human answer."""
    logger.info(f"Chat query received: '{request.question[:60]}...'")
    try:
        response = rag_service_instance.process_query(request)
        logger.info(f"Chat response: rows={response.row_count}, warning={bool(response.warning)}")
        return response
    except Exception as e:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat pipeline failed: {str(e)}",
        )


@router.post(
    "/refresh-schema",
    summary="Refresh Schema Cache",
    description="Forces re-introspection of the DB schema. Useful after Prisma migrations.",
    status_code=status.HTTP_200_OK,
)
async def refresh_schema_cache() -> dict:
    """Invalidate cached DB schema so it's re-fetched on next /chat/query."""
    rag_service_instance.refresh_schema()
    logger.info("Schema cache cleared by admin request")
    return {
        "status": "success",
        "message": "Schema cache cleared. Will refresh on next /chat/query call.",
    }
