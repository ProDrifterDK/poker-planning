import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("BILLING_PROVIDER", "fake")
os.environ.setdefault("E2E_TEST_MODE", "true")
os.environ.setdefault("E2E_TEST_SECRET", "test-secret")
os.environ.setdefault("FRONTEND_BASE_URL", "http://localhost:3000")
os.environ.setdefault("FRONTEND_ORIGINS", "http://localhost:3000")

import pytest
from fastapi.testclient import TestClient

from app.core.settings import get_settings
from app.db import models  # noqa: F401
from app.db.session import Base, engine
from app.main import create_app


@pytest.fixture(autouse=True)
def reset_db():
    get_settings.cache_clear()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(create_app())


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer e2e:test-secret:alice:alice@example.com"}


@pytest.fixture
def other_auth_headers():
    return {"Authorization": "Bearer e2e:test-secret:bob:bob@example.com"}
