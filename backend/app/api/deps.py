from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth_service import get_current_user
from app.schemas.billing import AuthenticatedUser


def current_user(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    return user


def db_session(db: Session = Depends(get_db)) -> Session:
    return db
