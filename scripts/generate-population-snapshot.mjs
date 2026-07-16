import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const inputPath = process.env.POPULATION_EXPORT_PATH;
if (!inputPath) {
  throw new Error("Set POPULATION_EXPORT_PATH to the local CSV export before running this command.");
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

const csv = await readFile(inputPath, "utf8");
const [rawHeaders, ...rows] = parseCsv(csv);
const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").trim());
const requiredHeaders = ["kvis_year", "current_grade", "is_current_teacher", "teach_start_year"];
const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
if (missingHeaders.length > 0) {
  throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}`);
}

const column = (name) => headers.indexOf(name);
const cohorts = new Map();
const alumniByCohort = new Map();
const currentGrades = new Map([["10", 0], ["11", 0], ["12", 0]]);
let teacherStaffCount = 0;
const dataRows = rows.filter((row) => row.some((value) => value.trim() !== ""));

for (const row of dataRows) {
  const cohort = row[column("kvis_year")]?.trim();
  const grade = row[column("current_grade")]?.trim();
  const isCurrentTeacher = row[column("is_current_teacher")]?.trim().toLowerCase();
  const teachStartYear = row[column("teach_start_year")]?.trim();
  if (/^\d+$/.test(cohort)) cohorts.set(cohort, (cohorts.get(cohort) ?? 0) + 1);
  if (currentGrades.has(grade)) currentGrades.set(grade, (currentGrades.get(grade) ?? 0) + 1);
  if (["true", "t", "1", "yes"].includes(isCurrentTeacher)) teacherStaffCount += 1;
  if (/^\d+$/.test(cohort) && !grade && !teachStartYear && !["true", "t", "1", "yes"].includes(isCurrentTeacher)) {
    alumniByCohort.set(cohort, (alumniByCohort.get(cohort) ?? 0) + 1);
  }
}

const snapshot = {
  total: dataRows.length,
  cohorts: Object.fromEntries([...cohorts.entries()].sort(([left], [right]) => Number(left) - Number(right))),
  alumniByCohort: Object.fromEntries([...alumniByCohort.entries()].sort(([left], [right]) => Number(left) - Number(right))),
  alumniCount: [...alumniByCohort.values()].reduce((total, count) => total + count, 0),
  currentGrades: Object.fromEntries(currentGrades),
  currentStudentCount: [...currentGrades.values()].reduce((total, count) => total + count, 0),
  teacherStaffCount,
};
const here = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(here, "../frontend/src/app/admin/populationSnapshot.ts");
const content = `// Generated locally from a private CSV export. Contains aggregate counts only.\n// Run \`pnpm run refresh:population-snapshot\` to refresh this file.\n\nexport const LOCAL_EXPORT_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)} as const;\n`;
await writeFile(outputPath, content, "utf8");
console.log(`Wrote anonymous population snapshot for ${snapshot.total} records.`);
