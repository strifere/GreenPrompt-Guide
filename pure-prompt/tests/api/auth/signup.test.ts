import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { createJsonRequest } from "@/tests/test-utils";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

const hashPasswordMock = vi.hoisted(() => vi.fn());
const createSessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: hashPasswordMock,
  isValidEmail: (email: string) => /@/.test(email),
  isValidPassword: (password: string) => password.length >= 8,
}));

vi.mock("@/lib/session", () => ({
  createSessionCookie: createSessionCookieMock,
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "",
      email: "",
      password: "",
      passwordConfirm: "",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "All fields are required" });
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "invalid-email",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid email format" });
  });

  it("returns 400 for a weak password", async () => {
    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "short",
      passwordConfirm: "short",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Password must be at least 8 characters" });
  });

  it("returns 400 when passwords do not match", async () => {
    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password124",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Passwords do not match" });
  });

  it("returns 409 when the username is already taken", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ username: "victor" });

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Username already taken" });
  });

  it("returns 409 when the email is already registered", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ email: "victor@example.com" });

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
  });

  it("creates the account, session, and returns the new user", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    hashPasswordMock.mockResolvedValueOnce("hashed-password");
    prismaMock.user.create.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
    });

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(hashPasswordMock).toHaveBeenCalledWith("password123");
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: "victor",
        email: "victor@example.com",
        password: "hashed-password",
      },
    });
    expect(createSessionCookieMock).toHaveBeenCalledWith("victor");
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "User created successfully",
      user: { username: "victor", email: "victor@example.com" },
    });
  });
});