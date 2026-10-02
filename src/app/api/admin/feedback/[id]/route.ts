import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { assertRuntimeEnv } from "@/lib/env";
import { statusUpdateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  assertRuntimeEnv();

  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid feedback id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only `status` may be updated; anything else in the body is ignored.
  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status (expected new, reviewed or resolved)" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error(`PATCH /api/admin/feedback/${id} failed:`, err);
    return NextResponse.json(
      { error: "Feedback not found or could not be updated" },
      { status: 404 },
    );
  }
}
