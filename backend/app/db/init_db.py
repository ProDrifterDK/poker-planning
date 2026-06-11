from __future__ import annotations

import json
from typing import Iterable

from sqlalchemy import Engine, inspect, text
from sqlalchemy.engine import Connection

from app.db import models  # noqa: F401
from app.db.session import Base, engine


PROVIDER_CHECKOUT_INDEX = "uq_provider_checkout_session"
PROVIDER_SUBSCRIPTION_INDEX = "uq_provider_subscription"
PROVIDER_SUBSCRIPTION_CHECKOUT_INDEX = "uq_provider_subscription_checkout"
PROVIDER_PAYMENT_INDEX = "uq_provider_payment"


def _has_table(conn: Connection, table_name: str) -> bool:
    return inspect(conn).has_table(table_name)


def _columns(conn: Connection, table_name: str) -> set[str]:
    if not _has_table(conn, table_name):
        return set()
    return {column["name"] for column in inspect(conn).get_columns(table_name)}


def _quote_sqlite_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _sqlite_unique_index_columns(conn: Connection, table_name: str) -> list[list[str]]:
    table = _quote_sqlite_identifier(table_name)
    indexes = conn.execute(text(f"PRAGMA index_list({table})")).mappings().all()
    unique_columns: list[list[str]] = []
    for index in indexes:
        if not index.get("unique"):
            continue
        index_name = _quote_sqlite_identifier(str(index["name"]))
        columns = conn.execute(text(f"PRAGMA index_info({index_name})")).mappings().all()
        unique_columns.append([str(column["name"]) for column in sorted(columns, key=lambda row: row["seqno"])])
    return unique_columns


def _sqlite_has_exact_unique_index(conn: Connection, table_name: str, expected_columns: Iterable[str]) -> bool:
    expected = list(expected_columns)
    return any(columns == expected for columns in _sqlite_unique_index_columns(conn, table_name))


def _sqlite_backfill_provider_customer_ids(conn: Connection) -> None:
    if "provider_customer_ids" not in _columns(conn, "billing_customers"):
        return
    rows = conn.execute(
        text(
            """
            SELECT id, stripe_customer_id, provider_customer_ids
            FROM billing_customers
            WHERE stripe_customer_id IS NOT NULL AND stripe_customer_id != ''
            """
        )
    ).mappings()
    for row in rows:
        try:
            provider_ids = json.loads(row["provider_customer_ids"] or "{}")
        except (TypeError, json.JSONDecodeError):
            provider_ids = {}
        if "stripe" in provider_ids:
            continue
        provider_ids["stripe"] = row["stripe_customer_id"]
        conn.execute(
            text("UPDATE billing_customers SET provider_customer_ids = :provider_ids WHERE id = :id"),
            {"provider_ids": json.dumps(provider_ids), "id": row["id"]},
        )


def _sqlite_rebuild_checkout_sessions(conn: Connection) -> None:
    conn.execute(text("ALTER TABLE billing_checkout_sessions RENAME TO billing_checkout_sessions_legacy"))
    conn.execute(
        text(
            """
            CREATE TABLE billing_checkout_sessions (
                id VARCHAR(36) PRIMARY KEY,
                firebase_uid VARCHAR(128) NOT NULL,
                plan_key VARCHAR(64) NOT NULL,
                provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
                provider_session_id VARCHAR(255) NOT NULL,
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
            INSERT INTO billing_checkout_sessions (
                id, firebase_uid, plan_key, provider, provider_session_id,
                checkout_url, status, created_at, completed_at
            )
            SELECT
                id,
                firebase_uid,
                plan_key,
                COALESCE(provider, 'stripe'),
                provider_session_id,
                checkout_url,
                COALESCE(status, 'created'),
                created_at,
                completed_at
            FROM billing_checkout_sessions_legacy
            """
        )
    )
    conn.execute(text("DROP TABLE billing_checkout_sessions_legacy"))
    conn.execute(
        text(
            f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_CHECKOUT_INDEX} "
            "ON billing_checkout_sessions(provider, provider_session_id)"
        )
    )
    conn.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_billing_checkout_sessions_firebase_uid "
            "ON billing_checkout_sessions(firebase_uid)"
        )
    )


def _sqlite_rebuild_subscriptions(conn: Connection) -> None:
    conn.execute(text("ALTER TABLE billing_subscriptions RENAME TO billing_subscriptions_legacy"))
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
                provider_subscription_id VARCHAR(255),
                provider_checkout_session_id VARCHAR(255),
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
            INSERT INTO billing_subscriptions (
                id, firebase_uid, plan_key, plan, billing_interval, status,
                payment_method, provider, provider_customer_id,
                provider_subscription_id, provider_checkout_session_id,
                current_period_start, current_period_end, cancel_at_period_end,
                is_current, raw_provider_object, created_at, updated_at
            )
            SELECT
                id,
                firebase_uid,
                plan_key,
                plan,
                billing_interval,
                status,
                payment_method,
                COALESCE(provider, 'stripe'),
                provider_customer_id,
                provider_subscription_id,
                provider_checkout_session_id,
                current_period_start,
                current_period_end,
                COALESCE(cancel_at_period_end, 0),
                COALESCE(is_current, 1),
                COALESCE(raw_provider_object, '{}'),
                created_at,
                updated_at
            FROM billing_subscriptions_legacy
            """
        )
    )
    conn.execute(text("DROP TABLE billing_subscriptions_legacy"))
    conn.execute(
        text(
            f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_INDEX} "
            "ON billing_subscriptions(provider, provider_subscription_id)"
        )
    )
    conn.execute(
        text(
            f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_CHECKOUT_INDEX} "
            "ON billing_subscriptions(provider, provider_checkout_session_id)"
        )
    )
    conn.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_billing_subscriptions_firebase_uid "
            "ON billing_subscriptions(firebase_uid)"
        )
    )


def _migrate_sqlite(conn: Connection) -> None:
    if _has_table(conn, "billing_customers") and "provider_customer_ids" not in _columns(conn, "billing_customers"):
        conn.execute(text("ALTER TABLE billing_customers ADD COLUMN provider_customer_ids JSON NOT NULL DEFAULT '{}'"))
    _sqlite_backfill_provider_customer_ids(conn)

    if _has_table(conn, "billing_payments") and "provider_payment_id" not in _columns(conn, "billing_payments"):
        conn.execute(text("ALTER TABLE billing_payments ADD COLUMN provider_payment_id VARCHAR(255)"))
    if _has_table(conn, "billing_payments"):
        if not _sqlite_has_exact_unique_index(conn, "billing_payments", ["provider", "provider_payment_id"]):
            conn.execute(
                text(
                    f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_PAYMENT_INDEX} "
                    "ON billing_payments(provider, provider_payment_id)"
                )
            )

    if _has_table(conn, "billing_checkout_sessions") and _sqlite_has_exact_unique_index(
        conn, "billing_checkout_sessions", ["provider_session_id"]
    ):
        _sqlite_rebuild_checkout_sessions(conn)
    elif _has_table(conn, "billing_checkout_sessions") and not _sqlite_has_exact_unique_index(
        conn, "billing_checkout_sessions", ["provider", "provider_session_id"]
    ):
        conn.execute(
            text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_CHECKOUT_INDEX} "
                "ON billing_checkout_sessions(provider, provider_session_id)"
            )
        )

    if _has_table(conn, "billing_subscriptions") and (
        _sqlite_has_exact_unique_index(conn, "billing_subscriptions", ["provider_subscription_id"])
        or _sqlite_has_exact_unique_index(conn, "billing_subscriptions", ["provider_checkout_session_id"])
    ):
        _sqlite_rebuild_subscriptions(conn)
    elif _has_table(conn, "billing_subscriptions"):
        if not _sqlite_has_exact_unique_index(conn, "billing_subscriptions", ["provider", "provider_subscription_id"]):
            conn.execute(
                text(
                    f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_INDEX} "
                    "ON billing_subscriptions(provider, provider_subscription_id)"
                )
            )
        if not _sqlite_has_exact_unique_index(conn, "billing_subscriptions", ["provider", "provider_checkout_session_id"]):
            conn.execute(
                text(
                    f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_CHECKOUT_INDEX} "
                    "ON billing_subscriptions(provider, provider_checkout_session_id)"
                )
            )


def _migrate_postgresql(conn: Connection) -> None:
    if _has_table(conn, "billing_customers"):
        conn.execute(
            text(
                "ALTER TABLE billing_customers "
                "ADD COLUMN IF NOT EXISTS provider_customer_ids JSONB NOT NULL DEFAULT '{}'::jsonb"
            )
        )
        conn.execute(
            text(
                """
                UPDATE billing_customers
                SET provider_customer_ids = COALESCE(provider_customer_ids, '{}'::jsonb)
                    || jsonb_build_object('stripe', stripe_customer_id)
                WHERE stripe_customer_id IS NOT NULL
                  AND stripe_customer_id != ''
                  AND NOT (COALESCE(provider_customer_ids, '{}'::jsonb) ? 'stripe')
                """
            )
        )

    if _has_table(conn, "billing_payments"):
        conn.execute(text("ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(255)"))
        conn.execute(
            text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_PAYMENT_INDEX} "
                "ON billing_payments(provider, provider_payment_id)"
            )
        )

    if _has_table(conn, "billing_checkout_sessions"):
        conn.execute(
            text(
                "ALTER TABLE billing_checkout_sessions "
                "DROP CONSTRAINT IF EXISTS billing_checkout_sessions_provider_session_id_key"
            )
        )
        conn.execute(
            text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_CHECKOUT_INDEX} "
                "ON billing_checkout_sessions(provider, provider_session_id)"
            )
        )

    if _has_table(conn, "billing_subscriptions"):
        conn.execute(
            text(
                "ALTER TABLE billing_subscriptions "
                "DROP CONSTRAINT IF EXISTS billing_subscriptions_provider_subscription_id_key"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE billing_subscriptions "
                "DROP CONSTRAINT IF EXISTS billing_subscriptions_provider_checkout_session_id_key"
            )
        )
        conn.execute(
            text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_INDEX} "
                "ON billing_subscriptions(provider, provider_subscription_id)"
            )
        )
        conn.execute(
            text(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {PROVIDER_SUBSCRIPTION_CHECKOUT_INDEX} "
                "ON billing_subscriptions(provider, provider_checkout_session_id)"
            )
        )


def migrate_existing_schema(target_engine: Engine) -> None:
    """Apply safe, idempotent migrations for deployments without Alembic.

    `Base.metadata.create_all()` only creates missing tables. It does not alter
    existing Railway/Postgres or local SQLite billing tables, so provider-model
    columns and provider-scoped uniqueness must be backfilled explicitly before
    the app starts using the ORM models.
    """
    with target_engine.begin() as conn:
        dialect = conn.dialect.name
        if dialect == "sqlite":
            _migrate_sqlite(conn)
        elif dialect == "postgresql":
            _migrate_postgresql(conn)


def init_db() -> None:
    migrate_existing_schema(engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
