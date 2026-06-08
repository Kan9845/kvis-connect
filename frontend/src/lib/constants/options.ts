// Migrated from legacy kvis-alumni-website schema

export const DEGREES = [
  { value: "Bachelor", label: "Bachelor's" },
  { value: "Master", label: "Master's" },
  { value: "PhD", label: "PhD / Doctorate" },
  { value: "MD", label: "MD (Medicine)" },
  { value: "MBBS", label: "MBBS (Medicine)" },
  { value: "MBChB", label: "MBChB (Medicine)" },
  { value: "Other", label: "Other" },
] as const;

export const JOB_FIELDS = [
  { value: "Technology", label: "Technology" },
  { value: "Engineering", label: "Engineering" },
  { value: "Finance", label: "Finance / Banking" },
  { value: "Healthcare", label: "Healthcare / Medicine" },
  { value: "Research", label: "Research / Academia" },
  { value: "Business", label: "Business / Consulting" },
  { value: "Government", label: "Government / Public Policy" },
  { value: "Education", label: "Education" },
  { value: "Creative Arts", label: "Creative Arts / Design" },
  { value: "Other", label: "Other" },
] as const;

export const MAJORS = [
  "Accounting", "Agricultural Economics", "Agriculture", "Applied Physics",
  "Architecture", "Astronomy", "Astrophysics", "Audiology", "Banking",
  "Biochemistry", "Bioinformatics", "Biology", "Biomedical Engineering",
  "Biophysics", "Biostatistics", "Business", "Business Management",
  "Career Development", "Chemical Engineering", "Chemical Physics", "Chemistry",
  "Chinese", "Cinema and Media Studies", "City Planning", "Civil Engineering",
  "Cognitive Science", "Communications", "Computational Biology",
  "Computer Engineering", "Computer Science", "Consulting", "Counseling",
  "Data Science", "Dentistry", "Design", "Earth Science", "Ecology",
  "Economics", "Education", "Electrical Engineering", "Engineering", "English",
  "Environmental Engineering", "Environmental Science", "Epidemiology",
  "Finance", "Fine Arts", "Genetics", "Geography", "Geological Engineering",
  "Geology", "Government", "Health", "History", "Industrial Engineering",
  "Information Sciences", "International Business", "International Finance",
  "Law", "Liberal Arts", "Management", "Marketing", "Mathematics",
  "Mathematics Education", "Mechanical Engineering", "Media Studies",
  "Medicine", "Microbiology", "Mining Engineering", "Molecular Biology",
  "Music", "Neuroscience", "Nuclear Engineering", "Nursing", "Nutrition",
  "Ophthalmology", "Organic Chemistry", "Orthopaedic Surgery", "Painting",
  "Paleontology", "Personal Training", "Petroleum Engineering", "Pharmacy",
  "Philosophy", "Philosophy of Science", "Physics", "Political Science",
  "Psychology", "Public Policy", "Radiology", "Real Estate", "Science",
  "Science Education", "Statistics",
] as const;

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = (typeof MBTI_TYPES)[number];

// ─── KVIS cohort automation ────────────────────────────────────────────────────
// K1 graduated in 2018. Each May a new cohort graduates.
// This function computes the current latest cohort automatically — no manual update needed.
const KVIS_FIRST_GRAD_YEAR = 2018;

export function getCurrentLatestCohort(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // Graduation happens ~May. Before May, latest cohort is previous year's.
  const gradYear = month >= 5 ? year : year - 1;
  return gradYear - KVIS_FIRST_GRAD_YEAR + 1;
}

export const LATEST_COHORT = getCurrentLatestCohort();

export const KVIS_YEARS: Array<{ value: number; label: string }> = Array.from(
  { length: LATEST_COHORT },
  (_, i) => ({ value: i + 1, label: `KVIS ${i + 1}` })
);

// ─── Faculty departments ───────────────────────────────────────────────────────
export const KVIS_DEPARTMENTS = [
  "Mathematics and Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Health and Physical Education",
  "Social Studies / Social Science",
  "Thai Language",
  "Foreign Languages",
  "Music and Applied Arts",
  "Other",
];

// ─── Helper functions ─────────────────────────────────────────────────────────
export function degreeLabel(value: string) {
  return DEGREES.find((d) => d.value === value)?.label ?? value;
}

export function jobFieldLabel(value: string) {
  return JOB_FIELDS.find((j) => j.value === value)?.label ?? value;
}