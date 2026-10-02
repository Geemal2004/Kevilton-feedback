// Shared constants: module list, categories, statuses.

export const MODULES = [
  "User Authentication & Profile",
  "Home, Room & Family Members",
  "Device Pairing",
  "Device Control (Switches & Dimmers)",
  "BLE Fallback & Offline",
  "Automations & Schedules",
  "Geofencing",
  "Vacation Mode & Device Health",
  "MCB Circuit Breaker",
  "Security & Performance",
  "General / Other",
] as const;

export type ModuleName = (typeof MODULES)[number];

export const CATEGORIES = [
  { value: "comment", label: "Comment" },
  { value: "pain_point", label: "Pain point" },
  { value: "bug", label: "Bug" },
  { value: "improvement", label: "Improvement" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

// Pagination
export const ADMIN_PAGE_SIZE = 25;
export const EXPORT_MAX_ROWS = 10000;

// Rate limits (DB-backed, see lib/rate-limit.ts)
export const FEEDBACK_LIMIT_PER_HOUR = 20;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;

// Validation bounds (kept in sync with schemas.ts)
export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 2000;
