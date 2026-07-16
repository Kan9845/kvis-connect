import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.authorization import ADMIN_SITE_THEME_MANAGE, require_permission
from app.core.database import get_session
from app.models.site_theme import SiteThemeSettings
from app.models.user import User
from app.schemas.site_theme import SiteThemeRead, SiteThemeUpdate, THEME_COLOR_KEYS


router = APIRouter(tags=["site-theme"])
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def _validate_colors(colors: dict[str, str]) -> dict[str, str]:
    if set(colors) != THEME_COLOR_KEYS:
        raise HTTPException(status_code=422, detail="All site theme colors are required")
    if any(not isinstance(value, str) or not HEX_COLOR.fullmatch(value) for value in colors.values()):
        raise HTTPException(status_code=422, detail="Theme colors must be six-digit hex values")
    return {key: value.lower() for key, value in colors.items()}


@router.get("/site-theme", response_model=SiteThemeRead)
def get_site_theme(session: Session = Depends(get_session)):
    settings = session.get(SiteThemeSettings, 1)
    if settings is None:
        return SiteThemeRead(colors={})
    return SiteThemeRead(colors=settings.colors, updated_at=settings.updated_at)


@router.put("/admin/site-theme", response_model=SiteThemeRead)
def update_site_theme(
    body: SiteThemeUpdate,
    admin: User = Depends(require_permission(ADMIN_SITE_THEME_MANAGE)),
    session: Session = Depends(get_session),
):
    settings = session.get(SiteThemeSettings, 1)
    if settings is None:
        settings = SiteThemeSettings(id=1)
    settings.colors = _validate_colors(body.colors)
    settings.updated_at = datetime.utcnow()
    settings.updated_by_user_id = admin.id
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return SiteThemeRead(colors=settings.colors, updated_at=settings.updated_at)


@router.delete("/admin/site-theme", response_model=SiteThemeRead)
def reset_site_theme(
    admin: User = Depends(require_permission(ADMIN_SITE_THEME_MANAGE)),
    session: Session = Depends(get_session),
):
    settings = session.get(SiteThemeSettings, 1)
    if settings is None:
        return SiteThemeRead(colors={})
    settings.colors = {}
    settings.updated_at = datetime.utcnow()
    settings.updated_by_user_id = admin.id
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return SiteThemeRead(colors={}, updated_at=settings.updated_at)
