import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getClientIp,
  isAdminPasswordCorrect,
  sessionCookieOptions,
} from "@/lib/auth";
import { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MINUTES } from "@/lib/constants";
import { assertRuntimeEnv } from "@/lib/env";
import {
  clearRateLimitHits,
  isRateLimited,
  recordRateLimitHit,
} from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const WINDOW_MS = LOGIN_WINDOW_MINUTES * 60 * 1000;

export async function POST(request: Request) {
  assertRuntimeEnv();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);

  try {
    if (await isRateLimited(ip, "admin_login", LOGIN_MAX_ATTEMPTS, WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }

    if (!isAdminPasswordCorrect(parsed.data.password)) {
      await recordRateLimitHit(ip, "admin_login");
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    await clearRateLimitHits(ip, "admin_login");
    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, sessionCookieOptions());
    return response;
  } catch (err) {
    console.error("POST /api/admin/login failed:", err);
    const message =
      err instanceof Error && /not configured|unsafe configuration/.test(err.message)
        ? "Server is not configured correctly"
        : "Login failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
