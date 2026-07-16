from datetime import datetime
from typing import Optional

from pydantic import BaseModel


THEME_COLOR_KEYS = frozenset({
    "background", "surface", "foreground", "primary", "accent", "green", "border", "danger",
})


class SiteThemeUpdate(BaseModel):
    colors: dict[str, str]


class SiteThemeRead(BaseModel):
    colors: dict[str, str]
    updated_at: Optional[datetime] = None
