from __future__ import annotations

import base64
import json
from functools import lru_cache

from fastapi import Header, HTTPException, status

from app.core.settings import get_settings
from app.schemas.billing import AuthenticatedUser


@lru_cache
def _firebase_app():
    settings = get_settings()
    try:
        import firebase_admin
        from firebase_admin import credentials
    except Exception as exc:  # pragma: no cover - import failure is environment-specific
        raise RuntimeError("firebase-admin is required outside E2E test mode") from exc

    if firebase_admin._apps:  # type: ignore[attr-defined]
        return firebase_admin.get_app()

    service_account_raw = settings.firebase_service_account_json
    if not service_account_raw and settings.firebase_service_account_json_b64:
        service_account_raw = base64.b64decode(settings.firebase_service_account_json_b64).decode("utf-8")

    if service_account_raw:
        cred = credentials.Certificate(json.loads(service_account_raw))
        return firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})

    if settings.firebase_project_id:
        return firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})

    raise RuntimeError("Firebase Admin credentials are not configured")


def verify_e2e_token(token: str) -> AuthenticatedUser | None:
    settings = get_settings()
    if not settings.e2e_test_mode or not token.startswith("e2e:"):
        return None
    if not settings.is_local_test:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E2E auth is disabled in this environment")

    parts = token.split(":")
    if settings.e2e_test_secret:
        if len(parts) < 3 or parts[1] != settings.e2e_test_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid E2E token")
        uid = parts[2]
        email = parts[3] if len(parts) > 3 and parts[3] else f"{uid}@e2e.local"
    else:
        _, uid, *rest = parts
        email = rest[0] if rest and rest[0] else f"{uid}@e2e.local"

    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid E2E token")
    return AuthenticatedUser(uid=uid, email=email)


def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    e2e_user = verify_e2e_token(token)
    if e2e_user:
        return e2e_user

    try:
        _firebase_app()
        from firebase_admin import auth

        decoded = auth.verify_id_token(token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
        ) from exc

    uid = decoded.get("uid") or decoded.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has no uid")

    return AuthenticatedUser(uid=uid, email=decoded.get("email"), name=decoded.get("name"))
