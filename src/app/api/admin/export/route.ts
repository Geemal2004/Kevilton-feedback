import { requireAdmin, buildFeedbackWhere } from "@/lib/admin-guard";
import { EXPORT_MAX_ROWS } from "@/lib/constants";
import { buildFeedbackCsv, CSV_BOM } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { assertRuntimeEnv } from "@/lib/env";
import { adminFeedbackQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";

// Exports the currently filtered rows as CSV (UTF-8 with BOM for Excel).
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
    page: 1,
  });
  if (!parsed.success) {
    return new Response("Invalid query parameters", { status: 400 });
  }

  const { ...filters } = parsed.data;
  const where = buildFeedbackWhere(filters);

  try {
    const rows = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: EXPORT_MAX_ROWS,
    });

    const csv = CSV_BOM + buildFeedbackCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kevilton-feedback-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/export failed:", err);
    return new Response("Could not export feedback", { status: 500 });
  }
}
