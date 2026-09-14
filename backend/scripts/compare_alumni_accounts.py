"""Compare an alumni CSV export with KVIS Connect accounts.

This utility is read-only. It never creates, updates, or deletes accounts.
The source ID is normalized to its final five digits, preserving leading
zeros. The current User model has no student_id column, so exact matching
still uses the normalized full name and reports duplicate names as ambiguous.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

from sqlmodel import Session, select

# Allow `python backend/scripts/compare_alumni_accounts.py` from the repository root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import engine  # noqa: E402
from app.models.user import User  # noqa: E402


def normalize(value: str | None) -> str:
    """Create a stable, case-insensitive key for names from both sources."""
    value = unicodedata.normalize("NFKC", value or "")
    value = " ".join(value.strip().casefold().split())
    return re.sub(r"[^\w\s]", "", value, flags=re.UNICODE)


def last_five_digits(value: str | None) -> str:
    """Return the five-digit student ID used by KVIS Connect."""
    digits = re.sub(r"\D", "", value or "")
    if not digits:
        return ""
    return digits[-5:].zfill(5)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path, help="Alumni CSV export")
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional CSV report path. Defaults to a summary on stdout only.",
    )
    return parser.parse_args()


def load_source(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    required = {"ID", "Name", "Family  Name"}
    missing = required.difference(rows[0].keys() if rows else set())
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    return rows


def main() -> int:
    args = parse_args()
    rows = load_source(args.csv_path)

    with Session(engine) as session:
        users = session.exec(select(User).where(User.is_deleted == False)).all()  # noqa: E712

    by_name: defaultdict[str, list[User]] = defaultdict(list)
    for user in users:
        by_name[normalize(f"{user.first_name} {user.last_name}")].append(user)

    report: list[dict[str, str]] = []
    for row in rows:
        source_name = " ".join(
            part for part in (row.get("Name", ""), row.get("Family  Name", "")) if part
        ).strip()
        matches = by_name.get(normalize(source_name), [])
        if len(matches) == 1:
            user = matches[0]
            status = "account_found"
            account_email = user.email
            account_id = str(user.id)
        elif len(matches) > 1:
            status = "ambiguous_name"
            account_email = ""
            account_id = ""
        else:
            status = "no_account_found"
            account_email = ""
            account_id = ""

            report.append(
            {
                "source_student_id": last_five_digits(row.get("ID", "")),
                "source_name": source_name,
                "status": status,
                "account_email": account_email,
                "account_id": account_id,
            }
        )

    counts = defaultdict(int)
    for item in report:
        counts[item["status"]] += 1

    print(f"Source records: {len(report)}")
    print(f"Active accounts: {len(users)}")
    print(f"Account found: {counts['account_found']}")
    print(f"No account found: {counts['no_account_found']}")
    print(f"Ambiguous name: {counts['ambiguous_name']}")

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=report[0].keys() if report else [])
            if report:
                writer.writeheader()
                writer.writerows(report)
        print(f"Report written to: {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
