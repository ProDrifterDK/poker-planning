from fastapi import APIRouter, Header, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi import Depends

from app.api.deps import db_session
from app.core.settings import get_settings
from app.services.billing_service import BillingService, event_from_raw_payload

router = APIRouter(prefix="/v1/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(db_session),
) -> dict:
    settings = get_settings()
    payload = await request.body()

    if settings.stripe_webhook_secret:
        if not stripe_signature:
            raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
        try:
            import stripe

            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.stripe_webhook_secret
            )
            event = event.to_dict_recursive() if hasattr(event, "to_dict_recursive") else dict(event)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature") from exc
    elif not settings.is_local_test:
        raise HTTPException(status_code=500, detail="Stripe webhook secret is required outside local/test")
    else:
        event = event_from_raw_payload(payload)

    return BillingService(db, settings).process_stripe_event(event, payload)
