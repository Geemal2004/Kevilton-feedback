import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isSessionCookieValueValid,
} from "@/lib/auth";

// Protects admin APIs with a 401 when the signed session cookie is missing
// or invalid. The /admin page itself is always allowed through so it can
// render the login form; the data it shows is gated by the same session
// check in the page component and in every admin handler.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const valid = await isSessionCookieValueValid(token);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
