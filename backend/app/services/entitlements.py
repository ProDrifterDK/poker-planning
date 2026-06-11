from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import PlanningRoom
from app.domain.plans import get_plan
from app.schemas.billing import AuthenticatedUser
from app.services.billing_service import BillingService


class EntitlementUnavailableError(RuntimeError):
    pass


@dataclass(frozen=True)
class EntitlementSnapshot:
    user_id: str
    plan_key: str
    plan: str
    billing_interval: str | None
    status: str
    effective_until: datetime | None
    features: dict[str, Any]
    active_rooms: int

    @property
    def max_active_rooms(self) -> int:
        return int(self.features.get("maxActiveRooms", 1))

    @property
    def upgrade_available(self) -> bool:
        return self.plan != "enterprise"


class EntitlementService:
    def __init__(self, db: Session):
        self.db = db
        self.billing = BillingService(db)

    def active_room_count(self, uid: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(PlanningRoom)
                .where(PlanningRoom.owner_uid == uid, PlanningRoom.status == "active")
            )
            or 0
        )

    def snapshot_for_user(self, user: AuthenticatedUser) -> EntitlementSnapshot:
        try:
            subscription = self.billing.current_subscription(user.uid)
            if subscription:
                plan = get_plan(subscription.plan_key)
                plan_key = subscription.plan_key
                plan_name = subscription.plan
                billing_interval = subscription.billing_interval
                status = subscription.status
                effective_until = subscription.current_period_end
            else:
                plan = get_plan("free")
                plan_key = "free"
                plan_name = "free"
                billing_interval = None
                status = "active"
                effective_until = None
            return EntitlementSnapshot(
                user_id=user.uid,
                plan_key=plan_key,
                plan=plan_name,
                billing_interval=billing_interval,
                status=status,
                effective_until=effective_until,
                features=dict(plan.features),
                active_rooms=self.active_room_count(user.uid),
            )
        except Exception as exc:  # fail closed on billing/entitlement lookup issues
            raise EntitlementUnavailableError("Unable to verify entitlements") from exc
