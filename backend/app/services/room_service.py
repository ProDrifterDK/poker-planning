from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.settings import Settings, get_settings
from app.db.models import PlanningRoom, RoomMembership, utcnow
from app.domain.plans import get_plan
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import RoomCreateRequest, RoomJoinRequest
from app.services.billing_service import BillingService

ROOM_ACTIVE = "active"
ROOM_LOCKED = "locked"
ROOM_CLOSED = "closed"
UPGRADE_PATH = "/es/settings/subscription"


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
        except (SQLAlchemyError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "ENTITLEMENT_UNAVAILABLE",
                    "message": "We could not verify your plan right now. Please try again.",
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
                "limit": limit,
                "currentUsage": current_usage,
                "upgradeAvailable": entitlement.upgrade_available,
                "upgradePath": UPGRADE_PATH if entitlement.upgrade_available else None,
            },
        )

    def _serialize(
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

    def create_room(self, user: AuthenticatedUser, payload: RoomCreateRequest) -> dict[str, Any]:
        try:
            entitlement = self.entitlement_for_user(user.uid)
            if entitlement.active_rooms >= entitlement.max_active_rooms:
                raise self._limit_error(
                    code="ROOM_LIMIT_REACHED",
                    message="Active room limit reached",
                    entitlement=entitlement,
                    limit=entitlement.max_active_rooms,
                    current_usage=entitlement.active_rooms,
                )

            room = PlanningRoom(
                owner_uid=user.uid,
                title=payload.title,
                series_key=payload.seriesKey,
                status=ROOM_ACTIVE,
            )
            self.db.add(room)
            self.db.flush()
            room.firebase_path = f"rooms/{room.id}"
            membership = RoomMembership(
                room_id=room.id,
                firebase_uid=user.uid,
                display_name=payload.displayName,
                role="moderator",
                active=True,
            )
            self.db.add(membership)
            self.db.flush()
            self.db.commit()
            entitlement = EntitlementSnapshot(
                user_id=entitlement.user_id,
                plan_key=entitlement.plan_key,
                plan=entitlement.plan,
                features=entitlement.features,
                active_rooms=entitlement.active_rooms + 1,
            )
            return self._serialize(
                room=room,
                membership=membership,
                entitlement=entitlement,
                active_participants=1,
            )
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "ENTITLEMENT_UNAVAILABLE",
                    "message": "We could not verify your plan right now. Please try again.",
                },
            ) from exc

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
                existing.display_name = payload.displayName
                existing.photo_url = payload.photoURL
                existing.active = True
                existing.last_seen_at = utcnow()
                self.db.flush()
                active_participants = self._active_participant_count(room.id)
                self.db.commit()
                return self._serialize(
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
            )
            self.db.add(membership)
            self.db.flush()
            active_participants += 1
            self.db.commit()
            return self._serialize(
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
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "ENTITLEMENT_UNAVAILABLE",
                    "message": "We could not verify room entitlements right now. Please try again.",
                },
            ) from exc

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
            self.db.commit()
            return {"roomId": room_id, "participantId": membership.id, "active": False}
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "ENTITLEMENT_UNAVAILABLE",
                    "message": "We could not update room membership right now. Please try again.",
                },
            ) from exc
