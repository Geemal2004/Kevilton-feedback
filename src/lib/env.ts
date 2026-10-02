// Production environment guard.
// The app must refuse to run in production with placeholder secrets.
// Skipped during `next build` (NEXT_PHASE is set then) so builds don't fail
// when env vars are only provided at runtime (e.g. Vercel).

const PLACEHOLDER_HINTS = [
  "changeme",
  "placeholder",
  "example",
  "your-",
  "test",
  "password",
  "admin",
  "secret",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v.length === 0) return true;
  const lower = v.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => lower.includes(hint));
}

function isBuildPhase(): boolean {
  return Boolean(process.env.NEXT_PHASE?.includes("build"));
}

export function assertRuntimeEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (isBuildPhase()) return;

  const problems: string[] = [];
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (isPlaceholder(adminPassword)) {
    problems.push("ADMIN_PASSWORD is missing or still a placeholder");
  }
  if (isPlaceholder(sessionSecret) || (sessionSecret?.length ?? 0) < 32) {
    problems.push(
      "SESSION_SECRET is missing, still a placeholder, or shorter than 32 characters",
    );
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to start in production with unsafe configuration: ${problems.join("; ")}`,
    );
  }
}
