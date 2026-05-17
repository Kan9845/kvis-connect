from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from collections import Counter

from app.core.cache import cached
from app.core.config import settings
from app.core.database import get_session
from app.models.user import User, Education, Career

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("")
@cached(key="summary", tags=["users"], ttl=settings.CACHE_TTL_LONG)
def get_summary(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    total = len(users)

    kvis_year_counts: Counter = Counter()
    country_counts: Counter = Counter()
    job_field_counts: Counter = Counter()
    degree_counts: Counter = Counter()
    mbti_counts: Counter = Counter()

    for user in users:
        if user.kvis_year:
            kvis_year_counts[str(user.kvis_year)] += 1
        if user.country:
            country_counts[user.country] += 1
        if user.mbti:
            mbti_counts[user.mbti] += 1
        for edu in user.education:
            if edu.degree:
                degree_counts[edu.degree] += 1
        for job in user.career:
            if job.job_field:
                job_field_counts[job.job_field] += 1

    return {
        "total": total,
        "by_kvis_year": dict(sorted(kvis_year_counts.items())),
        "by_country": dict(country_counts.most_common(20)),
        "by_job_field": dict(job_field_counts.most_common()),
        "by_degree": dict(degree_counts.most_common()),
        "by_mbti": dict(mbti_counts.most_common()),
    }
