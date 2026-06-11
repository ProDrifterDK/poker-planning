from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RoomCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    seriesKey: str = Field(default="fibonacci", min_length=1, max_length=64)
    displayName: str | None = Field(default=None, max_length=255)


class RoomJoinRequest(BaseModel):
    displayName: str = Field(..., min_length=1, max_length=255)
    photoURL: str | None = None


class RoomLeaveResponse(BaseModel):
    roomId: str
    participantId: str
    active: bool


class EntitlementLimitResponse(BaseModel):
    planKey: str
    plan: str
    limit: int
    currentUsage: int
    upgradeAvailable: bool
    upgradePath: str | None = None


class RoomParticipantResponse(BaseModel):
    participantId: str
    role: Literal["moderator", "participant"]
    displayName: str


class RoomMutationResponse(BaseModel):
    roomId: str
    participantId: str
    ownerUid: str
    status: str
    role: str
    rejoined: bool = False
    limits: dict[str, int]
    usage: dict[str, int]


class RoomCreateResponse(RoomMutationResponse):
    sessionId: str
    firebasePath: str
    title: str
    seriesKey: str
    participant: RoomParticipantResponse
    entitlement: EntitlementLimitResponse
    metadata: dict[str, Any]
