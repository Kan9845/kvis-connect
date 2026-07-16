import csv
import json
import math
from collections import defaultdict
from datetime import date, datetime
from io import StringIO
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.authorization import ADMIN_DATA_EXPORT_DOWNLOAD, require_permission
from app.core.database import get_session
from app.models.admin_export import AdminDataExportAudit
from app.models.user import Career, Education, User
from app.schemas.admin_export import AdminExportField, AdminExportPreview, AdminExportRequest


router = APIRouter(prefix="/admin/data-export", tags=["admin-data-export"])


EXPORT_FIELDS: dict[str, dict[str, Any]] = {
    "id": {"label": "User ID", "description": "Stable internal UUID", "category": "Identity", "default": True},
    "slug": {"label": "Profile slug", "description": "Public profile identifier", "category": "Identity", "default": True},
    "first_name": {"label": "First name", "description": "Account first name", "category": "Identity", "default": True},
    "last_name": {"label": "Last name", "description": "Account last name", "category": "Identity", "default": True},
    "nickname": {"label": "Nickname", "description": "Optional nickname", "category": "Identity"},
    "nickname_public": {"label": "Nickname public", "description": "Nickname visibility flag", "category": "Identity"},
    "email": {"label": "Login email", "description": "Primary account email", "category": "Contact", "default": True},
    "kvis_email": {"label": "KVIS email", "description": "Institutional KVIS email address", "category": "Contact"},
    "personal_email": {"label": "Personal email", "description": "Verified secondary email", "category": "Contact"},
    "contact_email": {"label": "Contact email", "description": "Profile contact email", "category": "Contact"},
    "contact_email_public": {"label": "Contact email public", "description": "Contact visibility flag", "category": "Contact"},
    "kvis_year": {"label": "KVIS year", "description": "Recorded alumni cohort", "category": "KVIS", "default": True},
    "current_grade": {"label": "Current grade", "description": "Grade 10, 11, or 12", "category": "KVIS", "default": True},
    "expected_grad_year": {"label": "Expected graduation", "description": "Expected graduation year", "category": "KVIS"},
    "current_status": {"label": "Current status", "description": "Self-reported member status", "category": "KVIS", "default": True},
    "teach_start_year": {"label": "Teaching start", "description": "Faculty start year", "category": "KVIS"},
    "teach_end_year": {"label": "Teaching end", "description": "Faculty end year", "category": "KVIS"},
    "is_current_teacher": {"label": "Current teacher", "description": "Current faculty flag", "category": "KVIS"},
    "teach_department": {"label": "Department", "description": "Faculty department", "category": "KVIS"},
    "place": {"label": "Current place", "description": "Current institution or employer", "category": "Location"},
    "place_level2": {"label": "Place detail", "description": "Secondary place label", "category": "Location"},
    "latitude": {"label": "Latitude", "description": "Profile map latitude", "category": "Location"},
    "longitude": {"label": "Longitude", "description": "Profile map longitude", "category": "Location"},
    "country": {"label": "Country", "description": "Current country", "category": "Location"},
    "province_of_origin": {"label": "Province of origin", "description": "Recorded home province", "category": "Location"},
    "profile_pic_url": {"label": "Profile picture URL", "description": "Profile image location", "category": "Profile"},
    "goose_config": {"label": "Goose configuration", "description": "Structured profile mascot settings", "category": "Profile"},
    "bio": {"label": "Biography", "description": "Profile biography", "category": "Profile"},
    "mbti": {"label": "MBTI", "description": "Self-reported personality type", "category": "Profile"},
    "zodiac": {"label": "Zodiac", "description": "Self-reported zodiac", "category": "Profile"},
    "chronotype": {"label": "Chronotype", "description": "Self-reported chronotype", "category": "Profile"},
    "interests": {"label": "Interests", "description": "Profile interests", "category": "Profile"},
    "interests_public": {"label": "Interests public", "description": "Interests visibility flag", "category": "Profile"},
    "research_keywords": {"label": "Research keywords", "description": "Research topic keywords", "category": "Profile"},
    "hobbies": {"label": "Hobbies JSON", "description": "Structured hobbies data", "category": "Profile"},
    "kvis_fav_menu": {"label": "Favorite menu", "description": "KVIS favorite food/menu", "category": "Profile"},
    "kvis_fav_event": {"label": "Favorite event", "description": "KVIS favorite event", "category": "Profile"},
    "kvis_fav_area": {"label": "Favorite area", "description": "KVIS favorite place", "category": "Profile"},
    "activities": {"label": "Activities JSON", "description": "Structured activity records", "category": "Profile"},
    "competitions": {"label": "Competitions JSON", "description": "Structured competition records", "category": "Profile"},
    "experience_camps": {"label": "Experience camps JSON", "description": "Structured camp records", "category": "Profile"},
    "clubs": {"label": "Clubs JSON", "description": "Structured club records", "category": "Profile"},
    "education_json": {"label": "Education JSON", "description": "All education rows as JSON", "category": "Related records"},
    "career_json": {"label": "Career JSON", "description": "All career rows as JSON", "category": "Related records"},
    "email_verified": {"label": "Email verified", "description": "Email verification state", "category": "Maintenance"},
    "is_verified": {"label": "KVIS verified", "description": "Institution verification state", "category": "Maintenance"},
    "profile_setup_done": {"label": "Profile complete", "description": "Onboarding completion state", "category": "Maintenance"},
    "is_deleted": {"label": "Deleted", "description": "Soft-deletion state", "category": "Maintenance"},
    "is_deleted_at": {"label": "Deleted at", "description": "Soft-deletion timestamp", "category": "Maintenance"},
    "created_at": {"label": "Created at", "description": "Account creation timestamp", "category": "Maintenance"},
    "updated_at": {"label": "Updated at", "description": "Last account update timestamp", "category": "Maintenance"},
}

RELATION_FIELDS = {"education_json", "career_json"}

# Every User column must be explicitly exportable, non-exportable, or forbidden.
# The exact-partition regression test fails when a new column is unclassified.
NON_EXPORTABLE_USER_FIELDS: frozenset[str] = frozenset()
FORBIDDEN_USER_EXPORT_FIELDS = frozenset({"hashed_password", "google_id"})


def _validate_fields(fields: list[str]) -> list[str]:
    selected = list(dict.fromkeys(fields))
    unknown = [field for field in selected if field not in EXPORT_FIELDS]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unsupported export fields: {', '.join(unknown)}")
    return selected


def _serialize(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=True, separators=(",", ":"))
    return str(value)


def _masked(value: str, field: str) -> str:
    if not value:
        return ""
    if "email" in field and "@" in value:
        _, domain = value.split("@", 1)
        return f"***@{domain}"
    if field == "id":
        return f"{value[:8]}..."
    if field in {"kvis_year", "current_grade", "expected_grad_year", "email_verified", "is_verified", "profile_setup_done", "is_deleted", "created_at", "updated_at"}:
        return value
    return f"{value[:1]}***"


def _safe_csv_cell(value: str) -> str:
    # Prevent spreadsheet programs from interpreting user-controlled text as formulas.
    if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{value}"
    return value


def _csv_content(fields: list[str], rows: list[list[str]]) -> str:
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(fields)
    writer.writerows([[_safe_csv_cell(value) for value in row] for row in rows])
    return output.getvalue()


def _estimated_csv_size(fields: list[str], sampled_rows: list[list[str]], total_rows: int) -> int:
    header_bytes = len(_csv_content(fields, []).encode("utf-8"))
    if not sampled_rows or total_rows == 0:
        return header_bytes
    sample_bytes = len(_csv_content(fields, sampled_rows).encode("utf-8")) - header_bytes
    average_row_bytes = sample_bytes / len(sampled_rows)
    return header_bytes + math.ceil(average_row_bytes * total_rows)


def _education_record(item: Education) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "uni_name": item.uni_name,
        "degree": item.degree,
        "field_of_study": item.field_of_study,
        "major": item.major,
        "country": item.country,
        "state": item.state,
        "city": item.city,
        "scholarship": item.scholarship,
        "start_year": item.start_year,
        "end_year": item.end_year,
        "is_current": item.is_current,
        "is_public": item.is_public,
        "major2": item.major2,
        "minor1": item.minor1,
        "minors": item.minors,
        "scholarship_type": item.scholarship_type,
        "scholarship_bond": item.scholarship_bond,
        "med_school": item.med_school,
        "med_dual_degree": item.med_dual_degree,
        "med_dual_type": item.med_dual_type,
        "med_dual_field": item.med_dual_field,
        "med_hospital": item.med_hospital,
        "med_specialties": item.med_specialties,
        "med_subspecialty": item.med_subspecialty,
    }


def _career_record(item: Career) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "job_title": item.job_title,
        "employer": item.employer,
        "job_field": item.job_field,
        "country": item.country,
        "state": item.state,
        "city": item.city,
        "is_current": item.is_current,
        "start_year": item.start_year,
        "end_year": item.end_year,
        "is_public": item.is_public,
        "company_type": item.company_type,
        "industry_sector": item.industry_sector,
        "role_type": item.role_type,
    }


def _export_rows(session: Session, fields: list[str], include_deleted: bool, limit: int | None = None) -> tuple[list[list[str]], int]:
    total_statement = select(func.count()).select_from(User)
    users_statement = select(User)
    if not include_deleted:
        total_statement = total_statement.where(User.is_deleted == False)
        users_statement = users_statement.where(User.is_deleted == False)
    total = int(session.exec(total_statement).one())
    users_statement = users_statement.order_by(User.created_at.desc())
    if limit is not None:
        users_statement = users_statement.limit(limit)
    users = session.exec(users_statement).all()

    education_by_user: dict[UUID, list[dict[str, Any]]] = defaultdict(list)
    career_by_user: dict[UUID, list[dict[str, Any]]] = defaultdict(list)
    user_ids = [user.id for user in users]
    if user_ids and "education_json" in fields:
        for item in session.exec(select(Education).where(Education.user_id.in_(user_ids)).order_by(Education.start_year)).all():
            education_by_user[item.user_id].append(_education_record(item))
    if user_ids and "career_json" in fields:
        for item in session.exec(select(Career).where(Career.user_id.in_(user_ids)).order_by(Career.start_year)).all():
            career_by_user[item.user_id].append(_career_record(item))

    rows: list[list[str]] = []
    for user in users:
        values = []
        for field in fields:
            if field == "education_json":
                value = education_by_user[user.id]
            elif field == "career_json":
                value = career_by_user[user.id]
            else:
                value = getattr(user, field)
            values.append(_serialize(value))
        rows.append(values)
    return rows, total


@router.get("/fields", response_model=list[AdminExportField])
def list_export_fields(_admin: User = Depends(require_permission(ADMIN_DATA_EXPORT_DOWNLOAD))):
    return [
        AdminExportField(
            key=key,
            label=metadata["label"],
            description=metadata["description"],
            category=metadata["category"],
            sensitive=True,
            default_selected=metadata.get("default", False),
        )
        for key, metadata in EXPORT_FIELDS.items()
    ]


@router.post("/preview", response_model=AdminExportPreview)
def preview_export(
    request: AdminExportRequest,
    _admin: User = Depends(require_permission(ADMIN_DATA_EXPORT_DOWNLOAD)),
    session: Session = Depends(get_session),
):
    fields = _validate_fields(request.fields)
    sampled_rows, total = _export_rows(session, fields, request.include_deleted, limit=25)
    return AdminExportPreview(
        columns=fields,
        rows=[[_masked(value, field) for field, value in zip(fields, row)] for row in sampled_rows[:5]],
        total_rows=total,
        estimated_size_bytes=_estimated_csv_size(fields, sampled_rows, total),
    )


@router.post("/download")
def download_export(
    request: AdminExportRequest,
    administrator: User = Depends(require_permission(ADMIN_DATA_EXPORT_DOWNLOAD)),
    session: Session = Depends(get_session),
):
    fields = _validate_fields(request.fields)
    if not request.acknowledge_sensitive:
        raise HTTPException(status_code=400, detail="Sensitive-data acknowledgement is required")
    rows, total = _export_rows(session, fields, request.include_deleted)
    csv_content = _csv_content(fields, rows)

    session.add(AdminDataExportAudit(
        administrator_user_id=administrator.id,
        selected_fields=fields,
        include_deleted=request.include_deleted,
        exported_row_count=total,
    ))
    session.commit()

    filename = f"kvis-connect-user-export-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
