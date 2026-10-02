import { prisma } from "./db";

// DB-backed rate limiting (works across serverless instances).
// Each check counts rows in RateLimitHit for (ip, action) inside the window.

export async function isRateLimited(
  ip: string,
  action: "feedback" | "admin_login",
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({
    where: { ip, action, createdAt: { gt: since } },
  });
  return count >= limit;
}

export async function recordRateLimitHit(
  ip: string,
  action: "feedback" | "admin_login",
): Promise<void> {
  await prisma.rateLimitHit.create({ data: { ip, action } });
  // Best-effort pruning so the table stays small (older than 24h).
  try {
    await prisma.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  } catch {
    // Pruning is optional; ignore failures.
  }
}

/** Reset the counter, e.g. after a successful admin login. */
export async function clearRateLimitHits(
  ip: string,
  action: "feedback" | "admin_login",
): Promise<void> {
  try {
    await prisma.rateLimitHit.deleteMany({ where: { ip, action } });
  } catch {
    // ignore
  }
}
