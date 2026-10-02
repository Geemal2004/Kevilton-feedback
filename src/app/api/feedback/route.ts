import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/auth";
import { FEEDBACK_LIMIT_PER_HOUR } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { assertRuntimeEnv } from "@/lib/env";
import {
  isRateLimited,
  recordRateLimitHit,
} from "@/lib/rate-limit";
import { feedbackInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  assertRuntimeEnv();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = feedbackInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 },
    );
  }

  // Honeypot: pretend everything is fine so bots learn nothing.
  if (parsed.data.website && parsed.data.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const ip = getClientIp(request.headers);

  try {
    if (await isRateLimited(ip, "feedback", FEEDBACK_LIMIT_PER_HOUR, WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }
    await recordRateLimitHit(ip, "feedback");

    const created = await prisma.feedback.create({
      data: {
        testerName: parsed.data.testerName,
        category: parsed.data.category,
        module: parsed.data.module,
        message: parsed.data.message,
        status: "new",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/feedback failed:", err);
    return NextResponse.json(
      { error: "Could not save feedback. Please try again." },
      { status: 500 },
    );
  }
}
