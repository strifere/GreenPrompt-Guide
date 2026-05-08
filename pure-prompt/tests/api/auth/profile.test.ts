import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";
import { GET as GETProfile } from "@/app/api/auth/profile/route";
import { POST as POSTUsername } from "@/app/api/auth/profile/username/route";
import { POST as POSTEmailRequest } from "@/app/api/auth/profile/email/request/route";
import { POST as POSTEmailVerify } from "@/app/api/auth/profile/email/verify/route";
import { POST as POSTPassword } from "@/app/api/auth/profile/password/route";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const getSessionMock = vi.hoisted(() => vi.fn());
const createSessionCookieMock = vi.hoisted(() => vi.fn());
const verifyPasswordMock = vi.hoisted(() => vi.fn());
const hashPasswordMock = vi.hoisted(() => vi.fn());
const sendEmailChangeVerificationCodeMock = vi.hoisted(() => vi.fn());
const passwordRecoveryStoreMock = vi.hoisted(() => ({
  createToken: vi.fn(),
  verifyCode: vi.fn(),
  consumeResetToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  createSessionCookie: createSessionCookieMock,
}));

vi.mock("@/lib/auth", () => ({
  verifyPassword: verifyPasswordMock,
  hashPassword: hashPasswordMock,
  isValidEmail: (email: string) => /@/.test(email),
  isValidPassword: (password: string) => password.length >= 8,
}));

vi.mock("@/lib/password-recovery", () => ({
  passwordRecoveryStore: passwordRecoveryStoreMock,
}));

vi.mock("@/lib/email-service", () => ({
  emailService: {
    sendEmailChangeVerificationCode: sendEmailChangeVerificationCodeMock,
  },
}));

describe("GET /api/auth/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current profile", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      role: "USER",
    });

    const response = await GETProfile();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        username: "victor",
        email: "victor@example.com",
        role: "USER",
      },
    });
  });

  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GETProfile();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });
});

describe("POST /api/auth/profile/username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 409 when the username is already taken", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique.mockResolvedValueOnce({ username: "other" });

    const response = await POSTUsername(createJsonRequest("/api/auth/profile/username", {
      username: "other",
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Username already taken" });
  });

  it("updates the username and refreshes the session cookie", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.update.mockResolvedValueOnce({ username: "victor-new", email: "victor@example.com" });

    const response = await POSTUsername(createJsonRequest("/api/auth/profile/username", {
      username: "victor-new",
    }));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { username: "victor" },
      data: { username: "victor-new" },
      select: { username: true, email: true },
    });
    expect(createSessionCookieMock).toHaveBeenCalledWith("victor-new");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Username updated successfully",
      user: { username: "victor-new", email: "victor@example.com" },
    });
  });
});

describe("POST /api/auth/profile/email/request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a verification code to a new email", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ email: "victor@example.com" })
      .mockResolvedValueOnce(null);
    passwordRecoveryStoreMock.createToken.mockReturnValueOnce("ABC123");
    sendEmailChangeVerificationCodeMock.mockResolvedValueOnce(true);

    const response = await POSTEmailRequest(createJsonRequest("/api/auth/profile/email/request", {
      email: "new@example.com",
    }));

    expect(passwordRecoveryStoreMock.createToken).toHaveBeenCalledWith("new@example.com");
    expect(sendEmailChangeVerificationCodeMock).toHaveBeenCalledWith("new@example.com", "ABC123");
    expect(response.status).toBe(200);
  });

  it("returns 409 when the email already exists", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ email: "victor@example.com" })
      .mockResolvedValueOnce({ username: "other" });

    const response = await POSTEmailRequest(createJsonRequest("/api/auth/profile/email/request", {
      email: "taken@example.com",
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
  });
});

describe("POST /api/auth/profile/email/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the email after the code is verified", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    passwordRecoveryStoreMock.verifyCode.mockReturnValueOnce("reset-token");
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ email: "victor@example.com" })
      .mockResolvedValueOnce(null);

    const response = await POSTEmailVerify(createJsonRequest("/api/auth/profile/email/verify", {
      email: "new@example.com",
      code: "ABC123",
    }));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { username: "victor" },
      data: { email: "new@example.com" },
    });
    expect(passwordRecoveryStoreMock.consumeResetToken).toHaveBeenCalledWith("reset-token");
    expect(response.status).toBe(200);
  });

  it("returns 401 when the code is invalid", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    passwordRecoveryStoreMock.verifyCode.mockReturnValueOnce(null);

    const response = await POSTEmailVerify(createJsonRequest("/api/auth/profile/email/verify", {
      email: "new@example.com",
      code: "WRONG1",
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "The introduced code isn't correct. Please try again.",
    });
  });
});

describe("POST /api/auth/profile/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changes the password after validating the current one", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      password: "hashed-current",
    });
    verifyPasswordMock.mockResolvedValueOnce(true);
    hashPasswordMock.mockResolvedValueOnce("hashed-new");

    const response = await POSTPassword(createJsonRequest("/api/auth/profile/password", {
      currentPassword: "current-password",
      password: "new-password",
      passwordConfirm: "new-password",
    }));

    expect(verifyPasswordMock).toHaveBeenCalledWith("current-password", "hashed-current");
    expect(hashPasswordMock).toHaveBeenCalledWith("new-password");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { username: "victor" },
      data: { password: "hashed-new" },
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when the current password is wrong", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      password: "hashed-current",
    });
    verifyPasswordMock.mockResolvedValueOnce(false);

    const response = await POSTPassword(createJsonRequest("/api/auth/profile/password", {
      currentPassword: "wrong-password",
      password: "new-password",
      passwordConfirm: "new-password",
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Current password is incorrect" });
  });
});