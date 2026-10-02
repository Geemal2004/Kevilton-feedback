import { describe, expect, it, vi } from "vitest";

// Prisma is stubbed: these tests assert the 401 path, which must run before
// any database access, so the stub must never be called.
vi.mock("@/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get() {
        throw new Error("prisma must not be touched without admin login");
      },
    },
  ),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  recordRateLimitHit: vi.fn().mockResolvedValue(undefined),
  clearRateLimitHits: vi.fn().mockResolvedValue(undefined),
}));

function plainRequest(path: string): Request {
  return new Request(`http://localhost${path}`);
}

describe("admin routes without login", () => {
  it("GET /api/admin/feedback returns 401", async () => {
    const { GET } = await import("@/app/api/admin/feedback/route");
    const res = await GET(plainRequest("/api/admin/feedback"));
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/export returns 401", async () => {
    const { GET } = await import("@/app/api/admin/export/route");
    const res = await GET(plainRequest("/api/admin/export"));
    expect(res.status).toBe(401);
  });

  it("PATCH /api/admin/feedback/[id] returns 401", async () => {
    const { PATCH } = await import("@/app/api/admin/feedback/[id]/route");
    const res = await PATCH(plainRequest("/api/admin/feedback/1"), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });

  it("requireAdmin rejects missing/invalid cookies", async () => {
    const { requireAdmin } = await import("@/lib/admin-guard");
    const missing = await requireAdmin(plainRequest("/api/admin/feedback"));
    expect(missing?.status).toBe(401);

    const forged = await requireAdmin(
      new Request("http://localhost/api/admin/feedback", {
        headers: { cookie: "kevilton_admin_session=forged-value" },
      }),
    );
    expect(forged?.status).toBe(401);
  });
});
