import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { createJsonRequest } from "@/tests/test-utils";

const isUsernameAvailableMock = vi.hoisted(() => vi.fn());
const isEmailAvailableMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());
const hashPasswordMock = vi.hoisted(() => vi.fn());
const createSessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/user-repository", () => ({
  isUsernameAvailable: isUsernameAvailableMock,
  isEmailAvailable: isEmailAvailableMock,
  createUser: createUserMock,
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
    isUsernameAvailableMock.mockResolvedValueOnce(false);

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(isUsernameAvailableMock).toHaveBeenCalledWith("victor");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Username already taken" });
  });

  it("returns 409 when the email is already registered", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(false);

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(isEmailAvailableMock).toHaveBeenCalledWith("victor@example.com");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
  });

  it("creates the account, session, and returns the new user", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(true);
    hashPasswordMock.mockResolvedValueOnce("hashed-password");
    createUserMock.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      role: "user",
    });

    const response = await POST(createJsonRequest("/api/auth/signup", {
      username: "victor",
      email: "victor@example.com",
      password: "password123",
      passwordConfirm: "password123",
    }));

    expect(hashPasswordMock).toHaveBeenCalledWith("password123");
    expect(createUserMock).toHaveBeenCalledWith({
      username: "victor",
      email: "victor@example.com",
      password: "hashed-password",
    });
    expect(createSessionCookieMock).toHaveBeenCalledWith("victor");
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "User created successfully",
      user: { username: "victor", email: "victor@example.com" },
    });
  });
});
