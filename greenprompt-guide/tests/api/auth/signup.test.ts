import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as requestEmailVerification } from "@/app/api/auth/signup/request-email-verification/route";
import { POST } from "@/app/api/auth/signup/route";
import { createJsonRequest } from "@/tests/test-utils";

const isUsernameAvailableMock = vi.hoisted(() => vi.fn());
const isEmailAvailableMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());
const hashPasswordMock = vi.hoisted(() => vi.fn());
const createSessionCookieMock = vi.hoisted(() => vi.fn());
const emailVerificationStoreMock = vi.hoisted(() => ({
  createCode: vi.fn(),
  claimCode: vi.fn(),
}));
const sendSignupVerificationCodeMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/lib/email-verification", () => ({
  emailVerificationStore: emailVerificationStoreMock,
}));

vi.mock("@/lib/email-service", () => ({
  emailService: {
    sendSignupVerificationCode: sendSignupVerificationCodeMock,
  },
}));

vi.mock("@/lib/session", () => ({
  createSessionCookie: createSessionCookieMock,
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "",
        email: "",
        password: "",
        passwordConfirm: "",
        verificationCode: "",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "All fields are required" });
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "invalid-email",
        password: "password123",
        passwordConfirm: "password123",
        verificationCode: "ABC123",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid email format" });
  });

  it("returns 400 for a weak password", async () => {
    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "short",
        passwordConfirm: "short",
        verificationCode: "ABC123",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Password must be at least 8 characters" });
  });

  it("returns 400 when passwords do not match", async () => {
    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password124",
        verificationCode: "ABC123",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Passwords do not match" });
  });

  it("returns 409 when the username is already taken", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(false);

    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password123",
        verificationCode: "ABC123",
      })
    );

    expect(isUsernameAvailableMock).toHaveBeenCalledWith("victor");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Username already taken" });
  });

  it("returns 409 when the email is already registered", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(false);

    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password123",
        verificationCode: "ABC123",
      })
    );

    expect(isEmailAvailableMock).toHaveBeenCalledWith("victor@example.com");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
  });

  it("returns 401 when the verification code is invalid", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(true);
    emailVerificationStoreMock.claimCode.mockReturnValueOnce(false);

    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password123",
        verificationCode: "ABC123",
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "The introduced code isn't correct. Please try again.",
    });
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("creates the account, session, and returns the new user", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(true);
    emailVerificationStoreMock.claimCode.mockReturnValueOnce(true);
    hashPasswordMock.mockResolvedValueOnce("hashed-password");
    createUserMock.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      role: "user",
    });

    const response = await POST(
      createJsonRequest("/api/auth/signup", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password123",
        verificationCode: "ABC123",
      })
    );

    expect(hashPasswordMock).toHaveBeenCalledWith("password123");
    expect(emailVerificationStoreMock.claimCode).toHaveBeenCalledWith(
      "victor@example.com",
      "ABC123"
    );
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

describe("POST /api/auth/signup/request-email-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a signup verification code after validation passes", async () => {
    isUsernameAvailableMock.mockResolvedValueOnce(true);
    isEmailAvailableMock.mockResolvedValueOnce(true);
    emailVerificationStoreMock.createCode.mockReturnValueOnce("ABC123");
    sendSignupVerificationCodeMock.mockResolvedValueOnce(true);

    const response = await requestEmailVerification(
      createJsonRequest("/api/auth/signup/request-email-verification", {
        username: "victor",
        email: "victor@example.com",
        password: "password123",
        passwordConfirm: "password123",
      })
    );

    expect(emailVerificationStoreMock.createCode).toHaveBeenCalledWith("victor@example.com");
    expect(sendSignupVerificationCodeMock).toHaveBeenCalledWith("victor@example.com", "ABC123");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Verification code sent to your email" });
  });
});