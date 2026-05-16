import type { UserCard } from "./types";

// Dev-only fixture for the /search "Current Students" tab.
// Constraints (from the project memory):
//   - 3 grades: M.4 (10), M.5 (11), M.6 (12)
//   - 4 numerical classes per grade (1-4)
//   - 4 elemental houses (earth/water/air/fire), ~18 students each
//   - Each enrolled student has one numerical class AND one elemental house

type Element = "earth" | "water" | "air" | "fire";

const FIRST_NAMES = [
  "Anong", "Boon", "Chai", "Daw", "Earn", "Fah",
  "Gan", "Hara", "Intira", "Jaem", "Kanya", "Lalita",
  "Manus", "Nipa", "Orn", "Phong", "Rin", "Saksit",
  "Tara", "Ubon", "Veera", "Wisit", "Yindee", "Atit",
  "Benja", "Chaiya", "Dalad", "Ekarat", "Mali", "Naree",
];

const LAST_NAMES = [
  "Srisuk", "Wongchai", "Phetcharat", "Suwannakul", "Chaiyaporn", "Maneerat",
  "Aroonchai", "Kittiwan", "Boonyarit", "Limpitak", "Pongthep", "Saetang",
  "Thongdee", "Vongsa", "Yindeesuk", "Jaisamut", "Kosolsak", "Mahasap",
  "Nopadon", "Permsap", "Rakphan", "Tantipisut", "Wattana", "Khampan",
];

const ELEMENTS: Element[] = ["earth", "water", "air", "fire"];

// Grade -> KVIS cohort number. In 2026: M.6 = K12, M.5 = K13, M.4 = K14.
const GRADE_TO_K: Record<number, number> = { 12: 12, 11: 13, 10: 14 };

export const MOCK_CURRENT_STUDENTS: UserCard[] = (() => {
  const out: UserCard[] = [];
  let id = 10001;
  let count = 0;
  for (const grade of [12, 11, 10]) {
    for (const cls of [1, 2, 3, 4]) {
      // 6 students per class → 24 per grade → 72 total, 18 per element
      for (let i = 0; i < 6; i++) {
        out.push({
          id: id++,
          first_name: FIRST_NAMES[count % FIRST_NAMES.length],
          last_name: LAST_NAMES[count % LAST_NAMES.length],
          kvis_year: GRADE_TO_K[grade],
          country: "Thailand",
          current_grade: grade,
          current_class: cls,
          current_elemental: ELEMENTS[count % 4],
          education: [],
          career: [],
        });
        count++;
      }
    }
  }
  return out;
})();
