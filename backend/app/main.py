import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core import cache
from app.routers import admin, admin_export, auth, users, search, summary, blogs, notification, feedback, site_theme

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="KVIS Connect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)


@app.on_event("startup")
async def on_startup():
    init_db()
    await cache.init_cache()
    app.state.metrics_task = asyncio.create_task(cache.metrics_logger())


@app.on_event("shutdown")
async def on_shutdown():
    task = getattr(app.state, "metrics_task", None)
    if task is not None:
        task.cancel()
    await cache.close_cache()


app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(summary.router, prefix="/api")
app.include_router(blogs.router, prefix="/api")
app.include_router(notification.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(site_theme.router, prefix="/api")
app.include_router(admin_export.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
