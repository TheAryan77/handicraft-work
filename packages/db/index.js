const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prismaPackage = require("@prisma/client");

const globalForPrisma = globalThis;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
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
