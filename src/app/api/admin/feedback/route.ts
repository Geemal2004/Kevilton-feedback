import { NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { assertRuntimeEnv } from "@/lib/env";
import { adminFeedbackQuerySchema } from "@/lib/schemas";
import { buildFeedbackWhere, requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  assertRuntimeEnv();

  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const parsed = adminFeedbackQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    module: url.searchParams.get("module") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { page, ...filters } = parsed.data;
  const where = buildFeedbackWhere(filters);

  try {
    const [rows, filteredTotal, newCount, reviewedCount, resolvedCount, grandTotal] =
      await prisma.$transaction([
        prisma.feedback.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * ADMIN_PAGE_SIZE,
          take: ADMIN_PAGE_SIZE,
        }),
        prisma.feedback.count({ where }),
        prisma.feedback.count({ where: { status: "new" } }),
        prisma.feedback.count({ where: { status: "reviewed" } }),
        prisma.feedback.count({ where: { status: "resolved" } }),
        prisma.feedback.count(),
      ]);

    const counts = {
      total: grandTotal,
      new: newCount,
      reviewed: reviewedCount,
      resolved: resolvedCount,
    };

    return NextResponse.json({
      data: rows,
      page,
      pageSize: ADMIN_PAGE_SIZE,
      total: filteredTotal,
      totalPages: Math.max(1, Math.ceil(filteredTotal / ADMIN_PAGE_SIZE)),
      counts,
    });
  } catch (err) {
    console.error("GET /api/admin/feedback failed:", err);
    return NextResponse.json(
      { error: "Could not load feedback" },
      { status: 500 },
    );
  }
}
