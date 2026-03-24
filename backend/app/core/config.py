from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Medical Summarizer API"
    api_v1_prefix: str = "/api/v1"
    mongodb_uri: str
    mongodb_db_name: str = "medical_summarizer"

    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    max_upload_size_mb: int = 25
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    gradio_summary_url: str = ""
    gradio_translation_url: str = ""
    gemini_api_key: str = ""


    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
