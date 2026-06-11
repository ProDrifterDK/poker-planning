from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

BillingProvider = Literal["stripe", "paypal"]


class AuthenticatedUser(BaseModel):
    uid: str
    email: str | None = None
    name: str | None = None


class CheckoutSessionCreate(BaseModel):
    planKey: str = Field(..., min_length=1)
    locale: Literal["es", "en"] = "es"
    provider: BillingProvider | None = None


class CheckoutSessionResponse(BaseModel):
    checkoutSessionId: str
    provider: str
    status: str
    checkoutUrl: str


class CheckoutConfirmResponse(BaseModel):
    status: str
    subscription: dict[str, Any]


class CancelSubscriptionRequest(BaseModel):
    reason: str | None = None


class BillingMeResponse(BaseModel):
    user: AuthenticatedUser
    subscription: dict[str, Any]
    payments: list[dict[str, Any]] = Field(default_factory=list)


class WebhookResponse(BaseModel):
    received: bool
    duplicate: bool = False
    ignored: bool = False
