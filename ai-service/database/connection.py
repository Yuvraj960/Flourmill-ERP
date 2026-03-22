"""
MillStream ERP — AI Microservice
database/connection.py

SQLAlchemy engine and session factories for both the read-write and
read-only database connections. Also provides a raw SQL execution helper
used by the RAG Text-to-SQL pipeline.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator, Any, List, Dict
import logging

from config.settings import settings

logger = logging.getLogger(__name__)

# ── Read-write engine (forecasting + procurement writes) ──────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # Validates connection before checkout
    pool_size=5,
    max_overflow=10,
    echo=(settings.APP_ENV == "development"),
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Read-only engine (RAG Text-to-SQL) ────────────────────────────────────────
readonly_engine = create_engine(
    settings.readonly_db_url,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    echo=False,
)

ReadOnlySessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=readonly_engine,
)


# ── FastAPI Dependency: read-write session ───────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a read-write SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── FastAPI Dependency: read-only session ────────────────────────────────────
def get_readonly_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a read-only SQLAlchemy session."""
    db = ReadOnlySessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── RAG SQL Execution Helper ─────────────────────────────────────────────────
def execute_readonly_sql(sql: str, timeout_seconds: int = 5) -> List[Dict[str, Any]]:
    """
    Execute a raw SQL query against the read-only database.
    Enforces:
        - SELECT-only (rejects any DML/DDL statements)
        - Statement timeout (default 5 seconds)
        - Row limit of 100
    Returns a list of dicts (one per row).
    Raises ValueError for unsafe queries; SQLAlchemyError for DB errors.
    """
    # --- Safety: ensure query is read-only ---
    normalized = sql.strip().upper()
    forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE"]
    for keyword in forbidden:
        if normalized.startswith(keyword) or f" {keyword} " in normalized:
            raise ValueError(f"Unsafe SQL detected: '{keyword}' is not allowed in the chat assistant.")

    if not normalized.startswith("SELECT"):
        raise ValueError("Only SELECT statements are permitted in the chat assistant.")

    # --- Inject LIMIT if not already present ---
    if "LIMIT" not in normalized:
        sql = sql.rstrip(";").rstrip() + " LIMIT 100;"

    with readonly_engine.connect() as conn:
        # Per-statement timeout using PostgreSQL's statement_timeout
        conn.execute(text(f"SET LOCAL statement_timeout = '{timeout_seconds}s'"))
        result = conn.execute(text(sql))
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return rows


# ── Schema Introspection for RAG Context ─────────────────────────────────────
def get_db_schema_context() -> str:
    """
    Introspect the PostgreSQL information_schema to build a schema context
    string for the LLM. Returns table definitions formatted as:
        Table: <name>\n  - <column>: <type>\n  ...
    """
    query = """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT IN ('_prisma_migrations', 'spatial_ref_sys')
        ORDER BY table_name, ordinal_position;
    """
    try:
        with readonly_engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()

        schema_lines = []
        current_table = None
        for table_name, column_name, data_type in rows:
            if table_name != current_table:
                if current_table is not None:
                    schema_lines.append("")
                schema_lines.append(f"Table: {table_name}")
                current_table = table_name
            schema_lines.append(f"  - {column_name}: {data_type}")

        return "\n".join(schema_lines)
    except Exception as e:
        logger.warning(f"Could not introspect DB schema: {e}")
        # Fallback: return the static schema from architecture.md
        return _static_schema_fallback()


def _static_schema_fallback() -> str:
    """Static schema context derived from architecture.md (used when DB is unavailable)."""
    return """
Table: users
  - id: integer
  - role: text
  - phone: text
  - plain_password: text
  - created_at: timestamp

Table: customer_profiles
  - id: integer
  - user_id: integer
  - mill_id: text
  - full_name: text

Table: vault_accounts
  - id: integer
  - customer_profile_id: integer
  - material_type: text
  - balance_kg: double precision

Table: inventory
  - id: integer
  - item_name: text
  - category: text
  - current_stock_kg: double precision
  - reorder_threshold_kg: double precision

Table: transaction_ledger
  - id: integer
  - customer_profile_id: integer
  - type: text
  - material_involved: text
  - weight_kg: double precision
  - processing_fee_paid: double precision
  - timestamp: timestamp

Table: ai_forecasts
  - id: integer
  - target_month: timestamp
  - predicted_wheat_kg: double precision
  - predicted_flour_kg: double precision
  - predicted_revenue: double precision
  - generated_at: timestamp

Table: commodity_prices
  - id: integer
  - material: text
  - price_per_kg: double precision
  - recorded_at: timestamp
  - source_api: text
    """.strip()
