"""
ClauseVader Backend Configuration Module
Centralized environment variable management with validation.
"""

import os
from typing import Optional


class Config:
    """Centralized configuration with runtime validation."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL")
    LLM_MODEL: Optional[str] = os.getenv("LLM_MODEL")
    AWS_S3_BUCKET_NAME: Optional[str] = os.getenv("AWS_S3_BUCKET_NAME")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://clausevader.vercel.app",
    )

    @classmethod
    def validate(cls) -> None:
        errors = []

        if not cls.DATABASE_URL:
            errors.append("DATABASE_URL environment variable is required")
        elif not cls.DATABASE_URL.startswith("postgresql"):
            errors.append("DATABASE_URL must be a PostgreSQL connection string (postgresql://...)")

        if not cls.OPENAI_API_KEY and not cls.OPENROUTER_API_KEY and not cls.LLM_API_KEY:
            errors.append(
                "At least one LLM API key is required: OPENAI_API_KEY, OPENROUTER_API_KEY, or LLM_API_KEY"
            )

        if cls.OPENAI_API_KEY and not cls.OPENAI_API_KEY.startswith("sk-"):
            errors.append("OPENAI_API_KEY must start with 'sk-'")

        if cls.OPENROUTER_API_KEY and not cls.OPENROUTER_API_KEY.startswith("sk-or-v1-"):
            errors.append("OPENROUTER_API_KEY must start with 'sk-or-v1-'")

        if errors:
            raise ValueError("Configuration validation failed:\n  - " + "\n  - ".join(errors))

    @classmethod
    def get_origins_list(cls) -> list[str]:
        return [origin.strip() for origin in cls.ALLOWED_ORIGINS.split(",") if origin.strip()]
