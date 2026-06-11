from __future__ import annotations

import base64
import hashlib
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Mapping

from fastapi import HTTPException, status
from sqlalchemy import or_, select
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

CURRENT_STATUSES = {"active", "trialing", "past_due"}
INACTIVE_STATUSES = {"canceled", "incomplete", "pending", "failed", "suspended"}
NORMALIZED_SUBSCRIPTION_STATUSES = CURRENT_STATUSES | INACTIVE_STATUSES
ACTIVE_STATUSES = CURRENT_STATUSES
LEGACY_SCHEDULED_CANCEL_STATUSES = {"canceled", "cancelled"}
PUBLIC_BILLING_PROVIDERS = {"stripe", "paypal"}
PAYPAL_WEBHOOK_SIGNATURE_HEADERS = {
    "auth_algo": "PAYPAL-AUTH-ALGO",
    "cert_url": "PAYPAL-CERT-URL",
    "transmission_id": "PAYPAL-TRANSMISSION-ID",
    "transmission_sig": "PAYPAL-TRANSMISSION-SIG",
    "transmission_time": "PAYPAL-TRANSMISSION-TIME",
}

STRIPE_STATUS_ALIASES = {
    "active": "active",
    "trialing": "trialing",
    "past_due": "past_due",
    "canceled": "canceled",
    "cancelled": "canceled",
    "incomplete": "incomplete",
    "incomplete_expired": "failed",
    "unpaid": "failed",
    "paused": "suspended",
}
PAYPAL_STATUS_ALIASES = {
    "active": "active",
    "activated": "active",
    "approved": "pending",
    "approval_pending": "pending",
    "created": "pending",
    "pending": "pending",
    "past_due": "past_due",
    "suspended": "suspended",
    "cancelled": "canceled",
    "canceled": "canceled",
    "expired": "canceled",
    "failed": "failed",
}


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


def get_paypal_plan_id(settings: Settings, plan_key: str) -> str | None:
    return {
        "pro-month": settings.paypal_plan_pro_month,
        "pro-year": settings.paypal_plan_pro_year,
        "enterprise-month": settings.paypal_plan_enterprise_month,
        "enterprise-year": settings.paypal_plan_enterprise_year,
    }.get(plan_key)


def _from_unix(value: Any) -> datetime | None:
    if not value:
        return None
    return datetime.fromtimestamp(int(value), timezone.utc)


def _from_iso(value: Any) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    candidate = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return None
    return _aware(parsed)


def _event_created_at(event: dict[str, Any]) -> datetime | None:
    return _from_unix(event.get("created")) or _from_iso(event.get("create_time"))


def _event_created_marker(value: datetime | None) -> float | None:
    if not value:
        return None
    return _aware(value).timestamp()


def _raw_last_event_marker(raw: dict[str, Any] | None) -> float | None:
    if not raw:
        return None
    marker = raw.get("__last_event_created")
    if marker is None:
        return None
    try:
        return float(marker)
    except (TypeError, ValueError):
        return None


def _should_apply_event(raw: dict[str, Any] | None, event_created_at: datetime | None) -> bool:
    new_marker = _event_created_marker(event_created_at)
    old_marker = _raw_last_event_marker(raw)
    return new_marker is None or old_marker is None or new_marker >= old_marker


def _with_event_metadata(
    raw: dict[str, Any], event_created_at: datetime | None, event_id: str | None
) -> dict[str, Any]:
    result = dict(raw)
    marker = _event_created_marker(event_created_at)
    if marker is not None:
        result["__last_event_created"] = marker
    if event_id:
        result["__last_event_id"] = event_id
    return result


def _normalize_status(provider: str, value: Any, fallback: str = "pending") -> str:
    normalized = str(value or fallback).strip().lower().replace("-", "_")
    aliases = PAYPAL_STATUS_ALIASES if provider == "paypal" else STRIPE_STATUS_ALIASES
    return aliases.get(normalized, fallback)


def _decode_json_metadata(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return dict(value)
    if not isinstance(value, str) or not value.strip():
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return dict(parsed) if isinstance(parsed, dict) else {}


def _amount_to_cents(value: Any) -> int:
    if value is None or value == "":
        return 0
    try:
        return int(round(float(value) * 100))
    except (TypeError, ValueError):
        return 0


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


def _header_value(headers: Mapping[str, str], header_name: str) -> str | None:
    value = headers.get(header_name) or headers.get(header_name.lower())
    if value:
        return value
    expected = header_name.lower()
    for key, candidate in headers.items():
        if str(key).lower() == expected:
            return candidate
    return None


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

    def _period_is_unexpired(self, current_period_end: datetime | None) -> bool:
        return bool(current_period_end and _aware(current_period_end) > utcnow())

    def _normalize_legacy_scheduled_cancel(self, subscription: BillingSubscription) -> None:
        if (
            subscription.status in LEGACY_SCHEDULED_CANCEL_STATUSES
            and subscription.cancel_at_period_end
            and self._period_is_unexpired(subscription.current_period_end)
        ):
            subscription.status = "active"
            subscription.updated_at = utcnow()

    def current_subscription(self, uid: str) -> BillingSubscription | None:
        subscriptions = self.db.scalars(
            select(BillingSubscription)
            .where(BillingSubscription.firebase_uid == uid, BillingSubscription.is_current.is_(True))
            .order_by(BillingSubscription.updated_at.desc())
        ).all()
        now = utcnow()
        for subscription in subscriptions:
            self._normalize_legacy_scheduled_cancel(subscription)
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
            checkout_url, provider_session_id = self._create_paypal_subscription(user, plan_key, locale)

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

    def _paypal_base_url(self) -> str:
        if self.settings.paypal_environment == "live":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"

    def _ensure_paypal_credentials(self) -> None:
        if not (
            self.settings.paypal_client_id
            and self.settings.paypal_client_secret
            and self.settings.paypal_environment
        ):
            raise HTTPException(status_code=500, detail="PayPal is not configured")

    def _paypal_access_token(self) -> str:
        self._ensure_paypal_credentials()
        credentials = f"{self.settings.paypal_client_id}:{self.settings.paypal_client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("ascii")
        payload = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode("utf-8")
        request = urllib.request.Request(
            f"{self._paypal_base_url()}/v1/oauth2/token",
            data=payload,
            headers={
                "Accept": "application/json",
                "Accept-Language": "en_US",
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal authentication failed",
            ) from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal authentication failed",
            ) from exc

        access_token = data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal authentication failed",
            )
        return str(access_token)

    def _paypal_api_error_detail(self, payload: str) -> str:
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            return "PayPal API request failed"
        if isinstance(data, dict):
            details = data.get("details")
            if isinstance(details, list) and details:
                issue = details[0].get("issue") if isinstance(details[0], dict) else None
                description = details[0].get("description") if isinstance(details[0], dict) else None
                if issue and description:
                    return f"PayPal API request failed: {issue} - {description}"
                if description:
                    return f"PayPal API request failed: {description}"
            message = data.get("message") or data.get("name")
            if message:
                return f"PayPal API request failed: {message}"
        return "PayPal API request failed"

    def _paypal_api_request(
        self, method: str, path: str, body: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        token = self._paypal_access_token()
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(
            f"{self._paypal_base_url()}{path}",
            data=payload,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            payload_text = exc.read().decode("utf-8", errors="replace")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=self._paypal_api_error_detail(payload_text),
            ) from exc
        except urllib.error.URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal API request failed",
            ) from exc
        if not raw:
            return {}
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal API returned invalid JSON",
            ) from exc
        if not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal API returned an unexpected response",
            )
        return data

    def verify_paypal_webhook_signature(
        self, event: dict[str, Any], headers: Mapping[str, str]
    ) -> None:
        if not self.settings.paypal_webhook_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PayPal webhook ID is required outside local/test",
            )

        values = {
            field: _header_value(headers, header_name)
            for field, header_name in PAYPAL_WEBHOOK_SIGNATURE_HEADERS.items()
        }
        missing = [
            header_name
            for field, header_name in PAYPAL_WEBHOOK_SIGNATURE_HEADERS.items()
            if not values[field]
        ]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing PayPal webhook headers: {', '.join(missing)}",
            )

        verification = self._paypal_api_request(
            "POST",
            "/v1/notifications/verify-webhook-signature",
            {
                "auth_algo": values["auth_algo"],
                "cert_url": values["cert_url"],
                "transmission_id": values["transmission_id"],
                "transmission_sig": values["transmission_sig"],
                "transmission_time": values["transmission_time"],
                "webhook_id": self.settings.paypal_webhook_id,
                "webhook_event": event,
            },
        )
        verification_status = str(verification.get("verification_status") or "").upper()
        if verification_status != "SUCCESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PayPal webhook signature",
            )

    def _paypal_approval_url(self, paypal_subscription: dict[str, Any]) -> str | None:
        links = paypal_subscription.get("links") or []
        for link in links:
            if not isinstance(link, dict):
                continue
            if str(link.get("rel") or "").lower() in {"approve", "approval_url"}:
                href = link.get("href")
                return str(href) if href else None
        return None

    def _create_paypal_subscription(
        self, user: AuthenticatedUser, plan_key: str, locale: str
    ) -> tuple[str, str]:
        plan_id = get_paypal_plan_id(self.settings, plan_key)
        if not plan_id:
            raise HTTPException(status_code=500, detail=f"PayPal is not configured for plan {plan_key}")
        self._ensure_paypal_credentials()
        safe_locale = locale if locale in {"es", "en"} else "es"
        frontend_base = self.settings.frontend_base_url.rstrip("/")
        custom_id = json.dumps(
            {"firebase_uid": user.uid, "plan_key": plan_key},
            separators=(",", ":"),
        )
        body: dict[str, Any] = {
            "plan_id": plan_id,
            "custom_id": custom_id,
            "application_context": {
                "brand_name": "Poker Planning",
                "shipping_preference": "NO_SHIPPING",
                "user_action": "SUBSCRIBE_NOW",
                "return_url": f"{frontend_base}/{safe_locale}/settings/subscription/success?provider=paypal",
                "cancel_url": f"{frontend_base}/{safe_locale}/settings/subscription/cancel?provider=paypal",
            },
        }
        if user.email:
            body["subscriber"] = {"email_address": user.email}

        paypal_subscription = self._paypal_api_request("POST", "/v1/billing/subscriptions", body)
        provider_session_id = paypal_subscription.get("id")
        checkout_url = self._paypal_approval_url(paypal_subscription)
        if not provider_session_id or not checkout_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="PayPal checkout creation returned an unexpected response",
            )
        return checkout_url, str(provider_session_id)

    def subscription_management_url(self, locale: str = "es") -> str:
        safe_locale = locale if locale in {"es", "en"} else "es"
        return f"{self.settings.frontend_base_url.rstrip('/')}/{safe_locale}/settings/subscription"

    def create_portal_session(self, user: AuthenticatedUser, locale: str = "es") -> dict[str, str]:
        fallback_url = self.subscription_management_url(locale)
        subscription = self.current_subscription(user.uid)
        if not subscription or subscription.provider != "stripe":
            return {"url": fallback_url}

        customer = self.db.scalar(select(BillingCustomer).where(BillingCustomer.firebase_uid == user.uid))
        provider_customer_id = subscription.provider_customer_id
        if not provider_customer_id and customer:
            provider_customer_id = self.get_customer_provider_id(customer, "stripe")
        if not provider_customer_id or self.settings.e2e_test_mode:
            return {"url": fallback_url}
        if not self.settings.stripe_secret_key:
            raise HTTPException(status_code=500, detail="Stripe is not configured")

        import stripe

        stripe.api_key = self.settings.stripe_secret_key
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=provider_customer_id,
                return_url=fallback_url,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Stripe Customer Portal session failed",
            ) from exc

        portal_url = _provider_value(portal_session, "url")
        if not portal_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Stripe Customer Portal session failed",
            )
        return {"url": portal_url}

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
            return self._confirm_paypal_checkout(user, session)

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

    def _confirm_paypal_checkout(
        self, user: AuthenticatedUser, session: BillingCheckoutSession
    ) -> dict[str, Any]:
        paypal_subscription = self._paypal_api_request(
            "GET",
            f"/v1/billing/subscriptions/{session.provider_session_id}",
        )
        provider_subscription_id = self._paypal_subscription_id(paypal_subscription)
        if provider_subscription_id and provider_subscription_id != session.provider_session_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="PayPal subscription ID does not match checkout session",
            )
        provider_subscription_id = provider_subscription_id or session.provider_session_id

        metadata = self._paypal_metadata(paypal_subscription)
        metadata_uid = metadata.get("firebase_uid")
        if metadata_uid and metadata_uid != user.uid:
            raise HTTPException(status_code=403, detail="Provider session belongs to another user")
        metadata_plan_key = self._paypal_plan_key(paypal_subscription, metadata)
        if metadata_plan_key and metadata_plan_key != session.plan_key:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="PayPal subscription plan does not match checkout session",
            )

        paypal_status = _normalize_status("paypal", paypal_subscription.get("status"), "pending")
        if paypal_status != "active":
            session.status = paypal_status
            self.db.commit()
            return {"status": "pending", "subscription": self.serialize_subscription(None)}

        subscription = self._activate_subscription(
            uid=user.uid,
            plan_key=session.plan_key,
            provider="paypal",
            provider_checkout_session_id=session.provider_session_id,
            provider_subscription_id=provider_subscription_id,
            provider_customer_id=self._paypal_payer_id(paypal_subscription),
            raw_provider_object=paypal_subscription,
            current_period_start=_from_iso(paypal_subscription.get("start_time")),
            current_period_end=self._paypal_period_end(paypal_subscription),
            status_value=paypal_status,
            force_current=True,
        )
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

        subscription.status = "active"
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

    def _can_degrade_existing_subscription_from_payment(
        self, subscription: BillingSubscription | None
    ) -> bool:
        return bool(
            subscription
            and subscription.is_current
            and subscription.status in ACTIVE_STATUSES
            and self._period_is_unexpired(subscription.current_period_end)
        )

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
        cancel_at_period_end: bool | None = None,
        event_created_at: datetime | None = None,
        event_id: str | None = None,
    ) -> BillingSubscription:
        plan = get_plan(plan_key)
        status_value = _normalize_status(provider, status_value, "active")
        now = utcnow()
        start = current_period_start or now
        end = current_period_end or now + timedelta(days=365 if plan.billing_interval == "year" else 30)
        existing = self._find_provider_subscription(provider, provider_subscription_id, provider_checkout_session_id)
        if existing and not _should_apply_event(existing.raw_provider_object, event_created_at):
            return existing

        should_be_current = self._is_effectively_current(status_value, end)
        raw = _with_event_metadata(raw_provider_object, event_created_at, event_id)
        cancel_flag = (
            bool(cancel_at_period_end)
            if cancel_at_period_end is not None
            else bool(raw_provider_object.get("cancel_at_period_end", False))
        )

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
            existing.cancel_at_period_end = cancel_flag
            existing.raw_provider_object = raw
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
            cancel_at_period_end=cancel_flag,
            raw_provider_object=raw,
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
            cancel_at_period_end=bool(_provider_value(stripe_subscription, "cancel_at_period_end", False)),
            force_current=True,
        )

    def _upsert_payment(
        self,
        *,
        uid: str,
        provider: str,
        subscription_id: str | None,
        provider_invoice_id: str | None,
        provider_payment_id: str | None,
        amount_paid_cents: int,
        currency: str,
        status_value: str,
        paid_at: datetime | None,
        raw_provider_object: dict[str, Any],
        event_created_at: datetime | None,
        event_id: str | None,
    ) -> BillingPayment:
        lookup = []
        if provider_invoice_id:
            lookup.append(BillingPayment.provider_invoice_id == provider_invoice_id)
        if provider_payment_id:
            lookup.append(BillingPayment.provider_payment_id == provider_payment_id)
        existing = None
        if lookup:
            existing = self.db.scalar(
                select(BillingPayment).where(BillingPayment.provider == provider, or_(*lookup))
            )
        raw = _with_event_metadata(raw_provider_object, event_created_at, event_id)
        if existing:
            if not _should_apply_event(existing.raw_provider_object, event_created_at):
                return existing
            existing.firebase_uid = uid
            existing.subscription_id = subscription_id or existing.subscription_id
            existing.provider_invoice_id = provider_invoice_id or existing.provider_invoice_id
            existing.provider_payment_id = provider_payment_id or existing.provider_payment_id
            existing.amount_paid_cents = amount_paid_cents
            existing.currency = currency.upper()
            existing.status = status_value
            existing.paid_at = paid_at or existing.paid_at
            existing.raw_provider_object = raw
            self.db.flush()
            return existing

        payment = BillingPayment(
            firebase_uid=uid,
            subscription_id=subscription_id,
            provider=provider,
            provider_invoice_id=provider_invoice_id,
            provider_payment_id=provider_payment_id,
            amount_paid_cents=amount_paid_cents,
            currency=currency.upper(),
            status=status_value,
            paid_at=paid_at,
            raw_provider_object=raw,
        )
        self.db.add(payment)
        self.db.flush()
        return payment

    def _stripe_invoice_payment_status(self, event_type: str, invoice: dict[str, Any]) -> str:
        invoice_status = str(invoice.get("status") or "").lower()
        if event_type in {"invoice.paid", "invoice.payment_succeeded"} or invoice_status == "paid":
            return "paid"
        if event_type in {"invoice.payment_failed", "invoice.marked_uncollectible"}:
            return "failed"
        if event_type == "invoice.voided" or invoice_status == "void":
            return "canceled"
        return "pending"

    def _process_stripe_invoice_event(
        self,
        event_id: str,
        event_type: str,
        invoice: dict[str, Any],
        event_created_at: datetime | None,
    ) -> bool:
        provider_subscription_id = invoice.get("subscription")
        subscription = self._find_provider_subscription("stripe", provider_subscription_id, None)
        metadata = dict(invoice.get("metadata") or {})
        uid = metadata.get("firebase_uid") or (subscription.firebase_uid if subscription else None)
        plan_key = metadata.get("plan_key") or (subscription.plan_key if subscription else None)
        if not uid or not plan_key:
            return False

        status_value = self._stripe_invoice_payment_status(event_type, invoice)
        amount = invoice.get("amount_paid") if status_value == "paid" else invoice.get("amount_due")
        if amount is None:
            amount = invoice.get("total", 0)
        paid_at = None
        status_transitions = invoice.get("status_transitions") or {}
        if status_value == "paid":
            paid_at = _from_unix(status_transitions.get("paid_at") or invoice.get("created"))
        else:
            paid_at = _from_unix(invoice.get("created"))
        payment = self._upsert_payment(
            uid=uid,
            provider="stripe",
            subscription_id=subscription.id if subscription else None,
            provider_invoice_id=invoice.get("id"),
            provider_payment_id=invoice.get("payment_intent") or invoice.get("charge"),
            amount_paid_cents=int(amount or 0),
            currency=invoice.get("currency", "USD"),
            status_value=status_value,
            paid_at=paid_at,
            raw_provider_object=invoice,
            event_created_at=event_created_at,
            event_id=event_id,
        )
        if subscription and payment.subscription_id is None:
            payment.subscription_id = subscription.id

        should_update_subscription = status_value == "paid" or self._can_degrade_existing_subscription_from_payment(
            subscription
        )
        if provider_subscription_id and should_update_subscription:
            existing_start = subscription.current_period_start if subscription else None
            existing_end = subscription.current_period_end if subscription else None
            subscription_status = "active" if status_value == "paid" else "past_due"
            if status_value in {"canceled", "pending"}:
                subscription_status = status_value
            self._activate_subscription(
                uid=uid,
                plan_key=plan_key,
                provider="stripe",
                provider_checkout_session_id=None,
                provider_subscription_id=provider_subscription_id,
                provider_customer_id=invoice.get("customer"),
                raw_provider_object={**invoice, "subscription_status_source": event_type},
                current_period_start=existing_start,
                current_period_end=existing_end,
                status_value=subscription_status,
                cancel_at_period_end=subscription.cancel_at_period_end if subscription else False,
                force_current=False,
                event_created_at=event_created_at,
                event_id=event_id,
            )
        return True

    def _paypal_metadata(self, resource: dict[str, Any]) -> dict[str, Any]:
        metadata = dict(resource.get("metadata") or {})
        for key in ("custom_id", "custom", "customId"):
            metadata.update(_decode_json_metadata(resource.get(key)))
        return metadata

    def _paypal_plan_key(self, resource: dict[str, Any], metadata: dict[str, Any]) -> str | None:
        if metadata.get("plan_key"):
            return str(metadata["plan_key"])
        plan_id = resource.get("plan_id") or (resource.get("plan") or {}).get("id")
        plan_ids = {
            self.settings.paypal_plan_pro_month: "pro-month",
            self.settings.paypal_plan_pro_year: "pro-year",
            self.settings.paypal_plan_enterprise_month: "enterprise-month",
            self.settings.paypal_plan_enterprise_year: "enterprise-year",
        }
        return plan_ids.get(plan_id)

    def _paypal_subscription_id(self, resource: dict[str, Any]) -> str | None:
        return (
            resource.get("billing_agreement_id")
            or resource.get("subscription_id")
            or resource.get("subscriptionId")
            or resource.get("id")
        )

    def _paypal_payer_id(self, resource: dict[str, Any]) -> str | None:
        subscriber = resource.get("subscriber") or {}
        payer = resource.get("payer") or {}
        payer_info = payer.get("payer_info") or {}
        return subscriber.get("payer_id") or payer.get("payer_id") or payer_info.get("payer_id")

    def _paypal_period_end(self, resource: dict[str, Any]) -> datetime | None:
        billing_info = resource.get("billing_info") or {}
        return _from_iso(billing_info.get("next_billing_time")) or _from_iso(resource.get("next_billing_time"))

    def _paypal_amount(self, resource: dict[str, Any]) -> tuple[int, str]:
        amount = resource.get("amount") or resource.get("gross_amount") or {}
        if isinstance(amount, dict):
            value = amount.get("value") or amount.get("total")
            currency = amount.get("currency_code") or amount.get("currency") or "USD"
            return _amount_to_cents(value), str(currency)
        return 0, "USD"

    def _paypal_payment_status(self, event_type: str, resource: dict[str, Any]) -> str:
        resource_status = str(resource.get("status") or "").lower()
        event_type = event_type.upper()
        if "FAILED" in event_type or resource_status in {"failed", "denied", "declined"}:
            return "failed"
        if "COMPLETED" in event_type or "SUCCEEDED" in event_type or resource_status == "completed":
            return "paid"
        if "PENDING" in event_type or resource_status == "pending":
            return "pending"
        return "paid"

    def _process_paypal_subscription_event(
        self,
        event_id: str,
        event_type: str,
        resource: dict[str, Any],
        event_created_at: datetime | None,
    ) -> bool:
        metadata = self._paypal_metadata(resource)
        uid = metadata.get("firebase_uid")
        plan_key = self._paypal_plan_key(resource, metadata)
        provider_subscription_id = self._paypal_subscription_id(resource)
        existing = self._find_provider_subscription("paypal", provider_subscription_id, None)
        uid = uid or (existing.firebase_uid if existing else None)
        plan_key = plan_key or (existing.plan_key if existing else None)
        if not uid or not plan_key or not provider_subscription_id:
            return False

        if event_type.endswith("CANCELLED") or event_type.endswith("CANCELED"):
            status_value = "canceled"
        elif event_type.endswith("SUSPENDED"):
            status_value = "suspended"
        elif event_type.endswith("ACTIVATED"):
            status_value = "active"
        else:
            status_value = _normalize_status("paypal", resource.get("status"), "pending")
        current_period_end = self._paypal_period_end(resource)
        if status_value == "canceled" and current_period_end is None:
            current_period_end = utcnow()
        self._activate_subscription(
            uid=uid,
            plan_key=plan_key,
            provider="paypal",
            provider_checkout_session_id=None,
            provider_subscription_id=provider_subscription_id,
            provider_customer_id=self._paypal_payer_id(resource),
            raw_provider_object=resource,
            current_period_end=current_period_end,
            status_value=status_value,
            cancel_at_period_end=bool(resource.get("cancel_at_period_end", False)),
            force_current=status_value in CURRENT_STATUSES,
            event_created_at=event_created_at,
            event_id=event_id,
        )
        return True

    def _process_paypal_payment_event(
        self,
        event_id: str,
        event_type: str,
        resource: dict[str, Any],
        event_created_at: datetime | None,
    ) -> bool:
        provider_subscription_id = self._paypal_subscription_id(resource)
        subscription = self._find_provider_subscription("paypal", provider_subscription_id, None)
        metadata = self._paypal_metadata(resource)
        uid = metadata.get("firebase_uid") or (subscription.firebase_uid if subscription else None)
        plan_key = self._paypal_plan_key(resource, metadata) or (subscription.plan_key if subscription else None)
        if not uid or not plan_key:
            return False

        amount_paid_cents, currency = self._paypal_amount(resource)
        status_value = self._paypal_payment_status(event_type, resource)
        paid_at = _from_iso(resource.get("time")) or event_created_at
        self._upsert_payment(
            uid=uid,
            provider="paypal",
            subscription_id=subscription.id if subscription else None,
            provider_invoice_id=resource.get("invoice_id") or resource.get("invoiceId"),
            provider_payment_id=resource.get("id"),
            amount_paid_cents=amount_paid_cents,
            currency=currency,
            status_value=status_value,
            paid_at=paid_at,
            raw_provider_object=resource,
            event_created_at=event_created_at,
            event_id=event_id,
        )
        should_update_subscription = status_value == "paid" or self._can_degrade_existing_subscription_from_payment(
            subscription
        )
        if provider_subscription_id and should_update_subscription:
            subscription_status = "active" if status_value == "paid" else "past_due"
            if status_value == "pending":
                subscription_status = "pending"
            self._activate_subscription(
                uid=uid,
                plan_key=plan_key,
                provider="paypal",
                provider_checkout_session_id=None,
                provider_subscription_id=provider_subscription_id,
                provider_customer_id=self._paypal_payer_id(resource),
                raw_provider_object={**resource, "subscription_status_source": event_type},
                current_period_start=subscription.current_period_start if subscription else None,
                current_period_end=subscription.current_period_end if subscription else None,
                status_value=subscription_status,
                cancel_at_period_end=subscription.cancel_at_period_end if subscription else False,
                force_current=False,
                event_created_at=event_created_at,
                event_id=event_id,
            )
        return True

    def _record_billing_event(
        self, provider: str, event: dict[str, Any], payload_bytes: bytes
    ) -> tuple[BillingEvent, bool]:
        event_id = event.get("id") or event.get("event_id")
        event_type = event.get("type") or event.get("event_type")
        if not event_id or not event_type:
            raise HTTPException(status_code=400, detail=f"Invalid {provider.title()} event")

        payload_sha = hashlib.sha256(payload_bytes).hexdigest()
        billing_event = BillingEvent(
            provider=provider,
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
                select(BillingEvent).where(
                    BillingEvent.provider == provider,
                    BillingEvent.event_id == event_id,
                )
            )
            if existing_event and existing_event.processing_status in {"processed", "ignored"}:
                return existing_event, True
            if not existing_event:
                raise
            billing_event = existing_event
            billing_event.event_type = event_type
            billing_event.payload = event
            billing_event.payload_sha256 = payload_sha
            billing_event.processing_status = "received"
            billing_event.error = None
        return billing_event, False

    def _finish_billing_event(self, billing_event: BillingEvent, handled: bool) -> dict[str, Any]:
        billing_event.processing_status = "processed" if handled else "ignored"
        billing_event.processed_at = utcnow()
        self.db.commit()
        return {"received": True, "ignored": not handled}

    def process_stripe_event(self, event: dict[str, Any], payload_bytes: bytes) -> dict[str, Any]:
        billing_event, duplicate = self._record_billing_event("stripe", event, payload_bytes)
        if duplicate:
            return {"received": True, "duplicate": True}

        event_id = billing_event.event_id
        event_type = billing_event.event_type
        event_created_at = _event_created_at(event)
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
                        event_created_at=event_created_at,
                        event_id=event_id,
                    )
                    handled = True
            elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
                metadata = data_object.get("metadata", {})
                provider_subscription_id = data_object.get("id")
                existing = self._find_provider_subscription("stripe", provider_subscription_id, None)
                uid = metadata.get("firebase_uid") or (existing.firebase_uid if existing else None)
                plan_key = metadata.get("plan_key") or (existing.plan_key if existing else None)
                if uid and plan_key:
                    is_deleted = event_type.endswith("deleted")
                    status_value = "canceled" if is_deleted else data_object.get("status", "active")
                    current_period_end = _from_unix(data_object.get("current_period_end"))
                    if is_deleted and current_period_end is None:
                        current_period_end = utcnow()
                    self._activate_subscription(
                        uid=uid,
                        plan_key=plan_key,
                        provider="stripe",
                        provider_checkout_session_id=None,
                        provider_subscription_id=provider_subscription_id,
                        provider_customer_id=data_object.get("customer"),
                        raw_provider_object=data_object,
                        current_period_start=_from_unix(data_object.get("current_period_start")),
                        current_period_end=current_period_end,
                        status_value=status_value,
                        cancel_at_period_end=bool(data_object.get("cancel_at_period_end", False)),
                        force_current=False,
                        event_created_at=event_created_at,
                        event_id=event_id,
                    )
                    handled = True
            elif event_type in {
                "invoice.paid",
                "invoice.payment_succeeded",
                "invoice.payment_failed",
                "invoice.marked_uncollectible",
                "invoice.voided",
            }:
                handled = self._process_stripe_invoice_event(
                    event_id,
                    event_type,
                    data_object,
                    event_created_at,
                )

            return self._finish_billing_event(billing_event, handled)
        except Exception as exc:
            billing_event.processing_status = "failed"
            billing_event.error = str(exc)
            self.db.commit()
            raise

    def process_paypal_event(self, event: dict[str, Any], payload_bytes: bytes) -> dict[str, Any]:
        billing_event, duplicate = self._record_billing_event("paypal", event, payload_bytes)
        if duplicate:
            return {"received": True, "duplicate": True}

        event_id = billing_event.event_id
        event_type = billing_event.event_type.upper()
        event_created_at = _event_created_at(event)
        resource = event.get("resource", {})
        handled = False
        try:
            if event_type.startswith("BILLING.SUBSCRIPTION.PAYMENT"):
                handled = self._process_paypal_payment_event(
                    event_id,
                    event_type,
                    resource,
                    event_created_at,
                )
            elif event_type.startswith("PAYMENT.") or "PAYMENT" in event_type:
                handled = self._process_paypal_payment_event(
                    event_id,
                    event_type,
                    resource,
                    event_created_at,
                )
            elif event_type.startswith("BILLING.SUBSCRIPTION"):
                handled = self._process_paypal_subscription_event(
                    event_id,
                    event_type,
                    resource,
                    event_created_at,
                )

            return self._finish_billing_event(billing_event, handled)
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
