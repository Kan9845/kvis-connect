-- Read-only aggregate export for the KVIS Connect statistics page.
-- It returns one JSON document and never selects names, emails, IDs, or contact data.
-- Change `minimum_count` only after considering whether small groups should be shown.

WITH config AS (
  SELECT 3::bigint AS minimum_count
),
alumni AS (
  SELECT u.id, u.kvis_year
  FROM "user" AS u
  WHERE u.is_deleted = false
    AND u.current_grade IS NULL
    AND u.teach_start_year IS NULL
    AND COALESCE(u.is_current_teacher, false) = false
),
primary_education AS (
  SELECT DISTINCT ON (e.user_id)
    e.user_id,
    NULLIF(BTRIM(e.country), '') AS country,
    NULLIF(BTRIM(e.uni_name), '') AS university,
    NULLIF(BTRIM(e.field_of_study), '') AS field_of_study
  FROM education AS e
  JOIN alumni AS a ON a.id = e.user_id
  ORDER BY
    e.user_id,
    CASE
      WHEN e.degree ILIKE '%bachelor%'
        OR e.degree ILIKE '%undergrad%'
        OR e.degree ILIKE '%bbs%'
        OR e.degree ILIKE '%bba%'
        OR e.degree ILIKE '%bsc%'
        OR e.degree ILIKE '%beng%'
      THEN 0 ELSE 1
    END,
    COALESCE(e.start_year, 9999),
    e.id
),
primary_career AS (
  SELECT DISTINCT ON (c.user_id)
    c.user_id,
    NULLIF(BTRIM(c.industry_sector), '') AS industry_sector,
    NULLIF(BTRIM(c.role_type), '') AS role_type
  FROM career AS c
  JOIN alumni AS a ON a.id = c.user_id
  ORDER BY c.user_id, CASE WHEN c.is_current THEN 0 ELSE 1 END,
    COALESCE(c.start_year, 0) DESC, c.id
),
cohort_counts AS (
  SELECT a.kvis_year::text AS label, COUNT(*)::bigint AS count
  FROM alumni AS a
  WHERE a.kvis_year IS NOT NULL
  GROUP BY a.kvis_year
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
country_counts AS (
  SELECT pe.country AS label, COUNT(*)::bigint AS count
  FROM primary_education AS pe
  WHERE pe.country IS NOT NULL
  GROUP BY pe.country
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
university_counts AS (
  SELECT pe.university AS label, COUNT(*)::bigint AS count
  FROM primary_education AS pe
  WHERE pe.university IS NOT NULL
  GROUP BY pe.university
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
field_counts AS (
  SELECT pe.field_of_study AS label, COUNT(*)::bigint AS count
  FROM primary_education AS pe
  WHERE pe.field_of_study IS NOT NULL
  GROUP BY pe.field_of_study
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
field_mix_counts AS (
  SELECT a.kvis_year::text AS cohort, pe.field_of_study AS field, COUNT(*)::bigint AS count
  FROM alumni AS a
  JOIN primary_education AS pe ON pe.user_id = a.id
  WHERE a.kvis_year IS NOT NULL AND pe.field_of_study IS NOT NULL
  GROUP BY a.kvis_year, pe.field_of_study
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
field_mix AS (
  SELECT cohort, jsonb_object_agg(field, count ORDER BY field) AS fields
  FROM field_mix_counts
  GROUP BY cohort
),
industry_counts AS (
  SELECT pc.industry_sector AS label, COUNT(*)::bigint AS count
  FROM primary_career AS pc
  WHERE pc.industry_sector IS NOT NULL
  GROUP BY pc.industry_sector
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
),
role_type_counts AS (
  SELECT pc.role_type AS label, COUNT(*)::bigint AS count
  FROM primary_career AS pc
  WHERE pc.role_type IS NOT NULL
  GROUP BY pc.role_type
  HAVING COUNT(*) >= (SELECT minimum_count FROM config)
)
SELECT jsonb_build_object(
  'schema_version', 1,
  'minimum_count', (SELECT minimum_count FROM config),
  'alumni_total', (SELECT COUNT(*) FROM alumni),
  'education_total', (SELECT COUNT(*) FROM primary_education),
  'career_total', (SELECT COUNT(*) FROM primary_career),
  'cohorts', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY label::integer) FROM cohort_counts), '{}'::jsonb),
  'countries', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY count DESC, label) FROM country_counts), '{}'::jsonb),
  'universities', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY count DESC, label) FROM university_counts), '{}'::jsonb),
  'fields_of_study', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY count DESC, label) FROM field_counts), '{}'::jsonb),
  'field_mix_by_cohort', COALESCE((SELECT jsonb_object_agg(cohort, fields ORDER BY cohort::integer) FROM field_mix), '{}'::jsonb),
  'industries', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY count DESC, label) FROM industry_counts), '{}'::jsonb),
  'role_types', COALESCE((SELECT jsonb_object_agg(label, count ORDER BY count DESC, label) FROM role_type_counts), '{}'::jsonb)
) AS stats_aggregates;
