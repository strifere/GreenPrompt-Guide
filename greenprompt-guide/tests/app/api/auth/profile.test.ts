import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";
import { GET as GETProfile } from "@/app/api/auth/profile/route";
import { POST as POSTUsername } from "@/app/api/auth/profile/username/route";
import { POST as POSTEmailRequest } from "@/app/api/auth/profile/email/request/route";
import { POST as POSTEmailVerify } from "@/app/api/auth/profile/email/verify/route";
import { POST as POSTPassword } from "@/app/api/auth/profile/password/route";

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
const repoMock = vi.hoisted(() => ({
  getUserByUsername: vi.fn(),
  isUsernameAvailable: vi.fn(),
  updateUsername: vi.fn(),
  getUserEmailByUsername: vi.fn(),
  isEmailAvailable: vi.fn(),
  getUserByEmail: vi.fn(),
  updateEmail: vi.fn(),
  getUserByUsernameWithPassword: vi.fn(),
  updatePassword: vi.fn(),
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

vi.mock("@/domain/user-repository", () => repoMock);

describe("auth profile routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current profile", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    repoMock.getUserByUsername.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      role: "user",
    });

    const response = await GETProfile();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        username: "victor",
        email: "victor@example.com",
        role: "user",
      },
    });
  });

  it("updates the username and refreshes the session cookie", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    repoMock.isUsernameAvailable.mockResolvedValueOnce(true);
    repoMock.updateUsername.mockResolvedValueOnce({
      username: "victor-new",
      email: "victor@example.com",
    });

    const response = await POSTUsername(createJsonRequest("/api/auth/profile/username", {
      username: "victor-new",
    }));

    expect(repoMock.updateUsername).toHaveBeenCalledWith({
      currentUsername: "victor",
      newUsername: "victor-new",
    });
    expect(createSessionCookieMock).toHaveBeenCalledWith("victor-new");
    expect(response.status).toBe(200);
  });

  it("sends a verification code to a new email", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    repoMock.getUserEmailByUsername.mockResolvedValueOnce({ email: "victor@example.com" });
    repoMock.isEmailAvailable.mockResolvedValueOnce(true);
    passwordRecoveryStoreMock.createToken.mockReturnValueOnce("ABC123");
    sendEmailChangeVerificationCodeMock.mockResolvedValueOnce(true);

    const response = await POSTEmailRequest(createJsonRequest("/api/auth/profile/email/request", {
      email: "new@example.com",
    }));

    expect(response.status).toBe(200);
    expect(sendEmailChangeVerificationCodeMock).toHaveBeenCalledWith("new@example.com", "ABC123");
  });

  it("updates the email after the code is verified", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    passwordRecoveryStoreMock.verifyCode.mockReturnValueOnce("reset-token");
    repoMock.getUserEmailByUsername.mockResolvedValueOnce({ email: "victor@example.com" });
    repoMock.getUserByEmail.mockResolvedValueOnce(null);
    repoMock.updateEmail.mockResolvedValueOnce({
      username: "victor",
      email: "new@example.com",
      role: "user",
    });

    const response = await POSTEmailVerify(createJsonRequest("/api/auth/profile/email/verify", {
      email: "new@example.com",
      code: "ABC123",
    }));

    expect(repoMock.updateEmail).toHaveBeenCalledWith({
      username: "victor",
      newEmail: "new@example.com",
    });
    expect(passwordRecoveryStoreMock.consumeResetToken).toHaveBeenCalledWith("reset-token");
    expect(response.status).toBe(200);
  });

  it("changes the password after validating the current one", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    repoMock.getUserByUsernameWithPassword.mockResolvedValueOnce({
      username: "victor",
      email: "victor@example.com",
      role: "user",
      password: "hashed-current",
    });
    verifyPasswordMock.mockResolvedValueOnce(true);
    hashPasswordMock.mockResolvedValueOnce("hashed-new");

    const response = await POSTPassword(createJsonRequest("/api/auth/profile/password", {
      currentPassword: "current-password",
      password: "new-password",
      passwordConfirm: "new-password",
    }));

    expect(hashPasswordMock).toHaveBeenCalledWith("new-password");
    expect(repoMock.updatePassword).toHaveBeenCalledWith({
      username: "victor",
      hashedPassword: "hashed-new",
    });
    expect(response.status).toBe(200);
  });
});
