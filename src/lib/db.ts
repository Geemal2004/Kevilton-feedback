import { PrismaClient } from "@prisma/client";

// PrismaClient singleton: one instance per serverless invocation reuse.
const globalForPrisma = globalThis as unknown & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
