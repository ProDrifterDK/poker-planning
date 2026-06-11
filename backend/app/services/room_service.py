from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.core.settings import get_settings
from app.db.models import PlanningRoom, RoomMembership, utcnow
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import RoomCreateRequest
from app.services.auth_service import _firebase_app
from app.services.entitlements import EntitlementService, EntitlementSnapshot, EntitlementUnavailableError

SERIES_VALUES: dict[str, list[int | str]] = {
    "fibonacci": [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
    "tshirt": ["XS", "S", "M", "L", "XL", "XXL", "?", "∞", "☕"],
    "powers2": [1, 2, 4, 8, 16, 32, "?", "∞", "☕"],
    "days": ["1d", "2d", "3d", "5d", "8d", "?", "∞", "☕"],
}


class RoomLimitReachedError(RuntimeError):
    def __init__(self, snapshot: EntitlementSnapshot):
        super().__init__("Room limit reached")
        self.snapshot = snapshot


class RoomAccessDeniedError(RuntimeError):
    pass


@dataclass(frozen=True)
class CreatedRoom:
    room: PlanningRoom
    membership: RoomMembership
    session_id: str
    snapshot: EntitlementSnapshot


class RoomService:
    def __init__(self, db: Session):
        self.db = db
        self.entitlements = EntitlementService(db)
        self.settings = get_settings()

    def _new_token(self, prefix: str) -> str:
        return f"{prefix}_{secrets.token_urlsafe(6).replace('-', '').replace('_', '')[:8]}"

    def _new_room_id(self) -> str:
        for _ in range(8):
            room_id = self._new_token("room")
            if not self.db.get(PlanningRoom, room_id):
                return room_id
        raise RuntimeError("Unable to allocate room id")

    def create_room(self, user: AuthenticatedUser, payload: RoomCreateRequest) -> CreatedRoom:
        snapshot = self.entitlements.snapshot_for_user(user)
        if snapshot.active_rooms >= snapshot.max_active_rooms:
            raise RoomLimitReachedError(snapshot)

        room_id = self._new_room_id()
        session_id = self._new_token("session")
        participant_id = self._new_token("participant")
        series_key = payload.seriesKey if payload.seriesKey in SERIES_VALUES else "fibonacci"
        title = (payload.title or f"Sala {room_id}").strip() or f"Sala {room_id}"
        display_name = (payload.displayName or user.name or "Moderador").strip() or "Moderador"
        now = utcnow()

        room = PlanningRoom(
            id=room_id,
            owner_uid=user.uid,
            title=title,
            series_key=series_key,
            status="active",
            firebase_path=f"rooms/{room_id}",
        )
        membership = RoomMembership(
            room_id=room_id,
            participant_id=participant_id,
            firebase_uid=user.uid,
            display_name=display_name,
            role="moderator",
            active=True,
            last_seen_at=now,
        )
        self.db.add(room)
        self.db.add(membership)
        self.db.flush()

        self._write_firebase_projection(room, membership, session_id, snapshot, now)
        self.db.commit()
        self.db.refresh(room)
        self.db.refresh(membership)

        refreshed_snapshot = EntitlementSnapshot(
            user_id=snapshot.user_id,
            plan_key=snapshot.plan_key,
            plan=snapshot.plan,
            billing_interval=snapshot.billing_interval,
            status=snapshot.status,
            effective_until=snapshot.effective_until,
            features=snapshot.features,
            active_rooms=snapshot.active_rooms + 1,
        )
        return CreatedRoom(room=room, membership=membership, session_id=session_id, snapshot=refreshed_snapshot)

    def close_room(self, room_id: str, owner_uid: str) -> PlanningRoom | None:
        room = self.db.get(PlanningRoom, room_id)
        if not room:
            return None
        if room.owner_uid != owner_uid:
            raise RoomAccessDeniedError("Only the room owner can close this room")
        if room.status != "active":
            return None
        now = utcnow()
        room.status = "closed"
        room.closed_at = now
        self._write_closed_projection(room, now)
        self.db.commit()
        return room

    def _write_closed_projection(self, room: PlanningRoom, now) -> None:
        if self.settings.e2e_test_mode:
            return
        if not self.settings.firebase_database_url:
            raise EntitlementUnavailableError("FIREBASE_DATABASE_URL is required for room projection")

        _firebase_app()
        from firebase_admin import db as realtime_db
        from firebase_admin import firestore

        timestamp_ms = int(now.timestamp() * 1000)
        realtime_db.reference(f"rooms/{room.id}/metadata").update(
            {"active": False, "lastActive": timestamp_ms, "markedForDeletion": True}
        )
        firestore.client().collection("rooms").document(room.id).set(
            {"active": False, "lastActive": timestamp_ms}, merge=True
        )

    def _write_firebase_projection(
        self,
        room: PlanningRoom,
        membership: RoomMembership,
        session_id: str,
        snapshot: EntitlementSnapshot,
        now,
    ) -> None:
        if self.settings.e2e_test_mode:
            return
        if not self.settings.firebase_database_url:
            raise EntitlementUnavailableError("FIREBASE_DATABASE_URL is required for room projection")

        _firebase_app()
        from firebase_admin import db as realtime_db
        from firebase_admin import firestore

        timestamp_ms = int(now.timestamp() * 1000)
        metadata: dict[str, Any] = {
            "createdAt": timestamp_ms,
            "seriesKey": room.series_key,
            "seriesValues": SERIES_VALUES[room.series_key],
            "creatorId": room.owner_uid,
            "creatorPlan": snapshot.plan,
            "planKey": snapshot.plan_key,
            "title": room.title,
        }
        realtime_db.reference(f"rooms/{room.id}/metadata").update(metadata)
        realtime_db.reference(f"rooms/{room.id}/sessions/{session_id}").update(
            {
                "active": True,
                "reveal": False,
                "currentIssueId": None,
                "startedAt": timestamp_ms,
            }
        )
        realtime_db.reference(f"rooms/{room.id}/participants/{membership.participant_id}").update(
            {
                "name": membership.display_name,
                "joinedAt": timestamp_ms,
                "active": True,
                "role": "moderator",
                "participantId": membership.participant_id,
                "firebaseUid": membership.firebase_uid,
            }
        )

        firestore.client().collection("rooms").document(room.id).set(
            {
                "createdAt": timestamp_ms,
                "createdBy": room.owner_uid,
                "creatorId": room.owner_uid,
                "creatorPlan": snapshot.plan,
                "planKey": snapshot.plan_key,
                "title": room.title,
                "active": True,
            }
        )
