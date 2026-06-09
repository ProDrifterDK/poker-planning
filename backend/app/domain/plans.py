from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PlanCode = Literal["free", "pro", "enterprise"]
BillingInterval = Literal["month", "year"]


@dataclass(frozen=True)
class PlanDefinition:
    key: str
    plan: PlanCode
    billing_interval: BillingInterval | None
    price_cents: int
    currency: str
    features: dict[str, bool | int]


FREE_FEATURES = {
    "maxParticipants": 5,
    "maxActiveRooms": 1,
    "exportData": False,
    "advancedStats": False,
    "timer": True,
    "fullHistory": False,
    "integrations": False,
    "branding": False,
    "advancedRoles": False,
    "prioritySupport": False,
    "api": False,
    "adFree": False,
}

PRO_FEATURES = {
    **FREE_FEATURES,
    "maxParticipants": 15,
    "maxActiveRooms": 5,
    "exportData": True,
    "advancedStats": True,
    "fullHistory": True,
    "adFree": True,
}

ENTERPRISE_FEATURES = {
    **PRO_FEATURES,
    "maxParticipants": 100,
    "maxActiveRooms": 20,
    "integrations": True,
    "branding": True,
    "advancedRoles": True,
    "prioritySupport": True,
    "api": True,
}

PLAN_CATALOG: dict[str, PlanDefinition] = {
    "free": PlanDefinition("free", "free", None, 0, "USD", FREE_FEATURES),
    "pro-month": PlanDefinition("pro-month", "pro", "month", 999, "USD", PRO_FEATURES),
    "pro-year": PlanDefinition("pro-year", "pro", "year", 9999, "USD", PRO_FEATURES),
    "enterprise-month": PlanDefinition(
        "enterprise-month", "enterprise", "month", 2999, "USD", ENTERPRISE_FEATURES
    ),
    "enterprise-year": PlanDefinition(
        "enterprise-year", "enterprise", "year", 29999, "USD", ENTERPRISE_FEATURES
    ),
}


def get_plan(plan_key: str) -> PlanDefinition:
    try:
        return PLAN_CATALOG[plan_key]
    except KeyError as exc:
        raise ValueError(f"Unsupported planKey: {plan_key}") from exc


def serialize_plan(plan: PlanDefinition) -> dict:
    return {
        "key": plan.key,
        "plan": plan.plan,
        "billingInterval": plan.billing_interval,
        "priceCents": plan.price_cents,
        "currency": plan.currency,
        "features": plan.features,
    }
