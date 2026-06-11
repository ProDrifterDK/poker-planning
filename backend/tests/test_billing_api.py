from __future__ import annotations

import json

import pytest
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
    assert cancel.json()["subscription"]["status"] == "cancelled"
    assert cancel.json()["subscription"]["cancelAtPeriodEnd"] is True


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


def test_checkout_confirmation_uses_owned_provider_scoped_session(client, other_auth_headers):
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
                    plan_key="enterprise-month",
                    provider="paypal",
                    provider_session_id="shared_checkout",
                    checkout_url="https://paypal.example/checkout",
                ),
            ]
        )
        db.commit()

    response = client.post("/v1/billing/checkout-sessions/shared_checkout/confirm", headers=other_auth_headers)

    assert response.status_code == 200
    subscription = response.json()["subscription"]
    assert subscription["userId"] == "bob"
    assert subscription["plan"] == "enterprise"
    assert subscription["provider"] == "paypal"


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
