from __future__ import annotations

import json

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateTable
from fastapi.testclient import TestClient

import app.db.init_db as init_db_module
from app.db.init_db import migrate_existing_schema
from app.db.models import BillingCustomer
from app.main import create_app


def _seed_legacy_billing_schema(engine) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE billing_customers (
                    id VARCHAR(36) PRIMARY KEY,
                    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
                    email VARCHAR(320),
                    stripe_customer_id VARCHAR(255) UNIQUE,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE billing_checkout_sessions (
                    id VARCHAR(36) PRIMARY KEY,
                    firebase_uid VARCHAR(128) NOT NULL,
                    plan_key VARCHAR(64) NOT NULL,
                    provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
                    provider_session_id VARCHAR(255) NOT NULL UNIQUE,
                    checkout_url TEXT NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'created',
                    created_at DATETIME NOT NULL,
                    completed_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE billing_subscriptions (
                    id VARCHAR(36) PRIMARY KEY,
                    firebase_uid VARCHAR(128) NOT NULL,
                    plan_key VARCHAR(64) NOT NULL,
                    plan VARCHAR(32) NOT NULL,
                    billing_interval VARCHAR(16),
                    status VARCHAR(32) NOT NULL,
                    payment_method VARCHAR(32),
                    provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
                    provider_customer_id VARCHAR(255),
                    provider_subscription_id VARCHAR(255) UNIQUE,
                    provider_checkout_session_id VARCHAR(255) UNIQUE,
                    current_period_start DATETIME,
                    current_period_end DATETIME,
                    cancel_at_period_end BOOLEAN NOT NULL DEFAULT 0,
                    is_current BOOLEAN NOT NULL DEFAULT 1,
                    raw_provider_object JSON NOT NULL DEFAULT '{}',
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE billing_payments (
                    id VARCHAR(36) PRIMARY KEY,
                    firebase_uid VARCHAR(128) NOT NULL,
                    subscription_id VARCHAR(36),
                    provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
                    provider_invoice_id VARCHAR(255),
                    amount_paid_cents INTEGER NOT NULL DEFAULT 0,
                    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
                    status VARCHAR(32) NOT NULL,
                    paid_at DATETIME,
                    raw_provider_object JSON NOT NULL DEFAULT '{}',
                    created_at DATETIME NOT NULL,
                    UNIQUE(provider, provider_invoice_id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO billing_customers (
                    id, firebase_uid, email, stripe_customer_id, created_at, updated_at
                ) VALUES (
                    'cust-1', 'alice', 'alice@example.com', 'cus_legacy',
                    '2026-01-01 00:00:00', '2026-01-01 00:00:00'
                )
                """
            )
        )


def _seed_legacy_room_schema_without_updated_at(engine) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE planning_rooms (
                    id VARCHAR(36) PRIMARY KEY,
                    owner_uid VARCHAR(128) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    series_key VARCHAR(64) NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'active',
                    firebase_path VARCHAR(255),
                    locked_reason VARCHAR(128),
                    created_at DATETIME NOT NULL,
                    closed_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE room_memberships (
                    id VARCHAR(36) PRIMARY KEY,
                    room_id VARCHAR(36) NOT NULL,
                    firebase_uid VARCHAR(128) NOT NULL,
                    display_name VARCHAR(255) NOT NULL,
                    photo_url TEXT,
                    role VARCHAR(32) NOT NULL DEFAULT 'participant',
                    active BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL,
                    last_seen_at DATETIME NOT NULL,
                    UNIQUE(room_id, firebase_uid)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO planning_rooms (
                    id, owner_uid, title, series_key, status, firebase_path, created_at
                ) VALUES (
                    'room-legacy', 'alice', 'Legacy Room', 'fibonacci', 'active',
                    'rooms/room-legacy', '2026-01-01 00:00:00'
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO room_memberships (
                    id, room_id, firebase_uid, display_name, role, active,
                    created_at, last_seen_at
                ) VALUES (
                    'member-legacy', 'room-legacy', 'alice', 'Alice', 'moderator', 1,
                    '2026-01-01 00:00:00', '2026-01-01 00:00:00'
                )
                """
            )
        )


def test_provider_customer_ids_uses_jsonb_for_postgresql_metadata():
    create_sql = str(CreateTable(BillingCustomer.__table__).compile(dialect=postgresql.dialect()))

    assert "provider_customer_ids JSONB" in create_sql


def test_postgresql_migration_casts_provider_customer_ids_to_jsonb_before_backfill(monkeypatch):
    executed: list[str] = []

    class FakeDialect:
        name = "postgresql"

    class FakeConnection:
        dialect = FakeDialect()

        def execute(self, statement, *args, **kwargs):
            executed.append(str(statement))

    monkeypatch.setattr(
        init_db_module,
        "_has_table",
        lambda _conn, table_name: table_name == "billing_customers",
    )

    init_db_module._migrate_postgresql(FakeConnection())

    cast_index = next(
        index
        for index, statement in enumerate(executed)
        if "ALTER COLUMN provider_customer_ids TYPE JSONB" in statement
    )
    backfill_index = next(
        index for index, statement in enumerate(executed) if "jsonb_build_object" in statement
    )

    assert cast_index < backfill_index


def test_existing_legacy_schema_is_migrated_and_backfilled(tmp_path):
    db_url = f"sqlite:///{tmp_path / 'legacy-billing.db'}"
    engine = create_engine(db_url)
    _seed_legacy_billing_schema(engine)

    migrate_existing_schema(engine)

    inspector = inspect(engine)
    customer_columns = {column["name"] for column in inspector.get_columns("billing_customers")}
    payment_columns = {column["name"] for column in inspector.get_columns("billing_payments")}
    assert "provider_customer_ids" in customer_columns
    assert "provider_payment_id" in payment_columns

    with engine.begin() as conn:
        provider_ids = conn.execute(
            text("SELECT provider_customer_ids FROM billing_customers WHERE firebase_uid='alice'")
        ).scalar_one()
        assert json.loads(provider_ids) == {"stripe": "cus_legacy"}

        # Provider namespaces are independent after migration: the old global
        # unique constraints must be gone and provider-scoped uniqueness must
        # allow the same provider-owned ID for Stripe and PayPal.
        conn.execute(
            text(
                """
                INSERT INTO billing_checkout_sessions (
                    id, firebase_uid, plan_key, provider, provider_session_id,
                    checkout_url, status, created_at
                ) VALUES
                    ('cs-stripe', 'alice', 'pro-month', 'stripe', 'shared-session', 'https://stripe', 'created', '2026-01-01 00:00:00'),
                    ('cs-paypal', 'alice', 'enterprise-month', 'paypal', 'shared-session', 'https://paypal', 'created', '2026-01-01 00:00:01')
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO billing_subscriptions (
                    id, firebase_uid, plan_key, plan, billing_interval, status,
                    payment_method, provider, provider_subscription_id,
                    provider_checkout_session_id, cancel_at_period_end,
                    is_current, raw_provider_object, created_at, updated_at
                ) VALUES
                    ('sub-stripe', 'alice', 'pro-month', 'pro', 'month', 'active', 'stripe', 'stripe', 'shared-sub', 'shared-checkout', 0, 1, '{}', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
                    ('sub-paypal', 'bob', 'pro-month', 'pro', 'month', 'active', 'paypal', 'paypal', 'shared-sub', 'shared-checkout', 0, 1, '{}', '2026-01-01 00:00:00', '2026-01-01 00:00:00')
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO billing_payments (
                    id, firebase_uid, provider, provider_payment_id,
                    amount_paid_cents, currency, status, raw_provider_object,
                    created_at
                ) VALUES
                    ('pay-stripe', 'alice', 'stripe', 'shared-payment', 1000, 'USD', 'paid', '{}', '2026-01-01 00:00:00'),
                    ('pay-paypal', 'bob', 'paypal', 'shared-payment', 1000, 'USD', 'paid', '{}', '2026-01-01 00:00:00')
                """
            )
        )


def test_room_ledger_updated_at_columns_are_added_to_legacy_sqlite_schema(tmp_path):
    db_url = f"sqlite:///{tmp_path / 'legacy-rooms.db'}"
    engine = create_engine(db_url)
    _seed_legacy_room_schema_without_updated_at(engine)

    migrate_existing_schema(engine)
    migrate_existing_schema(engine)

    inspector = inspect(engine)
    room_columns = {column["name"] for column in inspector.get_columns("planning_rooms")}
    membership_columns = {column["name"] for column in inspector.get_columns("room_memberships")}
    assert "updated_at" in room_columns
    assert "updated_at" in membership_columns

    with engine.begin() as conn:
        room_updated_at = conn.execute(
            text("SELECT updated_at FROM planning_rooms WHERE id='room-legacy'")
        ).scalar_one()
        membership_updated_at = conn.execute(
            text("SELECT updated_at FROM room_memberships WHERE id='member-legacy'")
        ).scalar_one()
    assert room_updated_at is not None
    assert membership_updated_at is not None


def test_postgresql_migration_adds_room_updated_at_columns(monkeypatch):
    executed: list[str] = []

    class FakeDialect:
        name = "postgresql"

    class FakeConnection:
        dialect = FakeDialect()

        def execute(self, statement, *args, **kwargs):
            executed.append(str(statement))

    monkeypatch.setattr(
        init_db_module,
        "_has_table",
        lambda _conn, table_name: table_name in {"planning_rooms", "room_memberships"},
    )

    init_db_module._migrate_postgresql(FakeConnection())

    assert any('ALTER TABLE "planning_rooms" ADD COLUMN IF NOT EXISTS updated_at' in stmt for stmt in executed)
    assert any('ALTER TABLE "room_memberships" ADD COLUMN IF NOT EXISTS updated_at' in stmt for stmt in executed)
    assert any('ALTER TABLE "planning_rooms" ALTER COLUMN updated_at SET NOT NULL' in stmt for stmt in executed)
    assert any('ALTER TABLE "room_memberships" ALTER COLUMN updated_at SET NOT NULL' in stmt for stmt in executed)


def test_app_startup_migrates_legacy_schema_before_billing_requests(tmp_path, monkeypatch):
    import app.db.init_db as init_db_module
    import app.db.session as session_module

    db_url = f"sqlite:///{tmp_path / 'legacy-app.db'}"
    legacy_engine = create_engine(db_url, connect_args={"check_same_thread": False})
    _seed_legacy_billing_schema(legacy_engine)

    monkeypatch.setattr(init_db_module, "engine", legacy_engine)
    monkeypatch.setattr(
        session_module,
        "SessionLocal",
        sessionmaker(bind=legacy_engine, autoflush=False, autocommit=False),
    )

    auth_headers = {"Authorization": "Bearer e2e:test-secret:alice:alice@example.com"}
    with TestClient(create_app()) as client:
        me = client.get("/v1/billing/me", headers=auth_headers)
        assert me.status_code == 200
        assert me.json()["subscription"]["plan"] == "free"

        checkout = client.post(
            "/v1/billing/checkout-sessions",
            json={"planKey": "pro-month", "locale": "en", "provider": "stripe"},
            headers=auth_headers,
        )
        assert checkout.status_code == 200
        checkout_body = checkout.json()
        assert checkout_body["provider"] == "stripe"
        assert "provider=stripe" in checkout_body["checkoutUrl"]

        confirmed = client.post(
            f"/v1/billing/checkout-sessions/{checkout_body['checkoutSessionId']}/confirm?provider=stripe",
            headers=auth_headers,
        )
        assert confirmed.status_code == 200
        assert confirmed.json()["subscription"]["plan"] == "pro"
