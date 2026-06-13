"""
Backfill field_of_study on education records using a hardcoded mapping.

Usage (from repo root):
    python backend/scripts/backfill_field_of_study.py
"""

import os
import psycopg2

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://kvis:kvis@localhost:5434/kvisconnect",
)

MAJOR_TO_FIELD = {
    "Aerospace Engineering":   "Physical Sciences & Engineering",
    "Agricultural Science":    "Life Sciences & Bioengineering",
    "Architecture":            "Physical Sciences & Engineering",
    "Biochemistry":            "Chemical Sciences & Engineering",
    "Biology":                 "Life Sciences & Bioengineering",
    "Biomedical Engineering":  "Life Sciences & Bioengineering",
    "Business Administration": "Non-STEM / Humanities / Social Sciences",
    "Chemical Engineering":    "Chemical Sciences & Engineering",
    "Chemistry":               "Chemical Sciences & Engineering",
    "Civil Engineering":       "Physical Sciences & Engineering",
    "Computer Science":        "Computer Science & Software Engineering",
    "Data Science":            "Mathematics & Data Science",
    "Dentistry":               "Life Sciences & Bioengineering",
    "Economics":               "Non-STEM / Humanities / Social Sciences",
    "Electrical Engineering":  "Physical Sciences & Engineering",
    "Environmental Science":   "Earth, Space, & Environmental Sciences",
    "Finance":                 "Non-STEM / Humanities / Social Sciences",
    "Industrial Design":       "Physical Sciences & Engineering",
    "Materials Science":       "Physical Sciences & Engineering",
    "Mathematics":             "Mathematics & Data Science",
    "Mechanical Engineering":  "Physical Sciences & Engineering",
    "Medicine":                "Life Sciences & Bioengineering",
    "Microbiology":            "Life Sciences & Bioengineering",
    "Neuroscience":            "Life Sciences & Bioengineering",
    "Pharmacy":                "Life Sciences & Bioengineering",
    "Physics":                 "Physical Sciences & Engineering",
    "Software Engineering":    "Computer Science & Software Engineering",
}


def main() -> None:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    updated = 0
    for major, field in MAJOR_TO_FIELD.items():
        cur.execute(
            """
            UPDATE education
            SET field_of_study = %s
            WHERE (field_of_study IS NULL OR field_of_study = '')
              AND major = %s
            """,
            (field, major),
        )
        updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()
    print(f"Done. Updated {updated} rows.")


if __name__ == "__main__":
    main()
