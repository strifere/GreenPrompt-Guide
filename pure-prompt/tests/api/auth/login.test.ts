import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { createJsonRequest } from "@/tests/test-utils";

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
}));

const verifyPasswordMock = vi.hoisted(() => vi.fn());
const createSessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  verifyPassword: verifyPasswordMock,
}));

vi.mock("@/lib/session", () => ({
  createSessionCookie: createSessionCookieMock,
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const response = await POST(createJsonRequest("/api/auth/login", {
      identifier: "",
      password: "",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Username or email and password are required",
    });
  });

  it("returns 401 when no matching user exists", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const response = await POST(createJsonRequest("/api/auth/login", {
      identifier: "victor",
      password: "password123",
    }));

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: "victor" }, { email: "victor" }],
      },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid username, email, or password",
    });
  });

  it("returns 401 when the password is invalid", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      password: "hashed",
    });
    verifyPasswordMock.mockResolvedValueOnce(false);

    const response = await POST(createJsonRequest("/api/auth/login", {
      identifier: "victor@example.com",
      password: "wrong-password",
    }));

    expect(verifyPasswordMock).toHaveBeenCalledWith("wrong-password", "hashed");
    expect(createSessionCookieMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("creates a session and returns the logged in user", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      password: "hashed-password",
    });
    verifyPasswordMock.mockResolvedValueOnce(true);

    const response = await POST(createJsonRequest("/api/auth/login", {
      identifier: "  victor@example.com  ",
      password: "password123",
    }));

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: "victor@example.com" }, { email: "victor@example.com" }],
      },
    });
    expect(createSessionCookieMock).toHaveBeenCalledWith("victor");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Login successful",
      user: { username: "victor", email: "victor@example.com" },
    });
  });

  it("returns 500 when the handler throws", async () => {
    prismaMock.user.findFirst.mockRejectedValueOnce(new Error("db down"));

    const response = await POST(createJsonRequest("/api/auth/login", {
      identifier: "victor",
      password: "password123",
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "An error occurred during login",
    });
  });
});