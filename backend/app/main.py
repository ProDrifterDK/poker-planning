from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.billing import router as billing_router
from app.api.routes.health import router as health_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.webhooks import router as webhooks_router
from app.core.settings import get_settings
from app.db.init_db import init_db


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Poker Planning Billing API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Stripe-Signature",
            "PayPal-Auth-Algo",
            "PayPal-Cert-Url",
            "PayPal-Transmission-Id",
            "PayPal-Transmission-Sig",
            "PayPal-Transmission-Time",
        ],
    )

    @app.on_event("startup")
    def startup() -> None:
        init_db()

    app.include_router(health_router)
    app.include_router(billing_router)
    app.include_router(rooms_router)
    app.include_router(webhooks_router)
    return app


app = create_app()
