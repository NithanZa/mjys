import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is not set. Please configure it in .env.local"
    );
}

// Runtime client uses DATABASE_URL (pooled) via @prisma/adapter-pg
export const prisma =
    globalForPrisma.prisma ??
    (() => {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    })();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
