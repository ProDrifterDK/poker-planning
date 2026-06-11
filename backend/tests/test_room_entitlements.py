from __future__ import annotations

from datetime import timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.dialects import postgresql

from app.db.models import BillingSubscription, PlanningRoom, RoomMembership, utcnow
from app.db.session import SessionLocal
from app.services.room_service import room_for_update_statement


def _auth_headers(uid: str, email: str | None = None) -> dict[str, str]:
    return {"Authorization": f"Bearer e2e:test-secret:{uid}:{email or f'{uid}@example.com'}"}


def _seed_subscription(uid: str, plan_key: str) -> None:
    plan_name, interval = {
        "pro-month": ("pro", "month"),
        "enterprise-month": ("enterprise", "month"),
    }[plan_key]
    now = utcnow()
    with SessionLocal() as db:
        db.add(
            BillingSubscription(
                firebase_uid=uid,
                plan_key=plan_key,
                plan=plan_name,
                billing_interval=interval,
                status="active",
                payment_method="stripe",
                provider="stripe",
                provider_subscription_id=f"sub_{uid}_{plan_key}",
                current_period_start=now,
                current_period_end=now + timedelta(days=30),
                is_current=True,
            )
        )
        db.commit()


def _seed_room(room_id: str, owner_uid: str = "owner") -> None:
    with SessionLocal() as db:
        db.add(
            PlanningRoom(
                id=room_id,
                owner_uid=owner_uid,
                title="Planning",
                series_key="fibonacci",
                status="active",
            )
        )
        db.add(
            RoomMembership(
                room_id=room_id,
                firebase_uid=owner_uid,
                display_name="Owner",
                role="moderator",
                active=True,
            )
        )
        db.commit()


def _seed_participants(room_id: str, count: int) -> None:
    with SessionLocal() as db:
        db.add_all(
            RoomMembership(
                room_id=room_id,
                firebase_uid=f"member-{index}",
                display_name=f"Member {index}",
                role="participant",
                active=True,
            )
            for index in range(count)
        )
        db.commit()


def test_create_room_enforces_active_room_limit_from_authoritative_billing(client, auth_headers):
    first = client.post(
        "/v1/rooms",
        json={"title": "Sprint 1", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )
    assert first.status_code == 200
    assert first.json()["limits"] == {"maxActiveRooms": 1, "maxParticipants": 5}

    second = client.post(
        "/v1/rooms",
        json={"title": "Sprint 2", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )

    assert second.status_code == 409
    detail = second.json()["detail"]
    assert detail["code"] == "ROOM_LIMIT_REACHED"
    assert detail["limit"] == 1
    assert detail["currentUsage"] == 1
    assert detail["planKey"] == "free"
    assert detail["upgradeAvailable"] is True


@pytest.mark.parametrize(
    ("plan_key", "limit"),
    [("free", 5), ("pro-month", 15), ("enterprise-month", 100)],
)
def test_join_room_enforces_owner_participant_limit_boundaries(client, plan_key, limit):
    owner_uid = f"owner-{plan_key}"
    room_id = f"room-{plan_key}"
    if plan_key != "free":
        _seed_subscription(owner_uid, plan_key)
    _seed_room(room_id, owner_uid=owner_uid)
    # Owner already consumes one active seat; fill to one below the owner plan limit.
    _seed_participants(room_id, limit - 2)

    allowed = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Allowed"},
        headers=_auth_headers(f"joiner-{plan_key}"),
    )
    assert allowed.status_code == 200
    assert allowed.json()["limits"]["maxParticipants"] == limit
    assert allowed.json()["usage"]["activeParticipants"] == limit

    denied = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Overflow"},
        headers=_auth_headers(f"overflow-{plan_key}"),
    )
    assert denied.status_code == 409
    detail = denied.json()["detail"]
    assert detail["code"] == "PARTICIPANT_LIMIT_REACHED"
    assert detail["limit"] == limit
    assert detail["currentUsage"] == limit
    assert detail["upgradeAvailable"] is (plan_key != "enterprise-month")


def test_join_room_is_idempotent_for_existing_participant_at_limit(client):
    room_id = "room-idempotent"
    _seed_room(room_id, owner_uid="alice")
    _seed_participants(room_id, 4)

    response = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Member 1 Updated"},
        headers=_auth_headers("member-1"),
    )

    assert response.status_code == 200
    assert response.json()["rejoined"] is True
    assert response.json()["usage"]["activeParticipants"] == 5
    with SessionLocal() as db:
        rows = db.scalars(
            select(RoomMembership).where(
                RoomMembership.room_id == room_id,
                RoomMembership.firebase_uid == "member-1",
            )
        ).all()
    assert len(rows) == 1
    assert rows[0].display_name == "Member 1 Updated"


def test_inactive_existing_participant_cannot_rejoin_over_owner_limit(client):
    room_id = "room-inactive-rejoin-full"
    _seed_room(room_id, owner_uid="alice")
    _seed_participants(room_id, 4)
    with SessionLocal() as db:
        db.add(
            RoomMembership(
                room_id=room_id,
                firebase_uid="returning",
                display_name="Returning",
                role="participant",
                active=False,
            )
        )
        db.commit()

    response = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Returning Updated"},
        headers=_auth_headers("returning"),
    )

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "PARTICIPANT_LIMIT_REACHED"
    assert detail["limit"] == 5
    assert detail["currentUsage"] == 5
    with SessionLocal() as db:
        returning = db.scalar(
            select(RoomMembership).where(
                RoomMembership.room_id == room_id,
                RoomMembership.firebase_uid == "returning",
            )
        )
        active_count = sum(
            1
            for membership in db.scalars(
                select(RoomMembership).where(RoomMembership.room_id == room_id)
            )
            if membership.active
        )
    assert returning is not None
    assert returning.active is False
    assert active_count == 5


def test_room_lock_query_uses_for_update_for_concurrent_join_serialization():
    sql = str(room_for_update_statement("room-1").compile(dialect=postgresql.dialect()))

    assert "FOR UPDATE" in sql



def test_leave_room_deactivates_sql_membership_and_closes_empty_room(client, auth_headers):
    created = client.post(
        "/v1/rooms",
        json={"title": "Leave me", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )
    assert created.status_code == 200
    room_id = created.json()["roomId"]
    participant_id = created.json()["participantId"]

    response = client.post(f"/v1/rooms/{room_id}/leave", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"roomId": room_id, "participantId": participant_id, "active": False, "removed": False}
    with SessionLocal() as db:
        room = db.get(PlanningRoom, room_id)
        membership = db.get(RoomMembership, participant_id)
    assert room is not None
    assert room.status == "closed"
    assert room.closed_at is not None
    assert membership is not None
    assert membership.active is False


def test_moderator_remove_participant_deactivates_sql_membership(client, auth_headers):
    created = client.post(
        "/v1/rooms",
        json={"title": "Moderated", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )
    assert created.status_code == 200
    room_id = created.json()["roomId"]
    bob_headers = _auth_headers("bob")
    joined = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Bob"},
        headers=bob_headers,
    )
    assert joined.status_code == 200
    bob_participant_id = joined.json()["participantId"]

    removed = client.post(
        f"/v1/rooms/{room_id}/participants/{bob_participant_id}/remove",
        headers=auth_headers,
    )

    assert removed.status_code == 200
    assert removed.json() == {
        "roomId": room_id,
        "participantId": bob_participant_id,
        "active": False,
        "removed": True,
    }
    with SessionLocal() as db:
        membership = db.get(RoomMembership, bob_participant_id)
        active_count = sum(
            1
            for member in db.scalars(select(RoomMembership).where(RoomMembership.room_id == room_id))
            if member.active
        )
    assert membership is not None
    assert membership.active is False
    assert active_count == 1


def test_non_moderator_cannot_remove_participant(client, auth_headers):
    created = client.post(
        "/v1/rooms",
        json={"title": "Moderated", "seriesKey": "fibonacci", "displayName": "Alice"},
        headers=auth_headers,
    )
    assert created.status_code == 200
    room_id = created.json()["roomId"]
    bob_headers = _auth_headers("bob")
    charlie_headers = _auth_headers("charlie")
    bob = client.post(f"/v1/rooms/{room_id}/join", json={"displayName": "Bob"}, headers=bob_headers)
    assert bob.status_code == 200
    charlie = client.post(
        f"/v1/rooms/{room_id}/join",
        json={"displayName": "Charlie"},
        headers=charlie_headers,
    )
    assert charlie.status_code == 200

    response = client.post(
        f"/v1/rooms/{room_id}/participants/{bob.json()['participantId']}/remove",
        headers=charlie_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == {"code": "ROOM_FORBIDDEN", "message": "Moderator access required"}
    with SessionLocal() as db:
        bob_membership = db.get(RoomMembership, bob.json()["participantId"])
    assert bob_membership is not None
    assert bob_membership.active is True
