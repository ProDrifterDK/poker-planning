from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import current_user, db_session
from app.core.settings import get_settings
from app.schemas.billing import (
    AuthenticatedUser,
    BillingMeResponse,
    BillingProvider,
    CancelSubscriptionRequest,
    CheckoutConfirmResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
)
from app.services.billing_service import BillingService

router = APIRouter(prefix="/v1/billing", tags=["billing"])


@router.get("/plans")
def list_plans(db: Session = Depends(db_session)) -> dict[str, list[dict]]:
    return {"plans": BillingService(db).list_plans()}


@router.get("/providers")
def provider_status() -> dict[str, object]:
    """Return non-secret billing provider configuration status for ops smoke checks."""
    settings = get_settings()
    providers = {
        provider: settings.provider_config_status(provider)
        for provider in settings.supported_providers
    }
    default_public_provider = (
        settings.billing_provider
        if settings.billing_provider in settings.supported_providers
        else "stripe"
    )
    return {
        "activeProvider": settings.billing_provider,
        "defaultPublicProvider": default_public_provider,
        "supportedProviders": settings.supported_providers,
        "providers": providers,
        "environment": settings.app_env,
        "database": {
            "postgresConfigured": settings.normalized_database_url.startswith("postgresql+psycopg://"),
            "sqlite": settings.normalized_database_url.startswith("sqlite"),
        },
    }


@router.get("/me", response_model=BillingMeResponse)
def get_my_billing(
    user: AuthenticatedUser = Depends(current_user), db: Session = Depends(db_session)
) -> dict:
    service = BillingService(db)
    result = service.get_me(user)
    db.commit()
    return result


@router.post("/checkout-sessions", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionCreate,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return BillingService(db).create_checkout_session(user, payload.planKey, payload.locale, payload.provider)


@router.post("/checkout-sessions/{session_id}/confirm", response_model=CheckoutConfirmResponse)
def confirm_checkout_session(
    session_id: str,
    provider: BillingProvider | None = Query(default=None),
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return BillingService(db).confirm_checkout_session(user, session_id, provider)


@router.post("/portal-sessions")
def create_portal_session(
    user: AuthenticatedUser = Depends(current_user), db: Session = Depends(db_session)
) -> dict:
    # A real Stripe Customer Portal URL is created in production in a follow-up slice.
    return {"url": BillingService(db).settings.frontend_base_url.rstrip("/") + "/es/settings/subscription"}


@router.post("/subscription/me/cancel")
def cancel_my_subscription(
    payload: CancelSubscriptionRequest,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return BillingService(db).cancel_current_subscription(user, payload.reason)
