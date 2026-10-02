import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isSessionCookieValueValid,
} from "@/lib/auth";

// Returns a 401 JSON response when the request has no valid admin session,
// otherwise null. Used by every /api/admin/* handler (defence in depth in
// addition to middleware.ts). Reads the raw Cookie header so handlers stay
// unit-testable with plain Request objects.
export async function requireAdmin(
  request: Request,
): Promise<NextResponse | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(ADMIN_COOKIE_NAME.length + 1);
  if (!(await isSessionCookieValueValid(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function buildFeedbackWhere(query: {
  category?: string;
  module?: string;
  status?: string;
  search?: string;
}) {
  return {
    ...(query.category ? { category: query.category as never } : {}),
    ...(query.module ? { module: query.module } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(query.search
      ? {
          OR: [
            {
              testerName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              message: { contains: query.search, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };
}
