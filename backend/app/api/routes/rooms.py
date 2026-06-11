from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import current_user, db_session
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import RoomCreateRequest, RoomCreateResponse
from app.services.entitlements import EntitlementUnavailableError
from app.services.room_service import RoomAccessDeniedError, RoomLimitReachedError, RoomService

router = APIRouter(prefix="/v1/rooms", tags=["rooms"])


def _upgrade_path() -> str:
    return "/es/settings/subscription"


def _limit_payload(code: str, message: str, *, plan_key: str, plan: str, limit: int, current_usage: int) -> dict:
    return {
        "code": code,
        "message": message,
        "planKey": plan_key,
        "plan": plan,
        "limit": limit,
        "currentUsage": current_usage,
        "upgradeAvailable": plan != "enterprise",
        "upgradePath": _upgrade_path(),
    }


@router.post("", response_model=RoomCreateResponse)
def create_room(
    payload: RoomCreateRequest,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    service = RoomService(db)
    try:
        created = service.create_room(user, payload)
    except RoomLimitReachedError as exc:
        snapshot = exc.snapshot
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_limit_payload(
                "ROOM_LIMIT_REACHED",
                "Active room limit reached",
                plan_key=snapshot.plan_key,
                plan=snapshot.plan,
                limit=snapshot.max_active_rooms,
                current_usage=snapshot.active_rooms,
            ),
        ) from exc
    except EntitlementUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "ENTITLEMENT_UNAVAILABLE",
                "message": "We couldn't verify your plan right now. Please try again.",
            },
        ) from exc

    snapshot = created.snapshot
    return {
        "roomId": created.room.id,
        "sessionId": created.session_id,
        "firebasePath": created.room.firebase_path,
        "title": created.room.title,
        "seriesKey": created.room.series_key,
        "participant": {
            "participantId": created.membership.participant_id,
            "role": "moderator",
            "displayName": created.membership.display_name,
        },
        "limits": {
            "planKey": snapshot.plan_key,
            "plan": snapshot.plan,
            "limit": snapshot.max_active_rooms,
            "currentUsage": snapshot.active_rooms,
            "upgradeAvailable": snapshot.upgrade_available,
            "upgradePath": _upgrade_path(),
        },
        "metadata": {
            "creatorId": created.room.owner_uid,
            "creatorPlan": snapshot.plan,
            "planKey": snapshot.plan_key,
        },
    }


@router.post("/{room_id}/close")
def close_room(
    room_id: str,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict[str, str]:
    service = RoomService(db)
    try:
        room = service.close_room(room_id, user.uid)
    except RoomAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ROOM_FORBIDDEN", "message": "Only the room owner can close this room"},
        ) from exc
    except EntitlementUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "ENTITLEMENT_UNAVAILABLE",
                "message": "We couldn't update the room projection right now. Please try again.",
            },
        ) from exc
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROOM_NOT_FOUND", "message": "Active room not found"},
        )
    return {"roomId": room.id, "status": room.status}
