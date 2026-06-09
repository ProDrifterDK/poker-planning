from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "development", "test", "staging", "production"] = "local"
    port: int = 8000
    database_url: str = "sqlite:///./billing.db"
    frontend_base_url: str = "http://localhost:3000"
    frontend_origins: str = "http://localhost:3000,https://poker-planning-pro.vercel.app,https://planning.resyst.cl"
    billing_provider: Literal["fake", "stripe"] = "fake"
    e2e_test_mode: bool = False
    e2e_test_secret: str | None = None

    firebase_project_id: str | None = None
    firebase_service_account_json_b64: str | None = None
    firebase_service_account_json: str | None = None

    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_pro_month: str | None = None
    stripe_price_pro_year: str | None = None
    stripe_price_enterprise_month: str | None = None
    stripe_price_enterprise_year: str | None = None

    @property
    def frontend_origin_list(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]

    @property
    def normalized_database_url(self) -> str:
        return self.database_url

    @property
    def is_local_test(self) -> bool:
        return self.app_env in {"local", "test"}

    @property
    def requires_stripe(self) -> bool:
        return self.app_env in {"development", "staging", "production"}

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @model_validator(mode="after")
    def validate_environment(self) -> "Settings":
        if self.requires_stripe:
            missing = []
            if self.billing_provider != "stripe":
                missing.append("BILLING_PROVIDER=stripe")
            if self.e2e_test_mode:
                missing.append("E2E_TEST_MODE=false")
            for field_name, env_name in {
                "stripe_secret_key": "STRIPE_SECRET_KEY",
                "stripe_webhook_secret": "STRIPE_WEBHOOK_SECRET",
                "stripe_price_pro_month": "STRIPE_PRICE_PRO_MONTH",
                "stripe_price_pro_year": "STRIPE_PRICE_PRO_YEAR",
                "stripe_price_enterprise_month": "STRIPE_PRICE_ENTERPRISE_MONTH",
                "stripe_price_enterprise_year": "STRIPE_PRICE_ENTERPRISE_YEAR",
                "firebase_project_id": "FIREBASE_PROJECT_ID",
            }.items():
                if not getattr(self, field_name):
                    missing.append(env_name)
            if not (self.firebase_service_account_json or self.firebase_service_account_json_b64):
                missing.append("FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_JSON_B64")
            if missing:
                raise ValueError(
                    f"Invalid {self.app_env} billing configuration; missing/invalid: {', '.join(missing)}"
                )

        if self.is_production and self.normalized_database_url.startswith("sqlite"):
            raise ValueError("Production billing backend requires a non-SQLite DATABASE_URL")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
