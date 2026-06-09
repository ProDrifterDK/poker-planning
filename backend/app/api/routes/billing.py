from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_user, db_session
from app.schemas.billing import (
    AuthenticatedUser,
    BillingMeResponse,
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
    return BillingService(db).create_checkout_session(user, payload.planKey, payload.locale)


@router.post("/checkout-sessions/{session_id}/confirm", response_model=CheckoutConfirmResponse)
def confirm_checkout_session(
    session_id: str,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return BillingService(db).confirm_checkout_session(user, session_id)


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
