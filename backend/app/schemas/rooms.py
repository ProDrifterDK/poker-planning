from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RoomCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=160)
    seriesKey: str = Field(default="fibonacci", min_length=1, max_length=64)
    displayName: str | None = Field(default=None, max_length=120)


class EntitlementLimitResponse(BaseModel):
    planKey: str
    plan: str
    limit: int
    currentUsage: int
    upgradeAvailable: bool
    upgradePath: str


class RoomParticipantResponse(BaseModel):
    participantId: str
    role: Literal["moderator", "participant"]
    displayName: str


class RoomCreateResponse(BaseModel):
    roomId: str
    sessionId: str
    firebasePath: str
    title: str
    seriesKey: str
    participant: RoomParticipantResponse
    limits: EntitlementLimitResponse
    metadata: dict[str, Any]
