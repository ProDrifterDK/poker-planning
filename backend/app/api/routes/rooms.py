from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_user, db_session
from app.schemas.billing import AuthenticatedUser
from app.schemas.rooms import (
    RoomCreateRequest,
    RoomCreateResponse,
    RoomJoinRequest,
    RoomLeaveResponse,
    RoomMutationResponse,
)
from app.services.room_service import RoomEntitlementService

router = APIRouter(prefix="/v1/rooms", tags=["rooms"])


@router.post("", response_model=RoomCreateResponse)
def create_room(
    payload: RoomCreateRequest,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return RoomEntitlementService(db).create_room(user, payload)


@router.post("/{room_id}/join", response_model=RoomMutationResponse)
def join_room(
    room_id: str,
    payload: RoomJoinRequest,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return RoomEntitlementService(db).join_room(user, room_id, payload)


@router.post("/{room_id}/leave", response_model=RoomLeaveResponse)
def leave_room(
    room_id: str,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict:
    return RoomEntitlementService(db).leave_room(user, room_id)


@router.post("/{room_id}/close")
def close_room(
    room_id: str,
    user: AuthenticatedUser = Depends(current_user),
    db: Session = Depends(db_session),
) -> dict[str, str]:
    return RoomEntitlementService(db).close_room(user, room_id)
