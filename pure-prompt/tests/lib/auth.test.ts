import { describe, expect, it } from "vitest";
import { hashPassword, isValidEmail, isValidPassword, verifyPassword } from "@/lib/auth";

describe("lib/auth", () => {
  it("validates email format", () => {
    expect(isValidEmail("victor@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("validates password length", () => {
    expect(isValidPassword("password123")).toBe(true);
    expect(isValidPassword("short")).toBe(false);
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});