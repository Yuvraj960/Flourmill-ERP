"""
MillStream ERP — AI Microservice
services/rag_service.py

AI Pillar 3: RAG Text-to-SQL Chat Assistant.

Implements the exact 7-step workflow defined in rag_workflow.md:
  1. Admin types question in React UI
  2. Request hits Node.js API → proxied to Python FastAPI
  3. LangChain/LLM receives prompt + PostgreSQL schema context
  4. LLM generates valid SQL query
  5. Python backend executes query against Supabase (read-only role)
  6. LLM formats numeric result into human-readable sentence
  7. Sent back to React UI

Safety guardrails (enforced by database/connection.py):
  - SELECT-only (DML/DDL blocked)
  - 5-second statement timeout
  - 100-row result cap
"""

import logging
import re
from datetime import datetime
from typing import Optional

from models.schemas import ChatRequest, ChatResponse
from database.connection import execute_readonly_sql, get_db_schema_context
from config.settings import settings

logger = logging.getLogger(__name__)


# ── LangChain Import Guard ────────────────────────────────────────────────────
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning("LangChain / OpenAI not installed. Chat endpoints will return mock responses.")


# ── System Prompt ─────────────────────────────────────────────────────────────

SQL_GENERATION_SYSTEM_PROMPT = """You are an expert PostgreSQL analyst for MillStream ERP, a flour mill management system.

Your job is to convert an admin's natural language question into a single, valid PostgreSQL SELECT query.

DATABASE SCHEMA:
{schema}

RULES (STRICT — you MUST follow all of them):
1. Generate ONLY a single SQL SELECT statement. Never generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or TRUNCATE.
2. Always qualify column names with table aliases to avoid ambiguity.
3. Use exact column and table names as shown in the schema (PostgreSQL is case-sensitive with quoted names).
4. If the question cannot be answered with the available tables, return exactly: SELECT 'NO_ANSWER' AS result;
5. Add a LIMIT 100 clause unless the question asks for aggregated totals.
6. Use appropriate JOINs when data spans multiple tables.
7. For date/time filtering, use PostgreSQL timestamp syntax (e.g., NOW() - INTERVAL '30 days').
8. NEVER add explanations, comments, or markdown — return ONLY the raw SQL query.

SQL QUERY:"""

ANSWER_FORMATTING_SYSTEM_PROMPT = """You are a helpful ERP assistant for MillStream, a flour mill management system.

The admin asked: "{question}"

The SQL query executed was:
{sql}

The raw data returned ({row_count} rows):
{raw_data}

Turn this data into a clear, professional, one to three sentence summary for the admin.
- Use specific numbers from the data (kg, revenue in PKR, customer counts, etc.)
- Be concise and factual
- If the query matched no rows, say so clearly
- Do NOT mention SQL or technical details
- Do NOT use markdown formatting in your response"""


class RAGService:
    """Implements the LangChain Text-to-SQL RAG pipeline."""

    def __init__(self):
        self.schema_context: Optional[str] = None
        self._llm = None

    # ── Main Entry Point ──────────────────────────────────────────────────────

    def process_query(self, request: ChatRequest) -> ChatResponse:
        """
        Full 7-step RAG pipeline.
        Returns ChatResponse with generated SQL, raw data, and human answer.
        """
        question = request.question.strip()
        logger.info(f"RAG query received: '{question[:80]}...'")

        if not LANGCHAIN_AVAILABLE:
            return self._mock_response(question)

        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-...":
            return self._no_api_key_response(question)

        try:
            # Step 3: Get schema context (cached after first call)
            schema = self._get_schema()

            # Step 4: LLM generates SQL
            generated_sql = self._generate_sql(question, schema)
            logger.info(f"Generated SQL: {generated_sql[:200]}")

            # Validate the SQL is safe (redundant with DB layer — defense in depth)
            self._validate_sql(generated_sql)

            # Step 5: Execute against read-only database
            warning = None
            try:
                raw_data = execute_readonly_sql(generated_sql)
            except ValueError as e:
                # Unsafe SQL generated — return a safe error
                logger.warning(f"Unsafe SQL blocked: {e}")
                return ChatResponse(
                    question=question,
                    generated_sql=generated_sql,
                    raw_data=[],
                    row_count=0,
                    answer=f"I generated a query that was blocked for safety reasons: {str(e)}. Please rephrase your question.",
                    warning=str(e),
                    generated_at=datetime.utcnow(),
                )
            except Exception as e:
                logger.error(f"SQL execution error: {e}")
                return ChatResponse(
                    question=question,
                    generated_sql=generated_sql,
                    raw_data=[],
                    row_count=0,
                    answer="The query could not be executed. The database may not be available or the query may have a syntax error. Please try a different question.",
                    warning=str(e),
                    generated_at=datetime.utcnow(),
                )

            # Check for no_answer sentinel
            if raw_data and raw_data[0].get("result") == "NO_ANSWER":
                return ChatResponse(
                    question=question,
                    generated_sql=generated_sql,
                    raw_data=[],
                    row_count=0,
                    answer="I couldn't find the data you're looking for in the available database tables. Could you rephrase the question?",
                    generated_at=datetime.utcnow(),
                )

            # Step 6: LLM formats the result into a human-readable sentence
            answer = self._format_answer(question, generated_sql, raw_data)

            # Step 7: Return to React UI
            return ChatResponse(
                question=question,
                generated_sql=generated_sql,
                raw_data=raw_data,
                row_count=len(raw_data),
                answer=answer,
                warning=warning,
                generated_at=datetime.utcnow(),
            )

        except Exception as e:
            logger.exception("Unexpected RAG pipeline error")
            return ChatResponse(
                question=question,
                generated_sql="",
                raw_data=[],
                row_count=0,
                answer=f"An error occurred while processing your question: {str(e)}",
                warning=str(e),
                generated_at=datetime.utcnow(),
            )

    # ── Internal: Schema Context ──────────────────────────────────────────────

    def _get_schema(self) -> str:
        """Get schema context, with a 1-request cache to avoid repeated DB introspection."""
        if self.schema_context is None:
            self.schema_context = get_db_schema_context()
        return self.schema_context

    def refresh_schema(self):
        """Force schema re-introspection on next request."""
        self.schema_context = None

    # ── Internal: LLM Calls ───────────────────────────────────────────────────

    def _get_llm(self) -> "ChatOpenAI":
        """Lazy-init the LangChain ChatOpenAI client."""
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=settings.LLM_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0,           # Deterministic SQL generation
                max_tokens=512,
                timeout=30,
            )
        return self._llm

    def _generate_sql(self, question: str, schema: str) -> str:
        """Step 4: Use LLM to generate a SQL query from the natural language question."""
        llm = self._get_llm()

        system_content = SQL_GENERATION_SYSTEM_PROMPT.format(schema=schema)
        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content=question),
        ]

        response = llm.invoke(messages)
        sql = response.content.strip()

        # Strip markdown code fences if LLM wrapped it
        sql = re.sub(r"```(?:sql|SQL)?\s*", "", sql)
        sql = re.sub(r"```\s*$", "", sql)
        sql = sql.strip()

        return sql

    def _format_answer(self, question: str, sql: str, raw_data: list) -> str:
        """Step 6: Use LLM to summarize the raw SQL result in plain English."""
        llm = self._get_llm()

        # Truncate raw_data representation for LLM context (don't overflow tokens)
        preview = str(raw_data[:5])
        if len(raw_data) > 5:
            preview += f"\n... and {len(raw_data) - 5} more rows"

        system_content = ANSWER_FORMATTING_SYSTEM_PROMPT.format(
            question=question,
            sql=sql,
            row_count=len(raw_data),
            raw_data=preview,
        )

        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content="Please provide the summary."),
        ]

        response = llm.invoke(messages)
        return response.content.strip()

    # ── Internal: Safety Validation ───────────────────────────────────────────

    def _validate_sql(self, sql: str) -> None:
        """
        Secondary SQL safety check (defense in depth alongside DB layer).
        Raises ValueError for non-SELECT statements.
        """
        normalized = sql.strip().upper()
        if not normalized.startswith("SELECT"):
            raise ValueError(
                f"Generated SQL does not start with SELECT. The LLM returned: '{sql[:100]}'"
            )

    # ── Internal: Fallback Responses ──────────────────────────────────────────

    def _no_api_key_response(self, question: str) -> ChatResponse:
        return ChatResponse(
            question=question,
            generated_sql="",
            raw_data=[],
            row_count=0,
            answer=(
                "The AI chat assistant is not configured. Please set OPENAI_API_KEY "
                "in the .env file to enable this feature."
            ),
            warning="OPENAI_API_KEY not set",
            generated_at=datetime.utcnow(),
        )

    def _mock_response(self, question: str) -> ChatResponse:
        """Mock response for development when LangChain is not installed."""
        mock_sql = "SELECT COUNT(*) AS total_customers FROM customer_profiles;"
        mock_data = [{"total_customers": 42}]
        return ChatResponse(
            question=question,
            generated_sql=mock_sql,
            raw_data=mock_data,
            row_count=1,
            answer=(
                "There are 42 registered customers in the MillStream system. "
                "(Note: This is a mock response — install LangChain and set OPENAI_API_KEY for real queries.)"
            ),
            warning="LangChain not installed or OPENAI_API_KEY not set. Returning mock data.",
            generated_at=datetime.utcnow(),
        )


# ── Module-level singleton ─────────────────────────────────────────────────────
# One RAGService instance is shared across requests (schema context cache)
rag_service_instance = RAGService()
