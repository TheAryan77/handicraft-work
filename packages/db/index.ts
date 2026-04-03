import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required to initialize Prisma."
    );
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: databaseUrl,
        errorFormat: "pretty",
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
