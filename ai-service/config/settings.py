"""
MillStream ERP — AI Microservice
config/settings.py

Loads all environment variables using Pydantic BaseSettings.
Settings are validated at startup; missing required vars raise an error.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database ---
    DATABASE_URL: str
    DATABASE_URL_READONLY: str = ""  # Falls back to DATABASE_URL if not set

    # --- LLM ---
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"

    # --- Commodity API ---
    ALPHA_VANTAGE_API_KEY: str = ""

    # --- CORS ---
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # --- Service ---
    APP_ENV: str = "development"
    LOG_LEVEL: str = "info"
    PORT: int = 8000

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def readonly_db_url(self) -> str:
        """Return the read-only database URL, defaulting to the main URL."""
        return self.DATABASE_URL_READONLY or self.DATABASE_URL


# Singleton settings instance used throughout the app
settings = Settings()
