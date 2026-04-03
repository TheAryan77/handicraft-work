const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prismaPackage = require("@prisma/client");

const globalForPrisma = globalThis;
const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
    throw new Error(
        "Missing database URL. Set one of: DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING."
    );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

const prisma =
    globalForPrisma.__prisma__ ??
    new PrismaClient({
        adapter,
        errorFormat: "pretty",
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__prisma__ = prisma;
}

module.exports = {
    ...prismaPackage,
    prisma,
};
