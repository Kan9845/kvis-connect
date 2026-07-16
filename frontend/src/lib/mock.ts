import MockAdapter from "axios-mock-adapter";

import api from "./api";
import type {
  AdminOverview,
  AdminExportField,
  AdminUserPage,
  AdminUserSummary,
  SiteThemeColors,
  UserMe,
} from "./types";

const MOCK_EMAIL = "00123@kvis.ac.th";
const MOCK_PASSWORD = "password";
const MOCK_MEMBER_EMAIL = "test.member@kvis.ac.th";
const MOCK_MEMBER_PASSWORD = "TestOnly-2026!";
const REGISTERED_EMAILS = new Set([MOCK_EMAIL, MOCK_MEMBER_EMAIL]);
const MOCK_THEME_STORAGE_KEY = "kvis-connect:mock-site-theme";
const MOCK_THEME_KEYS: Array<keyof SiteThemeColors> = [
  "background",
  "surface",
  "foreground",
  "primary",
  "accent",
  "green",
  "border",
  "danger",
];

function normalizeMockTheme(value: unknown): Partial<SiteThemeColors> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    MOCK_THEME_KEYS.flatMap((key) => {
      const color = source[key];
      return typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)
        ? [[key, color]]
        : [];
    }),
  ) as Partial<SiteThemeColors>;
}

function readStoredMockTheme(): Partial<SiteThemeColors> {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(MOCK_THEME_STORAGE_KEY);
    return stored ? normalizeMockTheme(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

function persistMockTheme(colors: Partial<SiteThemeColors>) {
  if (typeof window === "undefined") return;

  try {
    if (Object.keys(colors).length === 0) {
      window.localStorage.removeItem(MOCK_THEME_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MOCK_THEME_STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // The in-memory mock remains usable when browser storage is unavailable.
  }
}

let loggedIn = false;
let activeMockUser: UserMe | null = null;

const mockAdmin: UserMe = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "mock-admin",
  first_name: "Mock",
  last_name: "Administrator",
  email: MOCK_EMAIL,
  email_verified: true,
  is_verified: true,
  profile_setup_done: true,
  education: [],
  career: [],
  research_interests: [],
  projects: [],
  publications: [],
  portfolio_links: [],
  languages: [],
  extra_contacts: [],
  has_password: true,
  created_at: "2026-01-01T00:00:00.000Z",
  permissions: [
    "admin.overview.read",
    "admin.users.read",
    "admin.feedback.read",
    "admin.site_theme.manage",
    "admin.data_export.download",
  ],
};

const mockMember: UserMe = {
  id: "00000000-0000-0000-0000-000000000002",
  slug: "test-member",
  first_name: "Test",
  last_name: "Member",
  email: MOCK_MEMBER_EMAIL,
  email_verified: true,
  is_verified: true,
  profile_setup_done: false,
  education: [],
  career: [],
  research_interests: [],
  projects: [],
  publications: [],
  portfolio_links: [],
  languages: [],
  extra_contacts: [],
  has_password: true,
  created_at: "2026-07-15T00:00:00.000Z",
  permissions: [],
};

function hasMockPermission(permission: string) {
  return (
    loggedIn &&
    (activeMockUser ?? mockAdmin).permissions.includes(permission)
  );
}

const mockUsers: AdminUserSummary[] = [
  {
    id: mockAdmin.id,
    slug: mockAdmin.slug,
    first_name: mockAdmin.first_name,
    last_name: mockAdmin.last_name,
    email: mockAdmin.email,
    email_verified: true,
    is_verified: true,
    profile_setup_done: true,
    created_at: mockAdmin.created_at,
    roles: ["administrator"],
  },
  {
    id: mockMember.id,
    slug: mockMember.slug,
    first_name: mockMember.first_name,
    last_name: mockMember.last_name,
    email: mockMember.email,
    email_verified: true,
    is_verified: true,
    profile_setup_done: false,
    created_at: "2026-02-15T00:00:00.000Z",
    roles: [],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "pending-member",
    first_name: "Pending",
    last_name: "Member",
    email: "00789@kvis.ac.th",
    email_verified: false,
    is_verified: false,
    profile_setup_done: false,
    created_at: "2026-03-01T00:00:00.000Z",
    roles: [],
  },
];

const mockOverview: AdminOverview = {
  total_users: mockUsers.length,
  eligible_users: mockUsers.filter(
    (user) => user.email_verified && user.is_verified,
  ).length,
  completed_profiles: mockUsers.filter((user) => user.profile_setup_done).length,
  recent_users_30d: 1,
};

const mock = new MockAdapter(api, { delayResponse: 250 });
let mockThemeColors: Partial<SiteThemeColors> = readStoredMockTheme();

mock.onPost("/api/auth/register").reply((config) => {
  const body = JSON.parse(config.data);
  const email: string = body.email ?? "";

  if (!email.endsWith("@kvis.ac.th")) {
    return [400, { detail: "Only @kvis.ac.th emails are allowed" }];
  }
  if (REGISTERED_EMAILS.has(email)) {
    return [400, { detail: "Email already registered" }];
  }

  REGISTERED_EMAILS.add(email);
  return [200, { message: "Registered successfully", user_id: "mock-user" }];
});

mock.onPost("/api/auth/login").reply((config) => {
  const body = JSON.parse(config.data);
  if (body.email === MOCK_EMAIL && body.password === MOCK_PASSWORD) {
    loggedIn = true;
    activeMockUser = mockAdmin;
    return [200, { message: "Logged in", user_id: mockAdmin.id }];
  }
  if (
    body.email === MOCK_MEMBER_EMAIL &&
    body.password === MOCK_MEMBER_PASSWORD
  ) {
    loggedIn = true;
    activeMockUser = mockMember;
    return [200, { message: "Logged in", user_id: mockMember.id }];
  }
  return [401, { detail: "Invalid credentials" }];
});

mock.onPost("/api/auth/logout").reply(() => {
  loggedIn = false;
  activeMockUser = null;
  return [200, { message: "Logged out" }];
});

mock.onPost("/api/auth/refresh").reply(() =>
  loggedIn
    ? [200, { message: "Token refreshed" }]
    : [401, { detail: "Not authenticated" }],
);

mock.onGet("/api/users/me").reply(() =>
  loggedIn
    ? [200, activeMockUser ?? mockAdmin]
    : [401, { detail: "Not authenticated" }],
);

mock.onGet("/api/admin/overview").reply(() =>
  hasMockPermission("admin.overview.read")
    ? [200, mockOverview]
    : [403, { detail: "Administrator permission required" }],
);

mock.onGet("/api/site-theme").reply(() => [200, { colors: mockThemeColors }]);
mock.onPut("/api/admin/site-theme").reply((config) => {
  if (!loggedIn) return [401, { detail: "Not authenticated" }];
  if (!hasMockPermission("admin.site_theme.manage")) {
    return [403, { detail: "Administrator permission required" }];
  }
  mockThemeColors = normalizeMockTheme(JSON.parse(config.data).colors);
  persistMockTheme(mockThemeColors);
  return [200, { colors: mockThemeColors, updated_at: new Date().toISOString() }];
});
mock.onDelete("/api/admin/site-theme").reply(() => {
  if (!loggedIn) return [401, { detail: "Not authenticated" }];
  if (!hasMockPermission("admin.site_theme.manage")) {
    return [403, { detail: "Administrator permission required" }];
  }
  mockThemeColors = {};
  persistMockTheme(mockThemeColors);
  return [200, { colors: mockThemeColors, updated_at: new Date().toISOString() }];
});

mock.onGet("/api/admin/users").reply((config) => {
  if (!loggedIn) return [401, { detail: "Not authenticated" }];
  if (!hasMockPermission("admin.users.read")) {
    return [403, { detail: "Administrator permission required" }];
  }

  const page = Number(config.params?.page ?? 1);
  const pageSize = Number(config.params?.page_size ?? 25);
  const start = (page - 1) * pageSize;
  const payload: AdminUserPage = {
    items: mockUsers.slice(start, start + pageSize),
    total: mockUsers.length,
    page,
    page_size: pageSize,
  };
  return [200, payload];
});

const mockExportFieldDefinitions: [string, string, string, string, boolean?][] = [
  ["id", "User ID", "Stable internal UUID", "Identity", true],
  ["slug", "Profile slug", "Public profile identifier", "Identity", true],
  ["first_name", "First name", "Account first name", "Identity", true],
  ["last_name", "Last name", "Account last name", "Identity", true],
  ["nickname", "Nickname", "Optional nickname", "Identity"],
  ["nickname_public", "Nickname public", "Nickname visibility flag", "Identity"],
  ["email", "Login email", "Primary account email", "Contact", true],
  ["kvis_email", "KVIS email", "Institutional KVIS email address", "Contact"],
  ["personal_email", "Personal email", "Verified secondary email", "Contact"],
  ["contact_email", "Contact email", "Profile contact email", "Contact"],
  ["contact_email_public", "Contact email public", "Contact visibility flag", "Contact"],
  ["kvis_year", "KVIS year", "Recorded alumni cohort", "KVIS", true],
  ["current_grade", "Current grade", "Grade 10, 11, or 12", "KVIS", true],
  ["expected_grad_year", "Expected graduation", "Expected graduation year", "KVIS"],
  ["current_status", "Current status", "Self-reported member status", "KVIS", true],
  ["teach_start_year", "Teaching start", "Faculty start year", "KVIS"],
  ["teach_end_year", "Teaching end", "Faculty end year", "KVIS"],
  ["is_current_teacher", "Current teacher", "Current faculty flag", "KVIS"],
  ["teach_department", "Department", "Faculty department", "KVIS"],
  ["place", "Current place", "Current institution or employer", "Location"],
  ["place_level2", "Place detail", "Secondary place label", "Location"],
  ["latitude", "Latitude", "Profile map latitude", "Location"],
  ["longitude", "Longitude", "Profile map longitude", "Location"],
  ["country", "Country", "Current country", "Location"],
  ["province_of_origin", "Province of origin", "Recorded home province", "Location"],
  ["profile_pic_url", "Profile picture URL", "Profile image location", "Profile"],
  ["goose_config", "Goose configuration", "Structured profile mascot settings", "Profile"],
  ["bio", "Biography", "Profile biography", "Profile"],
  ["mbti", "MBTI", "Self-reported personality type", "Profile"],
  ["zodiac", "Zodiac", "Self-reported zodiac", "Profile"],
  ["chronotype", "Chronotype", "Self-reported chronotype", "Profile"],
  ["interests", "Interests", "Profile interests", "Profile"],
  ["interests_public", "Interests public", "Interests visibility flag", "Profile"],
  ["research_keywords", "Research keywords", "Research topic keywords", "Profile"],
  ["hobbies", "Hobbies JSON", "Structured hobbies data", "Profile"],
  ["kvis_fav_menu", "Favorite menu", "KVIS favorite food/menu", "Profile"],
  ["kvis_fav_event", "Favorite event", "KVIS favorite event", "Profile"],
  ["kvis_fav_area", "Favorite area", "KVIS favorite place", "Profile"],
  ["activities", "Activities JSON", "Structured activity records", "Profile"],
  ["competitions", "Competitions JSON", "Structured competition records", "Profile"],
  ["experience_camps", "Experience camps JSON", "Structured camp records", "Profile"],
  ["clubs", "Clubs JSON", "Structured club records", "Profile"],
  ["education_json", "Education JSON", "All education rows as JSON", "Related records"],
  ["career_json", "Career JSON", "All career rows as JSON", "Related records"],
  ["email_verified", "Email verified", "Email verification state", "Maintenance"],
  ["is_verified", "KVIS verified", "Institution verification state", "Maintenance"],
  ["profile_setup_done", "Profile complete", "Onboarding completion state", "Maintenance"],
  ["is_deleted", "Deleted", "Soft-deletion state", "Maintenance"],
  ["is_deleted_at", "Deleted at", "Soft-deletion timestamp", "Maintenance"],
  ["created_at", "Created at", "Account creation timestamp", "Maintenance"],
  ["updated_at", "Updated at", "Last account update timestamp", "Maintenance"],
];

const mockExportFields: AdminExportField[] = mockExportFieldDefinitions.map(
  ([key, label, description, category, defaultSelected = false]) => ({
    key,
    label,
    description,
    category,
    sensitive: true,
    default_selected: defaultSelected,
  }),
);

mock.onGet("/api/admin/data-export/fields").reply(() =>
  hasMockPermission("admin.data_export.download")
    ? [200, mockExportFields]
    : [403, { detail: "Administrator permission required" }],
);

mock.onPost("/api/admin/data-export/preview").reply((config) => {
  if (!hasMockPermission("admin.data_export.download")) return [403, { detail: "Administrator permission required" }];
  const body = JSON.parse(config.data);
  const columns: string[] = body.fields;
  const rows = mockUsers.slice(0, 3).map((user) => columns.map((column) => {
    if (column === "id") return `${user.id.slice(0, 8)}...`;
    if (column === "email") return `***@${user.email.split("@")[1]}`;
    if (column === "education_json" || column === "career_json") return "[***]";
    const value = user[column as keyof AdminUserSummary];
    return value == null ? "" : `${String(value).slice(0, 1)}***`;
  }));
  const estimatedSize = Math.max(columns.join(",").length + 2, columns.length * 18 * mockUsers.length);
  return [200, { columns, rows, total_rows: mockUsers.length, estimated_size_bytes: estimatedSize, masked: true }];
});

mock.onPost("/api/admin/data-export/download").reply((config) => {
  if (!hasMockPermission("admin.data_export.download")) return [403, { detail: "Administrator permission required" }];
  const body = JSON.parse(config.data);
  if (!body.acknowledge_sensitive) return [400, { detail: "Sensitive-data acknowledgement is required" }];
  const columns: string[] = body.fields;
  const csv = [columns.join(","), ...mockUsers.map((user) => columns.map((column) => {
    const value = user[column as keyof AdminUserSummary];
    return JSON.stringify(value ?? "");
  }).join(","))].join("\r\n");
  return [200, csv, { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="kvis-connect-user-export-mock.csv"' }];
});

mock.onGet("/api/feedback").reply(() =>
  hasMockPermission("admin.feedback.read")
    ? [
        200,
        [
          {
            id: "00000000-0000-0000-0000-000000000101",
            type: "suggestion",
            message: "Mock feedback for admin UI testing.",
            contact_email: "mock@example.test",
            created_at: "2026-03-02T09:30:00.000Z",
          },
        ],
      ]
    : [401, { detail: "Not authenticated" }],
);

const VALID_RESET_TOKEN = "mock-reset-token-abc123";

mock.onPost("/api/auth/password-reset/request").reply((config) => {
  const body = JSON.parse(config.data);
  const email: string = body.email ?? "";

  if (!email.endsWith("@kvis.ac.th")) {
    return [400, { detail: "Only @kvis.ac.th emails are allowed" }];
  }
  return [
    200,
    { message: "If that email is registered, a reset link has been sent." },
  ];
});

mock.onPost("/api/auth/password-reset/confirm").reply((config) => {
  const body = JSON.parse(config.data);
  const { token, new_password } = body;

  if (token !== VALID_RESET_TOKEN) {
    return [400, { detail: "Invalid or expired reset token." }];
  }
  if (!new_password || new_password.length < 6) {
    return [400, { detail: "Password must be at least 6 characters." }];
  }
  return [200, { message: "Password reset successfully." }];
});

// Mock mode is intentionally isolated: an unhandled request must never reach a
// real staging or production backend by accident.
mock.onAny().reply(501, {
  detail: "This endpoint is not implemented by the isolated frontend mock.",
});
