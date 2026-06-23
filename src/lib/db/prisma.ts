import { PrismaClient } from "@prisma/client";
import { createTenantMiddleware } from "./tenant";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Apply tenant middleware for automatic RLS
if (!globalForPrisma.prisma) {
  prisma.$use(createTenantMiddleware(prisma));
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
