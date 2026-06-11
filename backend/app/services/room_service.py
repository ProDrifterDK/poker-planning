from __future__ import annotations

import hashlib
import secrets
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.settings import Settings, get_settings
from app.db.models import PlanningRoom, RoomMembership, utcnow
from app.domain.plans import get_plan
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import RoomCreateRequest, RoomJoinRequest
from app.services.auth_service import _firebase_app
from app.services.billing_service import BillingService

ROOM_ACTIVE = "active"
ROOM_LOCKED = "locked"
ROOM_CLOSED = "closed"
UPGRADE_PATH = "/es/settings/subscription"

SERIES_VALUES: dict[str, list[int | str]] = {
    "fibonacci": [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
    "tshirt": ["XS", "S", "M", "L", "XL", "XXL", "?", "∞", "☕"],
    "powers2": [1, 2, 4, 8, 16, 32, "?", "∞", "☕"],
    "days": ["1d", "2d", "3d", "5d", "8d", "?", "∞", "☕"],
}

_LOCAL_QUOTA_LOCKS_GUARD = threading.Lock()
_LOCAL_QUOTA_LOCKS: dict[str, threading.Lock] = {}


def _postgres_advisory_lock_key(uid: str) -> int:
    digest = hashlib.sha256(f"room-quota:{uid}".encode("utf-8")).digest()
    return int.from_bytes(digest[:8], byteorder="big", signed=True)


def _local_quota_lock(uid: str) -> threading.Lock:
    with _LOCAL_QUOTA_LOCKS_GUARD:
        lock = _LOCAL_QUOTA_LOCKS.get(uid)
        if lock is None:
            lock = threading.Lock()
            _LOCAL_QUOTA_LOCKS[uid] = lock
        return lock


@dataclass(frozen=True)
class EntitlementSnapshot:
    user_id: str
    plan_key: str
    plan: str
    features: dict[str, Any]
    active_rooms: int = 0

    @property
    def max_active_rooms(self) -> int:
        return int(self.features["maxActiveRooms"])

    @property
    def max_participants(self) -> int:
        return int(self.features["maxParticipants"])

    @property
    def upgrade_available(self) -> bool:
        return self.plan != "enterprise"


def room_for_update_statement(room_id: str) -> Select[tuple[PlanningRoom]]:
    return select(PlanningRoom).where(PlanningRoom.id == room_id).with_for_update()


class RoomEntitlementService:
    def __init__(self, db: Session, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()

    @contextmanager
    def _user_quota_lock(self, uid: str) -> Iterator[None]:
        """Serialize active-room quota check+insert for one room owner."""
        bind = self.db.get_bind()
        if bind.dialect.name == "postgresql":
            self.db.execute(text("SELECT pg_advisory_xact_lock(:lock_key)"), {"lock_key": _postgres_advisory_lock_key(uid)})
            yield
            return

        lock = _local_quota_lock(uid)
        lock.acquire()
        try:
            yield
        finally:
            lock.release()

    def _active_room_count(self, owner_uid: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(PlanningRoom)
                .where(PlanningRoom.owner_uid == owner_uid, PlanningRoom.status == ROOM_ACTIVE)
            )
            or 0
        )

    def _active_participant_count(self, room_id: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(RoomMembership)
                .where(RoomMembership.room_id == room_id, RoomMembership.active.is_(True))
            )
            or 0
        )

    def entitlement_for_user(self, uid: str) -> EntitlementSnapshot:
        try:
            subscription = BillingService(self.db, self.settings).current_subscription(uid)
            plan_key = subscription.plan_key if subscription else "free"
            plan = get_plan(plan_key)
            return EntitlementSnapshot(
                user_id=uid,
                plan_key=plan.key,
                plan=plan.plan,
                features=plan.features,
                active_rooms=self._active_room_count(uid),
            )
        except HTTPException:
            raise
        except (SQLAlchemyError, RuntimeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "ENTITLEMENT_UNAVAILABLE",
                    "message": "We couldn't verify your plan right now. Please try again.",
                },
            ) from exc

    def _limit_error(
        self,
        *,
        code: str,
        message: str,
        entitlement: EntitlementSnapshot,
        limit: int,
        current_usage: int,
    ) -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": code,
                "message": message,
                "planKey": entitlement.plan_key,
                "plan": entitlement.plan,
                "limit": limit,
                "currentUsage": current_usage,
                "upgradeAvailable": entitlement.upgrade_available,
                "upgradePath": UPGRADE_PATH if entitlement.upgrade_available else None,
            },
        )

    def _projection_error(self, message: str) -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "ENTITLEMENT_UNAVAILABLE", "message": message},
        )

    def _new_session_id(self) -> str:
        return f"session_{secrets.token_urlsafe(6).replace('-', '').replace('_', '')[:8]}"

    def _serialize_mutation(
        self,
        *,
        room: PlanningRoom,
        membership: RoomMembership,
        entitlement: EntitlementSnapshot,
        active_participants: int,
        rejoined: bool = False,
    ) -> dict[str, Any]:
        return {
            "roomId": room.id,
            "participantId": membership.id,
            "ownerUid": room.owner_uid,
            "status": room.status,
            "role": membership.role,
            "rejoined": rejoined,
            "limits": {
                "maxActiveRooms": entitlement.max_active_rooms,
                "maxParticipants": entitlement.max_participants,
            },
            "usage": {
                "activeRooms": entitlement.active_rooms,
                "activeParticipants": active_participants,
            },
        }

    def _serialize_create(
        self,
        *,
        room: PlanningRoom,
        membership: RoomMembership,
        entitlement: EntitlementSnapshot,
        session_id: str,
    ) -> dict[str, Any]:
        data = self._serialize_mutation(
            room=room,
            membership=membership,
            entitlement=entitlement,
            active_participants=1,
        )
        data.update(
            {
                "sessionId": session_id,
                "firebasePath": room.firebase_path or f"rooms/{room.id}",
                "title": room.title,
                "seriesKey": room.series_key,
                "participant": {
                    "participantId": membership.id,
                    "role": membership.role,
                    "displayName": membership.display_name,
                },
                "entitlement": {
                    "planKey": entitlement.plan_key,
                    "plan": entitlement.plan,
                    "limit": entitlement.max_active_rooms,
                    "currentUsage": entitlement.active_rooms,
                    "upgradeAvailable": entitlement.upgrade_available,
                    "upgradePath": UPGRADE_PATH if entitlement.upgrade_available else None,
                },
                "metadata": {
                    "creatorId": room.owner_uid,
                    "creatorPlan": entitlement.plan,
                    "planKey": entitlement.plan_key,
                },
            }
        )
        return data

    def create_room(self, user: AuthenticatedUser, payload: RoomCreateRequest) -> dict[str, Any]:
        try:
            with self._user_quota_lock(user.uid):
                entitlement = self.entitlement_for_user(user.uid)
                if entitlement.active_rooms >= entitlement.max_active_rooms:
                    raise self._limit_error(
                        code="ROOM_LIMIT_REACHED",
                        message="Active room limit reached",
                        entitlement=entitlement,
                        limit=entitlement.max_active_rooms,
                        current_usage=entitlement.active_rooms,
                    )

                series_key = payload.seriesKey if payload.seriesKey in SERIES_VALUES else "fibonacci"
                display_name = (payload.displayName or user.name or "Moderador").strip() or "Moderador"
                room = PlanningRoom(
                    owner_uid=user.uid,
                    title=(payload.title or "Sala").strip() or "Sala",
                    series_key=series_key,
                    status=ROOM_ACTIVE,
                )
                self.db.add(room)
                self.db.flush()
                room.firebase_path = f"rooms/{room.id}"
                membership = RoomMembership(
                    room_id=room.id,
                    firebase_uid=user.uid,
                    display_name=display_name,
                    role="moderator",
                    active=True,
                    last_seen_at=utcnow(),
                )
                self.db.add(membership)
                self.db.flush()
                session_id = self._new_session_id()
                entitlement_after_create = EntitlementSnapshot(
                    user_id=entitlement.user_id,
                    plan_key=entitlement.plan_key,
                    plan=entitlement.plan,
                    features=entitlement.features,
                    active_rooms=entitlement.active_rooms + 1,
                )
                self._write_room_projection(room, membership, session_id, entitlement_after_create)
                self.db.commit()
                return self._serialize_create(
                    room=room,
                    membership=membership,
                    entitlement=entitlement_after_create,
                    session_id=session_id,
                )
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise self._projection_error("We could not verify your plan right now. Please try again.") from exc

    def join_room(
        self, user: AuthenticatedUser, room_id: str, payload: RoomJoinRequest
    ) -> dict[str, Any]:
        try:
            room = self.db.scalar(room_for_update_statement(room_id))
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")
            if room.status != ROOM_ACTIVE:
                raise HTTPException(
                    status_code=423,
                    detail={
                        "code": "ROOM_LOCKED",
                        "message": "This room is not accepting new participants.",
                        "lockedReason": room.locked_reason,
                    },
                )

            entitlement = self.entitlement_for_user(room.owner_uid)
            existing = self.db.scalar(
                select(RoomMembership).where(
                    RoomMembership.room_id == room.id,
                    RoomMembership.firebase_uid == user.uid,
                )
            )
            if existing:
                active_participants = self._active_participant_count(room.id)
                if not existing.active:
                    if active_participants >= entitlement.max_participants:
                        raise self._limit_error(
                            code="PARTICIPANT_LIMIT_REACHED",
                            message="Room participant limit reached",
                            entitlement=entitlement,
                            limit=entitlement.max_participants,
                            current_usage=active_participants,
                        )
                    active_participants += 1
                existing.display_name = payload.displayName
                existing.photo_url = payload.photoURL
                existing.active = True
                existing.last_seen_at = utcnow()
                self.db.flush()
                self._write_member_projection(room, existing)
                self.db.commit()
                return self._serialize_mutation(
                    room=room,
                    membership=existing,
                    entitlement=entitlement,
                    active_participants=active_participants,
                    rejoined=True,
                )

            active_participants = self._active_participant_count(room.id)
            if active_participants >= entitlement.max_participants:
                raise self._limit_error(
                    code="PARTICIPANT_LIMIT_REACHED",
                    message="Room participant limit reached",
                    entitlement=entitlement,
                    limit=entitlement.max_participants,
                    current_usage=active_participants,
                )

            membership = RoomMembership(
                room_id=room.id,
                firebase_uid=user.uid,
                display_name=payload.displayName,
                photo_url=payload.photoURL,
                role="participant",
                active=True,
                last_seen_at=utcnow(),
            )
            self.db.add(membership)
            self.db.flush()
            active_participants += 1
            self._write_member_projection(room, membership)
            self.db.commit()
            return self._serialize_mutation(
                room=room,
                membership=membership,
                entitlement=entitlement,
                active_participants=active_participants,
            )
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise self._projection_error("We could not verify room entitlements right now. Please try again.") from exc

    def leave_room(self, user: AuthenticatedUser, room_id: str) -> dict[str, Any]:
        try:
            membership = self.db.scalar(
                select(RoomMembership).where(
                    RoomMembership.room_id == room_id,
                    RoomMembership.firebase_uid == user.uid,
                )
            )
            if not membership:
                raise HTTPException(status_code=404, detail="Room membership not found")
            membership.active = False
            membership.last_seen_at = utcnow()
            self.db.flush()
            self._write_member_inactive_projection(room_id, membership)
            self.db.commit()
            return {"roomId": room_id, "participantId": membership.id, "active": False}
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise self._projection_error("We could not update room membership right now. Please try again.") from exc

    def close_room(self, user: AuthenticatedUser, room_id: str) -> dict[str, str]:
        try:
            room = self.db.get(PlanningRoom, room_id)
            if not room or room.status != ROOM_ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"code": "ROOM_NOT_FOUND", "message": "Active room not found"},
                )
            if room.owner_uid != user.uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"code": "ROOM_FORBIDDEN", "message": "Only the room owner can close this room"},
                )
            room.status = ROOM_CLOSED
            room.closed_at = utcnow()
            self.db.flush()
            self._write_closed_projection(room)
            self.db.commit()
            return {"roomId": room.id, "status": room.status}
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise self._projection_error("We could not update the room projection right now. Please try again.") from exc

    def _ensure_projection_available(self) -> None:
        if self.settings.e2e_test_mode:
            return
        if not self.settings.firebase_database_url:
            raise self._projection_error("We could not update the room projection right now. Please try again.")
        _firebase_app()

    def _write_room_projection(
        self,
        room: PlanningRoom,
        membership: RoomMembership,
        session_id: str,
        entitlement: EntitlementSnapshot,
    ) -> None:
        if self.settings.e2e_test_mode:
            return
        self._ensure_projection_available()
        from firebase_admin import db as realtime_db
        from firebase_admin import firestore

        now = utcnow()
        timestamp_ms = int(now.timestamp() * 1000)
        metadata: dict[str, Any] = {
            "createdAt": timestamp_ms,
            "seriesKey": room.series_key,
            "seriesValues": SERIES_VALUES[room.series_key],
            "creatorId": room.owner_uid,
            "creatorPlan": entitlement.plan,
            "planKey": entitlement.plan_key,
            "title": room.title,
            "active": True,
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
        self._write_member_projection(room, membership)
        firestore.client().collection("rooms").document(room.id).set(
            {
                "createdAt": timestamp_ms,
                "createdBy": room.owner_uid,
                "creatorId": room.owner_uid,
                "creatorPlan": entitlement.plan,
                "planKey": entitlement.plan_key,
                "title": room.title,
                "active": True,
            }
        )

    def _write_member_projection(self, room: PlanningRoom, membership: RoomMembership) -> None:
        if self.settings.e2e_test_mode:
            return
        self._ensure_projection_available()
        from firebase_admin import db as realtime_db

        timestamp_ms = int(utcnow().timestamp() * 1000)
        payload: dict[str, Any] = {
            "name": membership.display_name,
            "joinedAt": timestamp_ms,
            "lastActive": timestamp_ms,
            "active": membership.active,
            "role": membership.role,
            "participantId": membership.id,
            "firebaseUid": membership.firebase_uid,
        }
        if membership.photo_url:
            payload["photoURL"] = membership.photo_url
        realtime_db.reference(f"rooms/{room.id}/participants/{membership.id}").update(payload)
        realtime_db.reference(f"rooms/{room.id}/memberUids/{membership.firebase_uid}").set(True)

    def _write_member_inactive_projection(self, room_id: str, membership: RoomMembership) -> None:
        if self.settings.e2e_test_mode:
            return
        self._ensure_projection_available()
        from firebase_admin import db as realtime_db

        realtime_db.reference(f"rooms/{room_id}/participants/{membership.id}").update(
            {"active": False, "lastActive": int(utcnow().timestamp() * 1000), "estimation": None}
        )

    def _write_closed_projection(self, room: PlanningRoom) -> None:
        if self.settings.e2e_test_mode:
            return
        self._ensure_projection_available()
        from firebase_admin import db as realtime_db
        from firebase_admin import firestore

        timestamp_ms = int(utcnow().timestamp() * 1000)
        realtime_db.reference(f"rooms/{room.id}/metadata").update(
            {"active": False, "lastActive": timestamp_ms, "markedForDeletion": True}
        )
        firestore.client().collection("rooms").document(room.id).set(
            {"active": False, "lastActive": timestamp_ms}, merge=True
        )
