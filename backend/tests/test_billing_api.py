from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select

from app.core.settings import Settings, get_settings
from app.db.models import BillingCheckoutSession, BillingCustomer, BillingEvent, BillingPayment, BillingSubscription
from app.db.session import SessionLocal
from app.schemas.billing import AuthenticatedUser
from app.services.billing_service import BillingService


def test_health_and_plan_catalog_are_public(client):
    assert client.get("/healthz").json()["status"] == "ok"
    plans = client.get("/v1/billing/plans").json()["plans"]
    keys = {plan["key"] for plan in plans}
    assert {"free", "pro-month", "pro-year", "enterprise-month", "enterprise-year"} <= keys


def test_billing_me_requires_bearer_token(client):
    response = client.get("/v1/billing/me")
    assert response.status_code == 401


def test_e2e_token_requires_secret_when_configured(client):
    response = client.get("/v1/billing/me", headers={"Authorization": "Bearer e2e:alice:alice@example.com"})
    assert response.status_code == 401


def test_new_authenticated_user_gets_effective_free_entitlement(client, auth_headers):
    response = client.get("/v1/billing/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["uid"] == "alice"
    assert body["subscription"]["plan"] == "free"
    assert body["subscription"]["features"]["maxActiveRooms"] == 1


def test_checkout_rejects_invalid_plan_key(client, auth_headers):
    response = client.post(
        "/v1/billing/checkout-sessions",
        json={"planKey": "bogus", "locale": "es"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported planKey"


def test_checkout_ignores_user_id_and_only_activates_after_server_confirm(client, auth_headers):
    response = client.post(
        "/v1/billing/checkout-sessions",
        json={"planKey": "pro-month", "locale": "es", "userId": "mallory"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    checkout = response.json()
    assert checkout["checkoutSessionId"].startswith("fake_cs_")
    assert checkout["provider"] == "stripe"
    assert "/es/settings/subscription/success" in checkout["checkoutUrl"]
    assert "provider=stripe" in checkout["checkoutUrl"]

    before_confirm = client.get("/v1/billing/me", headers=auth_headers).json()
    assert before_confirm["subscription"]["plan"] == "free"

    confirmed = client.post(
        f"/v1/billing/checkout-sessions/{checkout['checkoutSessionId']}/confirm",
        headers=auth_headers,
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["subscription"]["plan"] == "pro"
    assert confirmed.json()["subscription"]["billingInterval"] == "month"
    assert confirmed.json()["subscription"]["provider"] == "stripe"
    assert confirmed.json()["subscription"]["manageableActions"] == {
        "canCancel": True,
        "canChangePlan": True,
        "canManageBilling": False,
        "canUpdatePaymentMethod": False,
    }

    after_confirm = client.get("/v1/billing/me", headers=auth_headers).json()
    assert after_confirm["subscription"]["plan"] == "pro"
    assert after_confirm["subscription"]["features"]["maxActiveRooms"] == 5


def test_checkout_confirmation_is_owner_scoped(client, auth_headers, other_auth_headers):
    checkout = client.post(
        "/v1/billing/checkout-sessions",
        json={"planKey": "enterprise-year", "locale": "en"},
        headers=auth_headers,
    ).json()

    forbidden = client.post(
        f"/v1/billing/checkout-sessions/{checkout['checkoutSessionId']}/confirm",
        headers=other_auth_headers,
    )
    assert forbidden.status_code == 403

    bob = client.get("/v1/billing/me", headers=other_auth_headers).json()
    assert bob["subscription"]["plan"] == "free"


def test_cancel_current_subscription_is_server_authoritative(client, auth_headers):
    checkout = client.post(
        "/v1/billing/checkout-sessions",
        json={"planKey": "pro-year", "locale": "es"},
        headers=auth_headers,
    ).json()
    client.post(f"/v1/billing/checkout-sessions/{checkout['checkoutSessionId']}/confirm", headers=auth_headers)

    cancel = client.post(
        "/v1/billing/subscription/me/cancel",
        json={"reason": "testing"},
        headers=auth_headers,
    )
    assert cancel.status_code == 200
    assert cancel.json()["subscription"]["status"] == "active"
    assert cancel.json()["subscription"]["cancelAtPeriodEnd"] is True
    assert cancel.json()["subscription"]["manageableActions"]["canCancel"] is False


def stripe_portal_settings() -> Settings:
    return Settings(
        app_env="test",
        database_url="sqlite:///:memory:",
        billing_provider="stripe",
        e2e_test_mode=False,
        e2e_test_secret="test-secret",
        stripe_secret_key="sk_test_portal",
    )


def test_portal_session_creates_real_stripe_customer_portal(monkeypatch):
    with SessionLocal() as db:
        customer = BillingCustomer(
            firebase_uid="alice",
            email="alice@example.com",
            stripe_customer_id="cus_portal",
            provider_customer_ids={"stripe": "cus_portal"},
        )
        db.add(customer)
        db.add(
            BillingSubscription(
                firebase_uid="alice",
                plan_key="pro-month",
                plan="pro",
                billing_interval="month",
                status="active",
                payment_method="stripe",
                provider="stripe",
                provider_customer_id="cus_portal",
                provider_subscription_id="sub_portal",
            )
        )
        db.commit()

        import stripe

        calls = []

        def fake_create(**kwargs):
            calls.append(kwargs)
            return {"id": "bps_test", "url": "https://billing.stripe.test/session"}

        monkeypatch.setattr(stripe.billing_portal.Session, "create", fake_create)

        response = BillingService(db, settings=stripe_portal_settings()).create_portal_session(
            AuthenticatedUser(uid="alice", email="alice@example.com"), "en"
        )

    assert response == {"url": "https://billing.stripe.test/session"}
    assert calls == [
        {
            "customer": "cus_portal",
            "return_url": "http://localhost:3000/en/settings/subscription",
        }
    ]
    assert stripe.api_key == "sk_test_portal"


def test_portal_session_falls_back_when_user_has_no_stripe_subscription(monkeypatch):
    import stripe

    def fail_create(**_kwargs):
        raise AssertionError("Stripe portal should not be called without an active Stripe subscription")

    monkeypatch.setattr(stripe.billing_portal.Session, "create", fail_create)

    with SessionLocal() as db:
        response = BillingService(db, settings=stripe_portal_settings()).create_portal_session(
            AuthenticatedUser(uid="alice", email="alice@example.com")
        )

    assert response == {"url": "http://localhost:3000/es/settings/subscription"}


def test_portal_session_reports_stripe_provider_errors(monkeypatch):
    with SessionLocal() as db:
        db.add(
            BillingSubscription(
                firebase_uid="alice",
                plan_key="pro-month",
                plan="pro",
                billing_interval="month",
                status="active",
                payment_method="stripe",
                provider="stripe",
                provider_customer_id="cus_portal",
                provider_subscription_id="sub_portal",
            )
        )
        db.commit()

        import stripe

        def fail_create(**_kwargs):
            raise RuntimeError("stripe unavailable")

        monkeypatch.setattr(stripe.billing_portal.Session, "create", fail_create)

        with pytest.raises(HTTPException) as exc_info:
            BillingService(db, settings=stripe_portal_settings()).create_portal_session(
                AuthenticatedUser(uid="alice", email="alice@example.com")
            )

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Stripe Customer Portal session failed"


def test_production_configuration_rejects_fake_billing_and_e2e(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "fake")
    monkeypatch.setenv("E2E_TEST_MODE", "true")
    with pytest.raises(ValueError, match="Invalid production billing configuration"):
        Settings()


def test_staging_accepts_railway_postgres_url_with_psycopg_driver(monkeypatch):
    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("E2E_TEST_MODE", "false")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    monkeypatch.setenv("STRIPE_PRICE_PRO_MONTH", "price_pro_month")
    monkeypatch.setenv("STRIPE_PRICE_PRO_YEAR", "price_pro_year")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_MONTH", "price_ent_month")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_YEAR", "price_ent_year")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "project")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account"}')

    assert Settings().normalized_database_url == "postgresql+psycopg://user:pass@example.com/db"


def test_staging_requires_signed_stripe_webhooks(monkeypatch):
    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("E2E_TEST_MODE", "false")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    monkeypatch.setenv("STRIPE_PRICE_PRO_MONTH", "price_pro_month")
    monkeypatch.setenv("STRIPE_PRICE_PRO_YEAR", "price_pro_year")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_MONTH", "price_ent_month")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_YEAR", "price_ent_year")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "project")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account"}')
    with pytest.raises(ValueError, match="STRIPE_WEBHOOK_SECRET"):
        Settings()


def test_production_requires_paypal_env_when_provider_is_paypal(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "paypal")
    monkeypatch.setenv("E2E_TEST_MODE", "false")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "project")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account"}')
    for key in [
        "PAYPAL_CLIENT_ID",
        "PAYPAL_CLIENT_SECRET",
        "PAYPAL_ENVIRONMENT",
        "PAYPAL_WEBHOOK_ID",
        "PAYPAL_PLAN_PRO_MONTH",
        "PAYPAL_PLAN_PRO_YEAR",
        "PAYPAL_PLAN_ENTERPRISE_MONTH",
        "PAYPAL_PLAN_ENTERPRISE_YEAR",
    ]:
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(ValueError) as exc_info:
        Settings()

    message = str(exc_info.value)
    for env_name in [
        "PAYPAL_CLIENT_ID",
        "PAYPAL_CLIENT_SECRET",
        "PAYPAL_ENVIRONMENT",
        "PAYPAL_WEBHOOK_ID",
        "PAYPAL_PLAN_PRO_MONTH",
        "PAYPAL_PLAN_PRO_YEAR",
        "PAYPAL_PLAN_ENTERPRISE_MONTH",
        "PAYPAL_PLAN_ENTERPRISE_YEAR",
    ]:
        assert env_name in message


def test_production_accepts_paypal_provider_with_full_env(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "paypal")
    monkeypatch.setenv("E2E_TEST_MODE", "false")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "project")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account"}')
    monkeypatch.setenv("PAYPAL_CLIENT_ID", "client_id_x")
    monkeypatch.setenv("PAYPAL_CLIENT_SECRET", "client_secret_x")
    monkeypatch.setenv("PAYPAL_ENVIRONMENT", "live")
    monkeypatch.setenv("PAYPAL_WEBHOOK_ID", "wh_id_x")
    monkeypatch.setenv("PAYPAL_PLAN_PRO_MONTH", "P-PROMO")
    monkeypatch.setenv("PAYPAL_PLAN_PRO_YEAR", "P-PROYR")
    monkeypatch.setenv("PAYPAL_PLAN_ENTERPRISE_MONTH", "P-ENTMO")
    monkeypatch.setenv("PAYPAL_PLAN_ENTERPRISE_YEAR", "P-ENTYR")

    settings = Settings()
    assert settings.billing_provider == "paypal"
    assert settings.paypal_environment == "live"
    status = settings.provider_config_status("paypal")
    assert status["configured"] is True
    assert status["webhookConfigured"] is True
    assert status["environment"] == "live"
    plans = status["plans"]
    assert isinstance(plans, dict)
    assert plans["pro-month"] == "P-PROMO"


def test_production_paypal_requires_live_environment(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@example.com/db")
    monkeypatch.setenv("BILLING_PROVIDER", "paypal")
    monkeypatch.setenv("E2E_TEST_MODE", "false")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "project")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account"}')
    monkeypatch.setenv("PAYPAL_CLIENT_ID", "client_id_x")
    monkeypatch.setenv("PAYPAL_CLIENT_SECRET", "client_secret_x")
    monkeypatch.setenv("PAYPAL_ENVIRONMENT", "sandbox")
    monkeypatch.setenv("PAYPAL_WEBHOOK_ID", "wh_id_x")
    monkeypatch.setenv("PAYPAL_PLAN_PRO_MONTH", "P-PROMO")
    monkeypatch.setenv("PAYPAL_PLAN_PRO_YEAR", "P-PROYR")
    monkeypatch.setenv("PAYPAL_PLAN_ENTERPRISE_MONTH", "P-ENTMO")
    monkeypatch.setenv("PAYPAL_PLAN_ENTERPRISE_YEAR", "P-ENTYR")

    with pytest.raises(ValueError, match="PAYPAL_ENVIRONMENT=live"):
        Settings()


def test_paypal_environment_rejects_unknown_value(monkeypatch):
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("BILLING_PROVIDER", "fake")
    monkeypatch.setenv("PAYPAL_ENVIRONMENT", "staging-not-allowed")
    with pytest.raises(Exception):
        Settings()


def test_providers_smoke_endpoint_reports_active_supported_and_default_providers(client):
    response = client.get("/v1/billing/providers")
    assert response.status_code == 200
    body = response.json()
    assert body["activeProvider"] == "fake"
    assert body["defaultPublicProvider"] == "stripe"
    assert body["supportedProviders"] == ["stripe", "paypal"]
    assert "environment" in body
    assert body["database"]["sqlite"] is True
    for name in ("stripe", "paypal"):
        assert name in body["providers"]
        entry = body["providers"][name]
        assert entry["provider"] == name
        assert "configured" in entry
        assert "webhookConfigured" in entry
        assert set(entry["plans"]) == {"pro-month", "pro-year", "enterprise-month", "enterprise-year"}
        for plan_id in entry["plans"].values():
            if plan_id is not None:
                assert "secret" not in plan_id.lower()


def test_providers_smoke_endpoint_reflects_stripe_env_when_configured(client, monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    monkeypatch.setenv("STRIPE_PRICE_PRO_MONTH", "price_pro_month")
    monkeypatch.setenv("STRIPE_PRICE_PRO_YEAR", "price_pro_year")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_MONTH", "price_ent_month")
    monkeypatch.setenv("STRIPE_PRICE_ENTERPRISE_YEAR", "price_ent_year")
    get_settings.cache_clear()
    try:
        body = client.get("/v1/billing/providers").json()
        stripe = body["providers"]["stripe"]
        assert stripe["configured"] is True
        assert stripe["credentialsConfigured"] is True
        assert stripe["webhookConfigured"] is True
        assert stripe["plans"]["pro-month"] == "price_pro_month"
        assert stripe["missingRequiredEnv"] == []
    finally:
        get_settings.cache_clear()


def test_provider_config_status_rejects_unknown_provider():
    settings = get_settings()
    result = settings.provider_config_status("bitcoin")
    assert result["provider"] == "bitcoin"
    assert result["configured"] is False
    assert result["plans"] == {}


def test_stripe_webhook_rejects_invalid_signature_when_secret_configured(client, monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    response = client.post(
        "/v1/webhooks/stripe",
        content=json.dumps({"id": "evt_1", "type": "checkout.session.completed"}),
        headers={"Stripe-Signature": "bad"},
    )
    assert response.status_code == 400


def test_unsigned_stripe_webhook_is_idempotent_only_in_local_test(client, auth_headers):
    event = {
        "id": "evt_test_checkout_completed",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_webhook",
                "customer": "cus_test",
                "subscription": "sub_test",
                "metadata": {"firebase_uid": "alice", "plan_key": "enterprise-month"},
            }
        },
    }
    first = client.post("/v1/webhooks/stripe", json=event)
    second = client.post("/v1/webhooks/stripe", json=event)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["duplicate"] is True

    me = client.get("/v1/billing/me", headers=auth_headers).json()
    assert me["subscription"]["plan"] == "enterprise"
    assert me["subscription"]["features"]["maxActiveRooms"] == 20


def test_stripe_checkout_webhooks_upsert_same_subscription_id(client, auth_headers):
    for event_id in ["evt_checkout_1", "evt_checkout_2"]:
        response = client.post(
            "/v1/webhooks/stripe",
            json={
                "id": event_id,
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": f"cs_{event_id}",
                        "customer": "cus_test",
                        "subscription": "sub_same",
                        "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                    }
                },
            },
        )
        assert response.status_code == 200

    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(BillingSubscription).where(BillingSubscription.provider_subscription_id == "sub_same"))
    assert count == 1
    assert client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]["plan"] == "pro"


def test_stripe_deleted_webhook_expires_entitlement_without_synthetic_future_period(client, auth_headers):
    client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_checkout_before_delete",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_delete",
                    "customer": "cus_test",
                    "subscription": "sub_delete",
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )
    delete_response = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_delete",
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_delete",
                    "customer": "cus_test",
                    "status": "canceled",
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )
    assert delete_response.status_code == 200

    me = client.get("/v1/billing/me", headers=auth_headers).json()
    assert me["subscription"]["plan"] == "free"


def test_failed_stripe_event_can_be_retried(client, auth_headers):
    with SessionLocal() as db:
        db.add(
            BillingEvent(
                provider="stripe",
                event_id="evt_retry",
                event_type="checkout.session.completed",
                payload={},
                payload_sha256="old",
                processing_status="failed",
                error="transient",
            )
        )
        db.commit()

    response = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_retry",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_retry",
                    "customer": "cus_test",
                    "subscription": "sub_retry",
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )
    assert response.status_code == 200
    assert response.json().get("duplicate") is not True
    assert client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]["plan"] == "pro"


def test_stripe_invoice_events_update_payment_history_and_recover_entitlements(client, auth_headers):
    future_end = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
    with SessionLocal() as db:
        BillingService(db)._activate_subscription(
            uid="alice",
            plan_key="pro-month",
            provider="stripe",
            provider_checkout_session_id="cs_lifecycle",
            provider_subscription_id="sub_lifecycle",
            provider_customer_id="cus_lifecycle",
            raw_provider_object={"provider": "stripe"},
            current_period_end=datetime.fromtimestamp(future_end, timezone.utc),
        )
        db.commit()

    failed = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_invoice_failed_lifecycle",
            "created": 100,
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "id": "in_lifecycle",
                    "customer": "cus_lifecycle",
                    "subscription": "sub_lifecycle",
                    "amount_due": 2999,
                    "currency": "usd",
                    "created": 100,
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )
    assert failed.status_code == 200
    after_failure = client.get("/v1/billing/me", headers=auth_headers).json()
    assert after_failure["subscription"]["status"] == "past_due"
    assert after_failure["subscription"]["plan"] == "pro"
    assert after_failure["payments"][0]["status"] == "failed"

    recovered = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_invoice_paid_lifecycle",
            "created": 200,
            "type": "invoice.paid",
            "data": {
                "object": {
                    "id": "in_lifecycle",
                    "customer": "cus_lifecycle",
                    "subscription": "sub_lifecycle",
                    "payment_intent": "pi_lifecycle",
                    "amount_paid": 2999,
                    "currency": "usd",
                    "created": 200,
                    "status_transitions": {"paid_at": 200},
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )
    assert recovered.status_code == 200

    body = client.get("/v1/billing/me", headers=auth_headers).json()
    assert body["subscription"]["status"] == "active"
    assert body["subscription"]["features"]["maxActiveRooms"] == 5
    assert body["payments"] == [
        {
            "id": body["payments"][0]["id"],
            "userId": "alice",
            "subscriptionId": body["subscription"]["id"],
            "amount": 29.99,
            "currency": "USD",
            "date": body["payments"][0]["date"],
            "status": "paid",
            "paymentMethod": "stripe",
            "provider": "stripe",
            "providerInvoiceId": "in_lifecycle",
            "providerPaymentId": "pi_lifecycle",
            "transactionId": "pi_lifecycle",
        }
    ]
    with SessionLocal() as db:
        payment_count = db.scalar(select(func.count()).select_from(BillingPayment))
    assert payment_count == 1


def test_initial_stripe_failed_invoice_records_payment_without_paid_entitlement(client, auth_headers):
    failed = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_initial_invoice_failed",
            "created": 100,
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "id": "in_initial_failed",
                    "customer": "cus_initial_failed",
                    "subscription": "sub_initial_failed",
                    "amount_due": 2999,
                    "currency": "usd",
                    "created": 100,
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
                }
            },
        },
    )

    assert failed.status_code == 200
    body = client.get("/v1/billing/me", headers=auth_headers).json()
    assert body["subscription"]["plan"] == "free"
    assert body["subscription"]["features"]["maxActiveRooms"] == 1
    assert body["payments"][0]["status"] == "failed"
    assert body["payments"][0]["provider"] == "stripe"
    assert body["payments"][0]["providerInvoiceId"] == "in_initial_failed"


def test_duplicate_stripe_invoice_event_does_not_duplicate_payment_history(client):
    event = {
        "id": "evt_invoice_duplicate_paid",
        "created": 300,
        "type": "invoice.paid",
        "data": {
            "object": {
                "id": "in_duplicate_paid",
                "customer": "cus_duplicate",
                "subscription": "sub_duplicate",
                "payment_intent": "pi_duplicate",
                "amount_paid": 5000,
                "currency": "usd",
                "created": 300,
                "status_transitions": {"paid_at": 300},
                "metadata": {"firebase_uid": "alice", "plan_key": "enterprise-month"},
            }
        },
    }

    first = client.post("/v1/webhooks/stripe", json=event)
    second = client.post("/v1/webhooks/stripe", json=event)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["duplicate"] is True
    with SessionLocal() as db:
        payment_count = db.scalar(select(func.count()).select_from(BillingPayment))
    assert payment_count == 1


def test_out_of_order_subscription_events_do_not_downgrade_recovered_status(client, auth_headers):
    future_end = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
    active_event = {
        "id": "evt_sub_active_newer",
        "created": 200,
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_ordered",
                "customer": "cus_ordered",
                "status": "active",
                "current_period_start": 1,
                "current_period_end": future_end,
                "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
            }
        },
    }
    stale_past_due_event = {
        "id": "evt_sub_past_due_older",
        "created": 100,
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_ordered",
                "customer": "cus_ordered",
                "status": "past_due",
                "current_period_start": 1,
                "current_period_end": future_end,
                "metadata": {"firebase_uid": "alice", "plan_key": "pro-month"},
            }
        },
    }

    assert client.post("/v1/webhooks/stripe", json=active_event).status_code == 200
    assert client.post("/v1/webhooks/stripe", json=stale_past_due_event).status_code == 200

    subscription = client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]
    assert subscription["status"] == "active"
    assert subscription["plan"] == "pro"


def test_cancel_at_period_end_preserves_entitlement_until_deleted_event(client, auth_headers):
    future_end = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
    cancel_at_period_end = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_cancel_at_period_end",
            "created": 100,
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_cancel_at_period_end",
                    "customer": "cus_cancel",
                    "status": "active",
                    "cancel_at_period_end": True,
                    "current_period_start": 1,
                    "current_period_end": future_end,
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-year"},
                }
            },
        },
    )
    assert cancel_at_period_end.status_code == 200

    subscription = client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]
    assert subscription["plan"] == "pro"
    assert subscription["status"] == "active"
    assert subscription["cancelAtPeriodEnd"] is True
    assert subscription["autoRenew"] is False
    assert subscription["manageableActions"]["canCancel"] is False

    deleted = client.post(
        "/v1/webhooks/stripe",
        json={
            "id": "evt_cancel_at_period_end_deleted",
            "created": 200,
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_cancel_at_period_end",
                    "customer": "cus_cancel",
                    "status": "canceled",
                    "current_period_end": int(datetime.now(timezone.utc).timestamp()),
                    "metadata": {"firebase_uid": "alice", "plan_key": "pro-year"},
                }
            },
        },
    )
    assert deleted.status_code == 200
    assert client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]["plan"] == "free"


def test_legacy_cancelled_status_with_future_period_keeps_grace_entitlement(client, auth_headers):
    with SessionLocal() as db:
        db.add(
            BillingSubscription(
                firebase_uid="alice",
                plan_key="pro-month",
                plan="pro",
                billing_interval="month",
                status="cancelled",
                payment_method="stripe",
                provider="stripe",
                provider_customer_id="cus_legacy_cancelled",
                provider_subscription_id="sub_legacy_cancelled",
                current_period_start=datetime.now(timezone.utc) - timedelta(days=1),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
                cancel_at_period_end=True,
                is_current=True,
                raw_provider_object={"legacy": True},
            )
        )
        db.commit()

    subscription = client.get("/v1/billing/me", headers=auth_headers).json()["subscription"]

    assert subscription["plan"] == "pro"
    assert subscription["status"] == "active"
    assert subscription["cancelAtPeriodEnd"] is True
    assert subscription["autoRenew"] is False
    assert subscription["features"]["maxActiveRooms"] == 5


def test_paypal_initial_failed_payment_records_payment_without_paid_entitlement(client, auth_headers):
    metadata = json.dumps({"firebase_uid": "alice", "plan_key": "pro-month"})

    failed_payment = client.post(
        "/v1/webhooks/paypal",
        json={
            "id": "WH-PAYPAL-INITIAL-FAILED",
            "event_type": "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
            "create_time": "2026-01-02T00:00:00Z",
            "resource": {
                "id": "PAYPAL-INITIAL-FAILED",
                "billing_agreement_id": "I-PAYPAL-INITIAL-FAILED",
                "invoice_id": "PAYPAL-INITIAL-FAILED-INVOICE",
                "custom_id": metadata,
                "amount": {"value": "29.99", "currency_code": "USD"},
                "time": "2026-01-02T00:00:00Z",
            },
        },
    )

    assert failed_payment.status_code == 200
    body = client.get("/v1/billing/me", headers=auth_headers).json()
    assert body["subscription"]["plan"] == "free"
    assert body["subscription"]["features"]["maxActiveRooms"] == 1
    assert body["payments"][0]["status"] == "failed"
    assert body["payments"][0]["provider"] == "paypal"
    assert body["payments"][0]["providerInvoiceId"] == "PAYPAL-INITIAL-FAILED-INVOICE"


def test_paypal_failed_payment_degrades_existing_subscription_to_past_due(client, auth_headers):
    metadata = json.dumps({"firebase_uid": "alice", "plan_key": "pro-month"})
    with SessionLocal() as db:
        BillingService(db)._activate_subscription(
            uid="alice",
            plan_key="pro-month",
            provider="paypal",
            provider_checkout_session_id=None,
            provider_subscription_id="I-PAYPAL-PAST-DUE",
            provider_customer_id="PAYER-PAST-DUE",
            raw_provider_object={"provider": "paypal"},
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.commit()

    failed_payment = client.post(
        "/v1/webhooks/paypal",
        json={
            "id": "WH-PAYPAL-PAST-DUE",
            "event_type": "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
            "create_time": "2026-01-02T00:00:00Z",
            "resource": {
                "id": "PAYPAL-PAST-DUE-PAYMENT",
                "billing_agreement_id": "I-PAYPAL-PAST-DUE",
                "invoice_id": "PAYPAL-PAST-DUE-INVOICE",
                "custom_id": metadata,
                "amount": {"value": "29.99", "currency_code": "USD"},
                "time": "2026-01-02T00:00:00Z",
            },
        },
    )

    assert failed_payment.status_code == 200
    body = client.get("/v1/billing/me", headers=auth_headers).json()
    assert body["subscription"]["plan"] == "pro"
    assert body["subscription"]["provider"] == "paypal"
    assert body["subscription"]["status"] == "past_due"
    assert body["payments"][0]["status"] == "failed"


def test_paypal_subscription_and_payment_events_update_history_idempotently(client, auth_headers):
    metadata = json.dumps({"firebase_uid": "alice", "plan_key": "enterprise-month"})
    activated = client.post(
        "/v1/webhooks/paypal",
        json={
            "id": "WH-PAYPAL-ACTIVE",
            "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
            "create_time": "2026-01-01T00:00:00Z",
            "resource": {
                "id": "I-PAYPAL-SUB",
                "status": "ACTIVE",
                "custom_id": metadata,
                "subscriber": {"payer_id": "PAYER-1"},
                "billing_info": {"next_billing_time": "2030-01-01T00:00:00Z"},
            },
        },
    )
    assert activated.status_code == 200

    payment_event = {
        "id": "WH-PAYPAL-PAID",
        "event_type": "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED",
        "create_time": "2026-01-02T00:00:00Z",
        "resource": {
            "id": "PAYPAL-PAYMENT-1",
            "billing_agreement_id": "I-PAYPAL-SUB",
            "invoice_id": "PAYPAL-INVOICE-1",
            "custom_id": metadata,
            "amount": {"value": "99.00", "currency_code": "USD"},
            "time": "2026-01-02T00:00:00Z",
        },
    }
    first_payment = client.post("/v1/webhooks/paypal", json=payment_event)
    second_payment = client.post("/v1/webhooks/paypal", json=payment_event)

    assert first_payment.status_code == 200
    assert second_payment.status_code == 200
    assert second_payment.json()["duplicate"] is True
    body = client.get("/v1/billing/me", headers=auth_headers).json()
    assert body["subscription"]["provider"] == "paypal"
    assert body["subscription"]["plan"] == "enterprise"
    assert body["payments"][0]["provider"] == "paypal"
    assert body["payments"][0]["status"] == "paid"
    assert body["payments"][0]["providerInvoiceId"] == "PAYPAL-INVOICE-1"
    assert body["payments"][0]["providerPaymentId"] == "PAYPAL-PAYMENT-1"
    with SessionLocal() as db:
        payment_count = db.scalar(select(func.count()).select_from(BillingPayment))
    assert payment_count == 1


def test_checkout_request_can_choose_paypal_without_client_side_activation(client, auth_headers):
    checkout_response = client.post(
        "/v1/billing/checkout-sessions",
        json={"planKey": "enterprise-month", "locale": "en", "provider": "paypal"},
        headers=auth_headers,
    )

    assert checkout_response.status_code == 200
    checkout = checkout_response.json()
    assert checkout["provider"] == "paypal"
    assert checkout["checkoutSessionId"].startswith("fake_cs_")
    assert "provider=paypal" in checkout["checkoutUrl"]

    before_confirm = client.get("/v1/billing/me", headers=auth_headers).json()
    assert before_confirm["subscription"]["plan"] == "free"

    confirmed = client.post(
        f"/v1/billing/checkout-sessions/{checkout['checkoutSessionId']}/confirm",
        headers=auth_headers,
    )

    assert confirmed.status_code == 200
    subscription = confirmed.json()["subscription"]
    assert subscription["plan"] == "enterprise"
    assert subscription["provider"] == "paypal"
    assert subscription["providerSubscriptionId"].startswith("fake_sub_")
    assert subscription["manageableActions"]["canCancel"] is True


def paypal_checkout_settings(**overrides) -> Settings:
    values = {
        "app_env": "test",
        "database_url": "sqlite:///:memory:",
        "billing_provider": "paypal",
        "e2e_test_mode": False,
        "e2e_test_secret": "test-secret",
        "frontend_base_url": "https://poker-planning.example",
        "paypal_client_id": "paypal-client",
        "paypal_client_secret": "paypal-secret",
        "paypal_environment": "sandbox",
        "paypal_plan_pro_month": "P-PRO-MONTH",
        "paypal_plan_pro_year": "P-PRO-YEAR",
        "paypal_plan_enterprise_month": "P-ENT-MONTH",
        "paypal_plan_enterprise_year": "P-ENT-YEAR",
    }
    values.update(overrides)
    return Settings(**values)


def test_non_e2e_paypal_checkout_creates_paypal_subscription(monkeypatch):
    with SessionLocal() as db:
        service = BillingService(db, settings=paypal_checkout_settings())
        calls = []

        def fake_paypal_request(method, path, body=None):
            calls.append({"method": method, "path": path, "body": body})
            assert method == "POST"
            assert path == "/v1/billing/subscriptions"
            assert body["plan_id"] == "P-PRO-MONTH"
            assert json.loads(body["custom_id"]) == {
                "firebase_uid": "alice",
                "plan_key": "pro-month",
            }
            assert body["application_context"]["return_url"] == (
                "https://poker-planning.example/en/settings/subscription/success?provider=paypal"
            )
            assert body["application_context"]["cancel_url"] == (
                "https://poker-planning.example/en/settings/subscription/cancel?provider=paypal"
            )
            assert body["application_context"]["user_action"] == "SUBSCRIBE_NOW"
            return {
                "id": "I-PAYPAL-CREATED",
                "status": "APPROVAL_PENDING",
                "links": [
                    {"rel": "self", "href": "https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-PAYPAL-CREATED"},
                    {"rel": "approve", "href": "https://paypal.example/checkoutnow?token=BA-123"},
                ],
            }

        monkeypatch.setattr(service, "_paypal_api_request", fake_paypal_request)

        result = service.create_checkout_session(
            AuthenticatedUser(uid="alice", email="alice@example.com"),
            "pro-month",
            "en",
            "paypal",
        )

        assert result == {
            "checkoutSessionId": "I-PAYPAL-CREATED",
            "provider": "paypal",
            "status": "created",
            "checkoutUrl": "https://paypal.example/checkoutnow?token=BA-123",
        }
        assert len(calls) == 1
        session = db.scalar(
            select(BillingCheckoutSession).where(
                BillingCheckoutSession.provider_session_id == "I-PAYPAL-CREATED"
            )
        )
        assert session is not None
        assert session.firebase_uid == "alice"
        assert session.plan_key == "pro-month"
        assert session.provider == "paypal"
        assert session.status == "created"
        assert db.scalar(select(func.count()).select_from(BillingSubscription)) == 0


def test_paypal_checkout_returns_clear_plan_configuration_error(monkeypatch):
    with SessionLocal() as db:
        service = BillingService(
            db,
            settings=paypal_checkout_settings(paypal_plan_enterprise_year=None),
        )

        def fail_paypal_request(*_args, **_kwargs):
            raise AssertionError("PayPal should not be called when the plan ID is missing")

        monkeypatch.setattr(service, "_paypal_api_request", fail_paypal_request)

        with pytest.raises(HTTPException) as exc_info:
            service.create_checkout_session(
                AuthenticatedUser(uid="alice", email="alice@example.com"),
                "enterprise-year",
                "en",
                "paypal",
            )

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "PayPal is not configured for plan enterprise-year"


def test_non_e2e_paypal_checkout_confirmation_keeps_non_active_subscription_pending(monkeypatch):
    with SessionLocal() as db:
        db.add(
            BillingCheckoutSession(
                firebase_uid="alice",
                plan_key="enterprise-month",
                provider="paypal",
                provider_session_id="I-PAYPAL-PENDING",
                checkout_url="https://paypal.example/approve",
            )
        )
        db.commit()

        service = BillingService(db, settings=paypal_checkout_settings())

        def fake_paypal_request(method, path, body=None):
            assert body is None
            assert method == "GET"
            assert path == "/v1/billing/subscriptions/I-PAYPAL-PENDING"
            return {
                "id": "I-PAYPAL-PENDING",
                "status": "APPROVAL_PENDING",
                "plan_id": "P-ENT-MONTH",
                "custom_id": json.dumps({"firebase_uid": "alice", "plan_key": "enterprise-month"}),
            }

        monkeypatch.setattr(service, "_paypal_api_request", fake_paypal_request)

        result = service.confirm_checkout_session(
            AuthenticatedUser(uid="alice", email="alice@example.com"),
            "I-PAYPAL-PENDING",
            "paypal",
        )

        assert result["status"] == "pending"
        assert result["subscription"]["plan"] == "free"
        assert (
            db.scalar(
                select(func.count())
                .select_from(BillingSubscription)
                .where(BillingSubscription.provider == "paypal")
            )
            == 0
        )
        session = db.scalar(
            select(BillingCheckoutSession).where(
                BillingCheckoutSession.provider_session_id == "I-PAYPAL-PENDING"
            )
        )
        assert session.status == "pending"
        assert session.completed_at is None


def test_non_e2e_paypal_checkout_confirmation_activates_verified_subscription(monkeypatch):
    with SessionLocal() as db:
        db.add(
            BillingCheckoutSession(
                firebase_uid="alice",
                plan_key="enterprise-year",
                provider="paypal",
                provider_session_id="I-PAYPAL-ACTIVE",
                checkout_url="https://paypal.example/approve",
            )
        )
        db.commit()

        service = BillingService(db, settings=paypal_checkout_settings())

        def fake_paypal_request(method, path, body=None):
            assert body is None
            assert method == "GET"
            assert path == "/v1/billing/subscriptions/I-PAYPAL-ACTIVE"
            return {
                "id": "I-PAYPAL-ACTIVE",
                "status": "ACTIVE",
                "plan_id": "P-ENT-YEAR",
                "custom_id": json.dumps({"firebase_uid": "alice", "plan_key": "enterprise-year"}),
                "subscriber": {"payer_id": "PAYER-123", "email_address": "alice@example.com"},
                "start_time": "2026-06-01T00:00:00Z",
                "billing_info": {"next_billing_time": "2027-06-01T00:00:00Z"},
            }

        monkeypatch.setattr(service, "_paypal_api_request", fake_paypal_request)

        result = service.confirm_checkout_session(
            AuthenticatedUser(uid="alice", email="alice@example.com"),
            "I-PAYPAL-ACTIVE",
            "paypal",
        )

        assert result["status"] == "active"
        subscription = result["subscription"]
        assert subscription["userId"] == "alice"
        assert subscription["plan"] == "enterprise"
        assert subscription["billingInterval"] == "year"
        assert subscription["provider"] == "paypal"
        assert subscription["providerSubscriptionId"] == "I-PAYPAL-ACTIVE"
        assert subscription["providerCheckoutSessionId"] == "I-PAYPAL-ACTIVE"
        assert subscription["providerCustomerId"] == "PAYER-123"
        assert subscription["manageableActions"]["canCancel"] is True
        session = db.scalar(
            select(BillingCheckoutSession).where(
                BillingCheckoutSession.provider_session_id == "I-PAYPAL-ACTIVE"
            )
        )
        assert session.status == "completed"
        assert session.completed_at is not None


def test_provider_scoped_subscription_and_checkout_ids_can_overlap():
    with SessionLocal() as db:
        service = BillingService(db)
        service._activate_subscription(
            uid="alice",
            plan_key="pro-month",
            provider="stripe",
            provider_checkout_session_id="shared_session",
            provider_subscription_id="shared_subscription",
            provider_customer_id="shared_customer",
            raw_provider_object={"provider": "stripe"},
        )
        service._activate_subscription(
            uid="bob",
            plan_key="enterprise-year",
            provider="paypal",
            provider_checkout_session_id="shared_session",
            provider_subscription_id="shared_subscription",
            provider_customer_id="shared_customer",
            raw_provider_object={"provider": "paypal"},
        )
        db.commit()

        rows = db.scalars(
            select(BillingSubscription).where(
                BillingSubscription.provider_subscription_id == "shared_subscription"
            )
        ).all()

    assert {(row.provider, row.firebase_uid) for row in rows} == {("stripe", "alice"), ("paypal", "bob")}


def test_provider_scoped_checkout_session_ids_can_overlap():
    with SessionLocal() as db:
        db.add_all(
            [
                BillingCheckoutSession(
                    firebase_uid="alice",
                    plan_key="pro-month",
                    provider="stripe",
                    provider_session_id="shared_checkout",
                    checkout_url="https://stripe.example/checkout",
                ),
                BillingCheckoutSession(
                    firebase_uid="bob",
                    plan_key="pro-month",
                    provider="paypal",
                    provider_session_id="shared_checkout",
                    checkout_url="https://paypal.example/checkout",
                ),
            ]
        )
        db.commit()

        rows = db.scalars(
            select(BillingCheckoutSession).where(
                BillingCheckoutSession.provider_session_id == "shared_checkout"
            )
        ).all()

    assert {row.provider for row in rows} == {"stripe", "paypal"}


def test_checkout_confirmation_uses_provider_scope_for_same_user_collision(client, auth_headers):
    with SessionLocal() as db:
        db.add_all(
            [
                BillingCheckoutSession(
                    firebase_uid="alice",
                    plan_key="pro-month",
                    provider="stripe",
                    provider_session_id="shared_checkout",
                    checkout_url="https://stripe.example/checkout",
                ),
                BillingCheckoutSession(
                    firebase_uid="alice",
                    plan_key="enterprise-month",
                    provider="paypal",
                    provider_session_id="shared_checkout",
                    checkout_url="https://paypal.example/checkout",
                ),
            ]
        )
        db.commit()

    ambiguous = client.post("/v1/billing/checkout-sessions/shared_checkout/confirm", headers=auth_headers)
    assert ambiguous.status_code == 409

    response = client.post(
        "/v1/billing/checkout-sessions/shared_checkout/confirm?provider=stripe",
        headers=auth_headers,
    )

    assert response.status_code == 200
    subscription = response.json()["subscription"]
    assert subscription["userId"] == "alice"
    assert subscription["plan"] == "pro"
    assert subscription["provider"] == "stripe"


def test_customer_provider_id_map_backfills_legacy_stripe_customer_id():
    with SessionLocal() as db:
        customer = BillingCustomer(
            firebase_uid="alice",
            email="old@example.com",
            stripe_customer_id="cus_legacy",
            provider_customer_ids={},
        )
        db.add(customer)
        db.commit()

        refreshed = BillingService(db).ensure_customer(AuthenticatedUser(uid="alice", email="alice@example.com"))
        db.flush()

        assert refreshed.email == "alice@example.com"
        assert refreshed.provider_customer_ids == {"stripe": "cus_legacy"}


def test_customer_and_payment_history_store_normalized_provider_ids(client, auth_headers):
    with SessionLocal() as db:
        customer = BillingCustomer(
            firebase_uid="alice",
            email="alice@example.com",
            provider_customer_ids={"stripe": "cus_shared", "paypal": "payer_shared"},
        )
        db.add(customer)
        db.flush()
        subscription = BillingSubscription(
            firebase_uid="alice",
            plan_key="pro-month",
            plan="pro",
            billing_interval="month",
            status="active",
            payment_method="paypal",
            provider="paypal",
            provider_customer_id="payer_shared",
            provider_subscription_id="sub_paypal",
        )
        db.add(subscription)
        db.flush()
        db.add(
            BillingPayment(
                firebase_uid="alice",
                subscription_id=subscription.id,
                provider="paypal",
                provider_invoice_id="invoice_shared",
                provider_payment_id="capture_shared",
                amount_paid_cents=2999,
                currency="USD",
                status="paid",
            )
        )
        db.commit()

    body = client.get("/v1/billing/me", headers=auth_headers).json()

    assert body["subscription"]["provider"] == "paypal"
    assert body["subscription"]["features"]["maxActiveRooms"] == 5
    assert body["payments"] == [
        {
            "id": body["payments"][0]["id"],
            "userId": "alice",
            "subscriptionId": body["subscription"]["id"],
            "amount": 29.99,
            "currency": "USD",
            "date": body["payments"][0]["date"],
            "status": "paid",
            "paymentMethod": "paypal",
            "provider": "paypal",
            "providerInvoiceId": "invoice_shared",
            "providerPaymentId": "capture_shared",
            "transactionId": "capture_shared",
        }
    ]
