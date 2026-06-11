from __future__ import annotations

from pydantic import BaseModel, Field


class RoomCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    seriesKey: str = Field(default="fibonacci", min_length=1, max_length=64)
    displayName: str = Field(..., min_length=1, max_length=255)


class RoomJoinRequest(BaseModel):
    displayName: str = Field(..., min_length=1, max_length=255)
    photoURL: str | None = None


class RoomLeaveResponse(BaseModel):
    roomId: str
    participantId: str
    active: bool


class RoomMutationResponse(BaseModel):
    roomId: str
    participantId: str
    ownerUid: str
    status: str
    role: str
    rejoined: bool = False
    limits: dict[str, int]
    usage: dict[str, int]
