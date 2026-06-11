from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.settings import Settings, get_settings
from app.db.models import (
    BillingCheckoutSession,
    BillingCustomer,
    BillingEvent,
    BillingPayment,
    BillingSubscription,
    utcnow,
)
from app.domain.plans import PLAN_CATALOG, get_plan, serialize_plan
from app.schemas.billing import AuthenticatedUser

ACTIVE_STATUSES = {"active", "trialing", "past_due", "cancelled"}
PUBLIC_BILLING_PROVIDERS = {"stripe", "paypal"}


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def get_price_id(settings: Settings, plan_key: str) -> str | None:
    return {
        "pro-month": settings.stripe_price_pro_month,
        "pro-year": settings.stripe_price_pro_year,
        "enterprise-month": settings.stripe_price_enterprise_month,
        "enterprise-year": settings.stripe_price_enterprise_year,
    }.get(plan_key)


def _from_unix(value: Any) -> datetime | None:
    if not value:
        return None
    return datetime.fromtimestamp(int(value), timezone.utc)


def _provider_object_dict(value: Any) -> dict[str, Any]:
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()
    return dict(value)


def _provider_value(value: Any, key: str, default: Any = None) -> Any:
    if isinstance(value, dict):
        return value.get(key, default)
    return getattr(value, key, default)


def _provider_metadata(value: Any) -> dict[str, Any]:
    metadata = _provider_value(value, "metadata", {}) or {}
    return dict(metadata)


class BillingService:
    def __init__(self, db: Session, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()

    def list_plans(self) -> list[dict[str, Any]]:
        return [serialize_plan(plan) for plan in PLAN_CATALOG.values()]

    def default_provider(self) -> str:
        # "fake" is an internal local/e2e mode; the public API still exposes a
        # real provider namespace so the frontend contract stays provider-ready.
        if self.settings.billing_provider in PUBLIC_BILLING_PROVIDERS:
            return self.settings.billing_provider
        return "stripe"

    def resolve_provider(self, requested_provider: str | None = None) -> str:
        provider = requested_provider or self.default_provider()
        if provider not in PUBLIC_BILLING_PROVIDERS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported billing provider")
        return provider

    def get_customer_provider_id(self, customer: BillingCustomer, provider: str) -> str | None:
        if provider == "stripe" and customer.stripe_customer_id:
            return customer.stripe_customer_id
        return (customer.provider_customer_ids or {}).get(provider)

    def set_customer_provider_id(self, customer: BillingCustomer, provider: str, provider_customer_id: str) -> None:
        provider_ids = dict(customer.provider_customer_ids or {})
        provider_ids[provider] = provider_customer_id
        customer.provider_customer_ids = provider_ids
        if provider == "stripe":
            customer.stripe_customer_id = provider_customer_id

    def manageable_actions(self, subscription: BillingSubscription | None) -> dict[str, bool]:
        if not subscription:
            return {
                "canCancel": False,
                "canChangePlan": True,
                "canManageBilling": False,
                "canUpdatePaymentMethod": False,
            }
        is_active = subscription.status in ACTIVE_STATUSES and not subscription.cancel_at_period_end
        return {
            "canCancel": is_active,
            "canChangePlan": True,
            "canManageBilling": subscription.provider == "stripe" and bool(subscription.provider_customer_id),
            "canUpdatePaymentMethod": subscription.provider == "stripe" and bool(subscription.provider_customer_id),
        }

    def ensure_customer(self, user: AuthenticatedUser) -> BillingCustomer:
        customer = self.db.scalar(select(BillingCustomer).where(BillingCustomer.firebase_uid == user.uid))
        if customer:
            if user.email and customer.email != user.email:
                customer.email = user.email
            if customer.stripe_customer_id and "stripe" not in (customer.provider_customer_ids or {}):
                self.set_customer_provider_id(customer, "stripe", customer.stripe_customer_id)
            return customer

        customer = BillingCustomer(firebase_uid=user.uid, email=user.email)
        self.db.add(customer)
        self.db.flush()
        return customer

    def current_subscription(self, uid: str) -> BillingSubscription | None:
        subscriptions = self.db.scalars(
            select(BillingSubscription)
            .where(BillingSubscription.firebase_uid == uid, BillingSubscription.is_current.is_(True))
            .order_by(BillingSubscription.updated_at.desc())
        ).all()
        now = utcnow()
        for subscription in subscriptions:
            if subscription.status in ACTIVE_STATUSES:
                if subscription.current_period_end and _aware(subscription.current_period_end) < now:
                    continue
                return subscription
        return None

    def serialize_subscription(self, subscription: BillingSubscription | None) -> dict[str, Any]:
        if not subscription:
            plan = get_plan("free")
            return {
                "id": "free",
                "userId": None,
                "plan": "free",
                "planKey": "free",
                "billingInterval": None,
                "status": "active",
                "startDate": None,
                "endDate": None,
                "autoRenew": False,
                "paymentMethod": None,
                "provider": None,
                "features": plan.features,
                "manageableActions": self.manageable_actions(None),
                "cancelAtPeriodEnd": False,
            }

        plan = get_plan(subscription.plan_key)
        return {
            "id": subscription.id,
            "userId": subscription.firebase_uid,
            "plan": subscription.plan,
            "planKey": subscription.plan_key,
            "billingInterval": subscription.billing_interval,
            "status": subscription.status,
            "startDate": _iso(subscription.current_period_start) or _iso(subscription.created_at),
            "endDate": _iso(subscription.current_period_end),
            "autoRenew": not subscription.cancel_at_period_end,
            "paymentMethod": subscription.payment_method,
            "provider": subscription.provider,
            "paymentId": subscription.provider_subscription_id,
            "subscriptionId": subscription.provider_subscription_id,
            "providerSubscriptionId": subscription.provider_subscription_id,
            "providerCustomerId": subscription.provider_customer_id,
            "providerCheckoutSessionId": subscription.provider_checkout_session_id,
            "features": plan.features,
            "manageableActions": self.manageable_actions(subscription),
            "cancelAtPeriodEnd": subscription.cancel_at_period_end,
        }

    def serialize_payments(self, uid: str) -> list[dict[str, Any]]:
        rows = self.db.scalars(
            select(BillingPayment).where(BillingPayment.firebase_uid == uid).order_by(BillingPayment.created_at.desc())
        ).all()
        return [
            {
                "id": row.id,
                "userId": row.firebase_uid,
                "subscriptionId": row.subscription_id or "",
                "amount": row.amount_paid_cents / 100,
                "currency": row.currency,
                "date": _iso(row.paid_at) or _iso(row.created_at),
                "status": row.status,
                "paymentMethod": row.provider,
                "provider": row.provider,
                "providerInvoiceId": row.provider_invoice_id,
                "providerPaymentId": row.provider_payment_id,
                "transactionId": row.provider_payment_id or row.provider_invoice_id or row.id,
            }
            for row in rows
        ]

    def get_me(self, user: AuthenticatedUser) -> dict[str, Any]:
        self.ensure_customer(user)
        subscription = self.current_subscription(user.uid)
        return {
            "user": user.model_dump(),
            "subscription": self.serialize_subscription(subscription),
            "payments": self.serialize_payments(user.uid),
        }

    def create_checkout_session(
        self, user: AuthenticatedUser, plan_key: str, locale: str, requested_provider: str | None = None
    ) -> dict[str, Any]:
        try:
            plan = get_plan(plan_key)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported planKey") from exc
        if plan.plan == "free":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Free plan does not use checkout")

        self.ensure_customer(user)
        provider = self.resolve_provider(requested_provider)
        provider_session_id = f"fake_cs_{hashlib.sha1(f'{provider}:{user.uid}:{plan_key}:{utcnow().timestamp()}'.encode()).hexdigest()[:24]}"
        success_url = (
            f"{self.settings.frontend_base_url.rstrip('/')}/{locale}/settings/subscription/success"
            f"?session_id={provider_session_id}&provider={provider}"
        )
        checkout_url = success_url

        if provider == "stripe" and not self.settings.e2e_test_mode:
            checkout_url, provider_session_id = self._create_stripe_session(user, plan_key, locale)
        elif provider == "paypal" and not self.settings.e2e_test_mode:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="PayPal checkout adapter is not implemented yet",
            )

        session = BillingCheckoutSession(
            firebase_uid=user.uid,
            plan_key=plan_key,
            provider=provider,
            provider_session_id=provider_session_id,
            checkout_url=checkout_url,
            status="created",
        )
        self.db.add(session)
        self.db.commit()

        return {
            "checkoutSessionId": provider_session_id,
            "provider": provider,
            "status": session.status,
            "checkoutUrl": checkout_url,
        }

    def _create_stripe_session(self, user: AuthenticatedUser, plan_key: str, locale: str) -> tuple[str, str]:
        price_id = get_price_id(self.settings, plan_key)
        if not self.settings.stripe_secret_key or not price_id:
            raise HTTPException(status_code=500, detail="Stripe is not configured for this plan")
        import stripe

        stripe.api_key = self.settings.stripe_secret_key
        customer = self.ensure_customer(user)
        stripe_customer_id = self.get_customer_provider_id(customer, "stripe")
        if not stripe_customer_id:
            stripe_customer = stripe.Customer.create(email=user.email, metadata={"firebase_uid": user.uid})
            stripe_customer_id = stripe_customer.id
            self.set_customer_provider_id(customer, "stripe", stripe_customer_id)
            self.db.flush()

        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=stripe_customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=(
                f"{self.settings.frontend_base_url.rstrip('/')}/{locale}/settings/subscription/success"
                "?session_id={CHECKOUT_SESSION_ID}&provider=stripe"
            ),
            cancel_url=f"{self.settings.frontend_base_url.rstrip('/')}/{locale}/settings/subscription/cancel",
            metadata={"firebase_uid": user.uid, "plan_key": plan_key},
            subscription_data={"metadata": {"firebase_uid": user.uid, "plan_key": plan_key}},
        )
        return session.url, session.id

    def confirm_checkout_session(
        self, user: AuthenticatedUser, provider_session_id: str, requested_provider: str | None = None
    ) -> dict[str, Any]:
        provider = self.resolve_provider(requested_provider) if requested_provider else None
        all_sessions = self.db.scalars(
            select(BillingCheckoutSession).where(
                BillingCheckoutSession.provider_session_id == provider_session_id
            )
        ).all()
        if not all_sessions:
            raise HTTPException(status_code=404, detail="Checkout session not found")

        matching_sessions = [session for session in all_sessions if not provider or session.provider == provider]
        if not matching_sessions:
            raise HTTPException(status_code=404, detail="Checkout session not found")

        owned_sessions = [session for session in matching_sessions if session.firebase_uid == user.uid]
        if not owned_sessions:
            raise HTTPException(status_code=403, detail="Checkout session belongs to another user")
        if len(owned_sessions) > 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Checkout session provider is ambiguous",
            )
        session = owned_sessions[0]

        if session.provider == "stripe" and not self.settings.e2e_test_mode:
            return self._confirm_stripe_checkout(user, session)
        if session.provider == "paypal" and not self.settings.e2e_test_mode:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="PayPal checkout adapter is not implemented yet",
            )

        subscription = self._activate_subscription(
            uid=user.uid,
            plan_key=session.plan_key,
            provider=session.provider,
            provider_checkout_session_id=session.provider_session_id,
            provider_subscription_id=f"fake_sub_{session.provider_session_id[-16:]}",
            provider_customer_id=None,
            raw_provider_object={"fake": True, "checkout_session_id": session.provider_session_id},
        )
        session.status = "completed"
        session.completed_at = utcnow()
        self.db.commit()
        return {"status": subscription.status, "subscription": self.serialize_subscription(subscription)}

    def _confirm_stripe_checkout(self, user: AuthenticatedUser, session: BillingCheckoutSession) -> dict[str, Any]:
        if not self.settings.stripe_secret_key:
            raise HTTPException(status_code=500, detail="Stripe is not configured")
        import stripe

        stripe.api_key = self.settings.stripe_secret_key
        stripe_session = stripe.checkout.Session.retrieve(session.provider_session_id, expand=["subscription"])
        if stripe_session.metadata.get("firebase_uid") != user.uid:
            raise HTTPException(status_code=403, detail="Provider session belongs to another user")
        if stripe_session.status != "complete" or not stripe_session.subscription:
            return {"status": "pending", "subscription": self.serialize_subscription(None)}
        subscription = self._upsert_subscription_from_stripe(stripe_session.subscription, stripe_session)
        session.status = "completed"
        session.completed_at = utcnow()
        self.db.commit()
        return {"status": subscription.status, "subscription": self.serialize_subscription(subscription)}

    def cancel_current_subscription(self, user: AuthenticatedUser, reason: str | None = None) -> dict[str, Any]:
        subscription = self.current_subscription(user.uid)
        if not subscription:
            return {"subscription": self.serialize_subscription(None)}

        if subscription.provider == "stripe" and self.settings.billing_provider == "stripe" and not self.settings.e2e_test_mode:
            self._cancel_stripe_subscription(subscription)

        subscription.status = "cancelled"
        subscription.cancel_at_period_end = True
        subscription.updated_at = utcnow()
        self.db.commit()
        return {"subscription": self.serialize_subscription(subscription)}

    def _cancel_stripe_subscription(self, subscription: BillingSubscription) -> None:
        if not self.settings.stripe_secret_key or not subscription.provider_subscription_id:
            return
        import stripe

        stripe.api_key = self.settings.stripe_secret_key
        stripe.Subscription.modify(subscription.provider_subscription_id, cancel_at_period_end=True)

    def _deactivate_other_current(self, uid: str, keep_id: str | None = None) -> None:
        query = select(BillingSubscription).where(
            BillingSubscription.firebase_uid == uid,
            BillingSubscription.is_current.is_(True),
        )
        for current in self.db.scalars(query):
            if keep_id and current.id == keep_id:
                continue
            current.is_current = False

    def _is_effectively_current(self, status_value: str, current_period_end: datetime | None) -> bool:
        if status_value not in ACTIVE_STATUSES:
            return False
        if current_period_end and _aware(current_period_end) <= utcnow():
            return False
        return True

    def _find_provider_subscription(
        self,
        provider: str,
        provider_subscription_id: str | None,
        provider_checkout_session_id: str | None,
    ) -> BillingSubscription | None:
        if provider_subscription_id:
            existing = self.db.scalar(
                select(BillingSubscription).where(
                    BillingSubscription.provider == provider,
                    BillingSubscription.provider_subscription_id == provider_subscription_id,
                )
            )
            if existing:
                return existing
        if provider_checkout_session_id:
            return self.db.scalar(
                select(BillingSubscription).where(
                    BillingSubscription.provider == provider,
                    BillingSubscription.provider_checkout_session_id == provider_checkout_session_id,
                )
            )
        return None

    def _activate_subscription(
        self,
        *,
        uid: str,
        plan_key: str,
        provider: str,
        provider_checkout_session_id: str | None,
        provider_subscription_id: str | None,
        provider_customer_id: str | None,
        raw_provider_object: dict[str, Any],
        current_period_start: datetime | None = None,
        current_period_end: datetime | None = None,
        status_value: str = "active",
        force_current: bool = True,
    ) -> BillingSubscription:
        plan = get_plan(plan_key)
        now = utcnow()
        start = current_period_start or now
        end = current_period_end or now + timedelta(days=365 if plan.billing_interval == "year" else 30)
        existing = self._find_provider_subscription(provider, provider_subscription_id, provider_checkout_session_id)
        should_be_current = self._is_effectively_current(status_value, end)

        if existing:
            other_current_exists = any(
                row.id != existing.id
                for row in self.db.scalars(
                    select(BillingSubscription).where(
                        BillingSubscription.firebase_uid == uid,
                        BillingSubscription.is_current.is_(True),
                    )
                )
            )
            if force_current or existing.is_current or not other_current_exists:
                if should_be_current:
                    self._deactivate_other_current(uid, existing.id)
                existing.is_current = should_be_current
            elif not should_be_current:
                existing.is_current = False

            existing.firebase_uid = uid
            existing.plan_key = plan_key
            existing.plan = plan.plan
            existing.billing_interval = plan.billing_interval
            existing.status = status_value
            existing.payment_method = provider
            existing.provider = provider
            existing.provider_customer_id = provider_customer_id or existing.provider_customer_id
            existing.provider_subscription_id = provider_subscription_id or existing.provider_subscription_id
            existing.provider_checkout_session_id = provider_checkout_session_id or existing.provider_checkout_session_id
            existing.current_period_start = start
            existing.current_period_end = end
            existing.cancel_at_period_end = bool(raw_provider_object.get("cancel_at_period_end", False))
            existing.raw_provider_object = raw_provider_object
            self.db.flush()
            return existing

        if should_be_current:
            self._deactivate_other_current(uid)

        subscription = BillingSubscription(
            firebase_uid=uid,
            plan_key=plan_key,
            plan=plan.plan,
            billing_interval=plan.billing_interval,
            status=status_value,
            payment_method=provider,
            provider=provider,
            provider_customer_id=provider_customer_id,
            provider_subscription_id=provider_subscription_id,
            provider_checkout_session_id=provider_checkout_session_id,
            current_period_start=start,
            current_period_end=end,
            cancel_at_period_end=bool(raw_provider_object.get("cancel_at_period_end", False)),
            raw_provider_object=raw_provider_object,
            is_current=should_be_current,
        )
        self.db.add(subscription)
        self.db.flush()
        return subscription

    def _upsert_subscription_from_stripe(self, stripe_subscription: Any, stripe_session: Any | None = None) -> BillingSubscription:
        metadata = _provider_metadata(stripe_subscription)
        if stripe_session is not None:
            metadata = {**_provider_metadata(stripe_session), **metadata}
        uid = metadata.get("firebase_uid")
        plan_key = metadata.get("plan_key")
        if not uid or not plan_key:
            raise HTTPException(status_code=400, detail="Stripe object is missing billing metadata")

        raw = _provider_object_dict(stripe_subscription)
        current_period_start = _from_unix(_provider_value(stripe_subscription, "current_period_start"))
        current_period_end = _from_unix(_provider_value(stripe_subscription, "current_period_end"))
        status_value = _provider_value(stripe_subscription, "status", "active")

        return self._activate_subscription(
            uid=uid,
            plan_key=plan_key,
            provider="stripe",
            provider_checkout_session_id=_provider_value(stripe_session, "id") if stripe_session is not None else None,
            provider_subscription_id=_provider_value(stripe_subscription, "id"),
            provider_customer_id=_provider_value(stripe_subscription, "customer"),
            raw_provider_object=raw,
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            status_value=status_value,
            force_current=True,
        )

    def process_stripe_event(self, event: dict[str, Any], payload_bytes: bytes) -> dict[str, Any]:
        event_id = event.get("id")
        event_type = event.get("type")
        if not event_id or not event_type:
            raise HTTPException(status_code=400, detail="Invalid Stripe event")

        payload_sha = hashlib.sha256(payload_bytes).hexdigest()
        billing_event = BillingEvent(
            provider="stripe",
            event_id=event_id,
            event_type=event_type,
            payload=event,
            payload_sha256=payload_sha,
        )
        self.db.add(billing_event)
        try:
            self.db.flush()
        except IntegrityError:
            self.db.rollback()
            existing_event = self.db.scalar(
                select(BillingEvent).where(BillingEvent.provider == "stripe", BillingEvent.event_id == event_id)
            )
            if existing_event and existing_event.processing_status in {"processed", "ignored"}:
                return {"received": True, "duplicate": True}
            if not existing_event:
                raise
            billing_event = existing_event
            billing_event.event_type = event_type
            billing_event.payload = event
            billing_event.payload_sha256 = payload_sha
            billing_event.processing_status = "received"
            billing_event.error = None

        handled = False
        try:
            data_object = event.get("data", {}).get("object", {})
            if event_type == "checkout.session.completed":
                subscription_id = data_object.get("subscription")
                plan_key = data_object.get("metadata", {}).get("plan_key")
                uid = data_object.get("metadata", {}).get("firebase_uid")
                if uid and plan_key:
                    self._activate_subscription(
                        uid=uid,
                        plan_key=plan_key,
                        provider="stripe",
                        provider_checkout_session_id=data_object.get("id"),
                        provider_subscription_id=subscription_id,
                        provider_customer_id=data_object.get("customer"),
                        raw_provider_object=data_object,
                        force_current=True,
                    )
                    handled = True
            elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
                metadata = data_object.get("metadata", {})
                uid = metadata.get("firebase_uid")
                plan_key = metadata.get("plan_key")
                if uid and plan_key:
                    is_deleted = event_type.endswith("deleted")
                    status_value = "cancelled" if is_deleted else data_object.get("status", "active")
                    current_period_end = _from_unix(data_object.get("current_period_end"))
                    if is_deleted and current_period_end is None:
                        current_period_end = utcnow()
                    self._activate_subscription(
                        uid=uid,
                        plan_key=plan_key,
                        provider="stripe",
                        provider_checkout_session_id=None,
                        provider_subscription_id=data_object.get("id"),
                        provider_customer_id=data_object.get("customer"),
                        raw_provider_object=data_object,
                        current_period_start=_from_unix(data_object.get("current_period_start")),
                        current_period_end=current_period_end,
                        status_value=status_value,
                        force_current=False,
                    )
                    handled = True

            billing_event.processing_status = "processed" if handled else "ignored"
            billing_event.processed_at = utcnow()
            self.db.commit()
            return {"received": True, "ignored": not handled}
        except Exception as exc:
            billing_event.processing_status = "failed"
            billing_event.error = str(exc)
            self.db.commit()
            raise


def event_from_raw_payload(payload_bytes: bytes) -> dict[str, Any]:
    try:
        return json.loads(payload_bytes.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
