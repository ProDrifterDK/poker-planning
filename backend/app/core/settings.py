from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PUBLIC_BILLING_PROVIDERS = ("stripe", "paypal")

STRIPE_PLAN_ENV_BY_KEY = {
    "pro-month": ("stripe_price_pro_month", "STRIPE_PRICE_PRO_MONTH"),
    "pro-year": ("stripe_price_pro_year", "STRIPE_PRICE_PRO_YEAR"),
    "enterprise-month": ("stripe_price_enterprise_month", "STRIPE_PRICE_ENTERPRISE_MONTH"),
    "enterprise-year": ("stripe_price_enterprise_year", "STRIPE_PRICE_ENTERPRISE_YEAR"),
}

PAYPAL_PLAN_ENV_BY_KEY = {
    "pro-month": ("paypal_plan_pro_month", "PAYPAL_PLAN_PRO_MONTH"),
    "pro-year": ("paypal_plan_pro_year", "PAYPAL_PLAN_PRO_YEAR"),
    "enterprise-month": ("paypal_plan_enterprise_month", "PAYPAL_PLAN_ENTERPRISE_MONTH"),
    "enterprise-year": ("paypal_plan_enterprise_year", "PAYPAL_PLAN_ENTERPRISE_YEAR"),
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "development", "test", "staging", "production"] = "local"
    port: int = 8000
    database_url: str = "sqlite:///./billing.db"
    frontend_base_url: str = "http://localhost:3000"
    frontend_origins: str = "http://localhost:3000,https://poker-planning-pro.vercel.app,https://planning.resyst.cl"
    billing_provider: Literal["fake", "stripe", "paypal"] = "fake"
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

    paypal_client_id: str | None = None
    paypal_client_secret: str | None = None
    paypal_environment: Literal["sandbox", "live"] | None = None
    paypal_webhook_id: str | None = None
    paypal_plan_pro_month: str | None = None
    paypal_plan_pro_year: str | None = None
    paypal_plan_enterprise_month: str | None = None
    paypal_plan_enterprise_year: str | None = None

    @property
    def frontend_origin_list(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]

    @property
    def normalized_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def is_local_test(self) -> bool:
        return self.app_env in {"local", "test"}

    @property
    def requires_provider_config(self) -> bool:
        return self.app_env in {"development", "staging", "production"}

    @property
    def requires_stripe(self) -> bool:
        return self.requires_provider_config and self.billing_provider == "stripe"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def supported_providers(self) -> list[str]:
        return list(PUBLIC_BILLING_PROVIDERS)

    def _plan_status(self, plan_env_by_key: dict[str, tuple[str, str]]) -> tuple[dict[str, str | None], list[str]]:
        plans = {plan_key: getattr(self, field_name) for plan_key, (field_name, _) in plan_env_by_key.items()}
        missing = [env_name for _, (field_name, env_name) in plan_env_by_key.items() if not getattr(self, field_name)]
        return plans, missing

    def provider_config_status(self, provider: str) -> dict[str, object]:
        provider = provider.strip().lower()
        if provider == "stripe":
            plans, missing = self._plan_status(STRIPE_PLAN_ENV_BY_KEY)
            if not self.stripe_secret_key:
                missing.insert(0, "STRIPE_SECRET_KEY")
            if not self.stripe_webhook_secret:
                missing.append("STRIPE_WEBHOOK_SECRET")
            return {
                "provider": "stripe",
                "configured": len(missing) == 0,
                "credentialsConfigured": bool(self.stripe_secret_key),
                "webhookConfigured": bool(self.stripe_webhook_secret),
                "plans": plans,
                "missingRequiredEnv": missing,
            }

        if provider == "paypal":
            plans, missing = self._plan_status(PAYPAL_PLAN_ENV_BY_KEY)
            for field_name, env_name in [
                ("paypal_client_id", "PAYPAL_CLIENT_ID"),
                ("paypal_client_secret", "PAYPAL_CLIENT_SECRET"),
                ("paypal_environment", "PAYPAL_ENVIRONMENT"),
                ("paypal_webhook_id", "PAYPAL_WEBHOOK_ID"),
            ]:
                if not getattr(self, field_name):
                    missing.insert(0, env_name)
            return {
                "provider": "paypal",
                "configured": len(missing) == 0,
                "clientConfigured": bool(self.paypal_client_id),
                "credentialsConfigured": bool(self.paypal_client_id and self.paypal_client_secret),
                "webhookConfigured": bool(self.paypal_webhook_id),
                "environment": self.paypal_environment,
                "plans": plans,
                "missingRequiredEnv": missing,
            }

        return {
            "provider": provider,
            "configured": False,
            "webhookConfigured": False,
            "plans": {},
            "missingRequiredEnv": [],
        }

    @model_validator(mode="after")
    def validate_environment(self) -> "Settings":
        if self.requires_provider_config:
            missing = []
            if self.billing_provider not in PUBLIC_BILLING_PROVIDERS:
                missing.append("BILLING_PROVIDER=stripe or paypal")
            if self.e2e_test_mode:
                missing.append("E2E_TEST_MODE=false")
            for field_name, env_name in {
                "firebase_project_id": "FIREBASE_PROJECT_ID",
            }.items():
                if not getattr(self, field_name):
                    missing.append(env_name)
            if not (self.firebase_service_account_json or self.firebase_service_account_json_b64):
                missing.append("FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_JSON_B64")

            if self.billing_provider in PUBLIC_BILLING_PROVIDERS:
                status = self.provider_config_status(self.billing_provider)
                missing_env = status.get("missingRequiredEnv", [])
                if isinstance(missing_env, list):
                    missing.extend(str(env_name) for env_name in missing_env)
                if self.is_production and self.billing_provider == "paypal" and self.paypal_environment != "live":
                    missing.append("PAYPAL_ENVIRONMENT=live")

            if missing:
                deduped_missing = list(dict.fromkeys(missing))
                raise ValueError(
                    f"Invalid {self.app_env} billing configuration; missing/invalid: {', '.join(deduped_missing)}"
                )

        if self.is_production and self.normalized_database_url.startswith("sqlite"):
            raise ValueError("Production billing backend requires a non-SQLite DATABASE_URL")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
