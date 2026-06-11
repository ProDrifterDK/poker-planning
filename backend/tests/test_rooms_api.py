from __future__ import annotations

import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from sqlalchemy import func, select

from app.db.models import BillingSubscription, PlanningRoom, utcnow
from app.db.session import SessionLocal
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import RoomCreateRequest
from app.services.billing_service import BillingService
from app.services.entitlements import EntitlementService
from app.services.room_service import RoomLimitReachedError, RoomService


def _create_subscription(uid: str, plan_key: str, plan: str, *, status: str = "active", days: int = 30) -> None:
    now = utcnow()
    interval = "year" if plan_key.endswith("year") else "month"
    with SessionLocal() as db:
        db.add(
            BillingSubscription(
                firebase_uid=uid,
                plan_key=plan_key,
                plan=plan,
                billing_interval=interval,
                status=status,
                payment_method="stripe",
                provider="stripe",
                provider_subscription_id=f"sub_{uid}_{plan_key}_{status}_{days}",
                current_period_start=now - timedelta(days=1),
                current_period_end=now + timedelta(days=days),
                cancel_at_period_end=status == "cancelled",
                is_current=True,
                raw_provider_object={},
            )
        )
        db.commit()


def _create_active_room(uid: str, room_id: str) -> None:
    with SessionLocal() as db:
        db.add(
            PlanningRoom(
                id=room_id,
                owner_uid=uid,
                title=f"Room {room_id}",
                series_key="fibonacci",
                status="active",
                firebase_path=f"rooms/{room_id}",
            )
        )
        db.commit()


def test_create_room_allowed_for_free_user(client, auth_headers):
    response = client.post(
        "/v1/rooms",
        json={"title": "Sprint 1", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["roomId"].startswith("room_")
    assert body["participantId"].startswith("participant_")
    assert body["sessionId"].startswith("session_")
    assert body["firebasePath"] == f"rooms/{body['roomId']}"
    assert body["title"] == "Sprint 1"
    assert body["participant"]["role"] == "moderator"
    assert body["participant"]["participantId"] == body["participantId"]
    assert body["participant"]["displayName"] == "Alice"
    assert body["limits"] == {
        "planKey": "free",
        "plan": "free",
        "limit": 1,
        "currentUsage": 1,
        "upgradeAvailable": True,
        "upgradePath": "/es/settings/subscription",
    }

    with SessionLocal() as db:
        room = db.get(PlanningRoom, body["roomId"])
        assert room is not None
        assert room.owner_uid == "alice"
        assert room.status == "active"


def test_create_room_limit_reached_for_free_user(client, auth_headers):
    first = client.post("/v1/rooms", json={"title": "One"}, headers=auth_headers)
    assert first.status_code == 200

    second = client.post("/v1/rooms", json={"title": "Two"}, headers=auth_headers)

    assert second.status_code == 409
    detail = second.json()["detail"]
    assert detail["code"] == "ROOM_LIMIT_REACHED"
    assert detail["planKey"] == "free"
    assert detail["limit"] == 1
    assert detail["currentUsage"] == 1
    assert detail["upgradeAvailable"] is True


def test_concurrent_room_creates_are_serialized_at_free_limit(monkeypatch):
    original_active_room_count = EntitlementService.active_room_count
    counter_lock = threading.Lock()
    in_flight_counts = 0
    max_in_flight_counts = 0

    def slow_active_room_count(self: EntitlementService, uid: str) -> int:
        nonlocal in_flight_counts, max_in_flight_counts
        with counter_lock:
            in_flight_counts += 1
            max_in_flight_counts = max(max_in_flight_counts, in_flight_counts)
        try:
            time.sleep(0.03)
            return original_active_room_count(self, uid)
        finally:
            with counter_lock:
                in_flight_counts -= 1

    monkeypatch.setattr(EntitlementService, "active_room_count", slow_active_room_count)
    user = AuthenticatedUser(uid="alice", email="alice@example.com", name="Alice")

    def create(title: str) -> str:
        with SessionLocal() as db:
            try:
                RoomService(db).create_room(user, RoomCreateRequest(title=title))
                return "created"
            except RoomLimitReachedError:
                db.rollback()
                return "limit"

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(create, ["Concurrent A", "Concurrent B"]))

    assert sorted(results) == ["created", "limit"]
    assert max_in_flight_counts == 1
    with SessionLocal() as db:
        active_room_count = db.scalar(
            select(func.count())
            .select_from(PlanningRoom)
            .where(PlanningRoom.owner_uid == "alice", PlanningRoom.status == "active")
        )
        assert active_room_count == 1


def test_closing_backend_room_frees_active_room_slot(client, auth_headers):
    first = client.post("/v1/rooms", json={"title": "One"}, headers=auth_headers)
    assert first.status_code == 200
    room_id = first.json()["roomId"]

    close = client.post(f"/v1/rooms/{room_id}/close", headers=auth_headers)
    assert close.status_code == 200
    assert close.json() == {"roomId": room_id, "status": "closed"}

    second = client.post("/v1/rooms", json={"title": "Two"}, headers=auth_headers)
    assert second.status_code == 200
    assert second.json()["limits"]["currentUsage"] == 1

    with SessionLocal() as db:
        closed = db.get(PlanningRoom, room_id)
        assert closed is not None
        assert closed.status == "closed"
        assert closed.closed_at is not None


def test_non_owner_cannot_close_backend_room(client, auth_headers, other_auth_headers):
    created = client.post("/v1/rooms", json={"title": "Owned by Alice"}, headers=auth_headers)
    assert created.status_code == 200
    room_id = created.json()["roomId"]

    forbidden = client.post(f"/v1/rooms/{room_id}/close", headers=other_auth_headers)

    assert forbidden.status_code == 403
    assert forbidden.json()["detail"] == {
        "code": "ROOM_FORBIDDEN",
        "message": "Only the room owner can close this room",
    }
    with SessionLocal() as db:
        room = db.get(PlanningRoom, room_id)
        assert room is not None
        assert room.status == "active"


def test_create_room_fails_closed_when_entitlements_unavailable(client, auth_headers, monkeypatch):
    def boom(self, uid):
        raise RuntimeError("billing unavailable")

    monkeypatch.setattr(BillingService, "current_subscription", boom)

    response = client.post("/v1/rooms", json={"title": "Nope"}, headers=auth_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == {
        "code": "ENTITLEMENT_UNAVAILABLE",
        "message": "We couldn't verify your plan right now. Please try again.",
    }


def test_downgraded_user_uses_free_active_room_limit(client, auth_headers):
    # Expired paid subscription is not an effective entitlement; the user falls back to Free.
    _create_subscription("alice", "pro-month", "pro", status="active", days=-1)
    _create_active_room("alice", "existing_free_limit_room")

    response = client.post("/v1/rooms", json={"title": "Second"}, headers=auth_headers)

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "ROOM_LIMIT_REACHED"
    assert detail["planKey"] == "free"
    assert detail["limit"] == 1
    assert detail["currentUsage"] == 1


def test_cancelled_subscription_keeps_paid_limit_until_period_end(client, auth_headers):
    _create_subscription("alice", "pro-month", "pro", status="cancelled", days=10)
    for index in range(4):
        _create_active_room("alice", f"existing_pro_room_{index}")

    allowed = client.post("/v1/rooms", json={"title": "Fifth"}, headers=auth_headers)
    assert allowed.status_code == 200
    assert allowed.json()["limits"]["planKey"] == "pro-month"
    assert allowed.json()["limits"]["limit"] == 5
    assert allowed.json()["limits"]["currentUsage"] == 5

    denied = client.post("/v1/rooms", json={"title": "Sixth"}, headers=auth_headers)
    assert denied.status_code == 409
    detail = denied.json()["detail"]
    assert detail["code"] == "ROOM_LIMIT_REACHED"
    assert detail["planKey"] == "pro-month"
    assert detail["limit"] == 5
    assert detail["currentUsage"] == 5
