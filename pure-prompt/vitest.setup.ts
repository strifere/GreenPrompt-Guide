import "@testing-library/jest-dom/vitest";

// Set DATABASE_URL for tests to prevent Prisma initialization errors
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
