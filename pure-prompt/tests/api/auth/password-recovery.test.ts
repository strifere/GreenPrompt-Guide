import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as requestCode } from "@/app/api/auth/password-recovery/request/route";
import { POST as resetPassword } from "@/app/api/auth/password-recovery/reset/route";
import { POST as verifyCode } from "@/app/api/auth/password-recovery/verify-code/route";
import { createJsonRequest } from "@/tests/test-utils";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const passwordRecoveryStoreMock = vi.hoisted(() => ({
  createToken: vi.fn(),
  verifyCode: vi.fn(),
  getResetTokenEmail: vi.fn(),
  consumeResetToken: vi.fn(),
}));

const emailServiceMock = vi.hoisted(() => ({
  sendPasswordRecoveryCode: vi.fn(),
}));

const hashPasswordMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/password-recovery", () => ({
  passwordRecoveryStore: passwordRecoveryStoreMock,
}));

vi.mock("@/lib/email-service", () => ({
  emailService: emailServiceMock,
}));

vi.mock("@/lib/auth", () => ({
  isValidEmail: (email: string) => /@/.test(email),
  isValidPassword: (password: string) => password.length >= 8,
  hashPassword: hashPasswordMock,
}));

describe("POST /api/auth/password-recovery/*", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("request", () => {
    it("validates the email payload", async () => {
      const response = await requestCode(createJsonRequest(
        "/api/auth/password-recovery/request",
        {}
      ));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Email is required" });
    });

    it("returns 404 when the email is not registered", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      const response = await requestCode(createJsonRequest(
        "/api/auth/password-recovery/request",
        { email: "missing@example.com" }
      ));

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "The introduced email doesn't match the one registered in your account",
      });
    });

    it("sends a recovery code for a valid account", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ email: "victor@example.com" });
      passwordRecoveryStoreMock.createToken.mockReturnValueOnce("ABC123");
      emailServiceMock.sendPasswordRecoveryCode.mockResolvedValueOnce(true);

      const response = await requestCode(createJsonRequest(
        "/api/auth/password-recovery/request",
        { email: "victor@example.com" }
      ));

      expect(passwordRecoveryStoreMock.createToken).toHaveBeenCalledWith("victor@example.com");
      expect(emailServiceMock.sendPasswordRecoveryCode).toHaveBeenCalledWith(
        "victor@example.com",
        "ABC123"
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: "Recovery code sent to your email" });
    });

    it("returns 500 when the email cannot be delivered", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ email: "victor@example.com" });
      passwordRecoveryStoreMock.createToken.mockReturnValueOnce("ABC123");
      emailServiceMock.sendPasswordRecoveryCode.mockResolvedValueOnce(false);

      const response = await requestCode(createJsonRequest(
        "/api/auth/password-recovery/request",
        { email: "victor@example.com" }
      ));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "The current email isn't valid. Please try again later.",
      });
    });
  });

  describe("verify-code", () => {
    it("returns 400 when the code is missing", async () => {
      const response = await verifyCode(createJsonRequest(
        "/api/auth/password-recovery/verify-code",
        { email: "victor@example.com" }
      ));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Code is required" });
    });

    it("returns 401 for an invalid recovery code", async () => {
      passwordRecoveryStoreMock.verifyCode.mockReturnValueOnce(null);

      const response = await verifyCode(createJsonRequest(
        "/api/auth/password-recovery/verify-code",
        { email: "victor@example.com", code: "ABC123" }
      ));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "The introduced code isn't correct. Please try again.",
      });
    });

    it("returns a reset token for a valid recovery code", async () => {
      passwordRecoveryStoreMock.verifyCode.mockReturnValueOnce("reset-token");

      const response = await verifyCode(createJsonRequest(
        "/api/auth/password-recovery/verify-code",
        { email: "victor@example.com", code: "ABC123" }
      ));

      expect(passwordRecoveryStoreMock.verifyCode).toHaveBeenCalledWith(
        "ABC123",
        "victor@example.com"
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: "Code verified successfully",
        resetToken: "reset-token",
      });
    });
  });

  describe("reset", () => {
    it("validates the reset payload", async () => {
      const response = await resetPassword(createJsonRequest(
        "/api/auth/password-recovery/reset",
        { password: "newpassword", passwordConfirm: "newpassword" }
      ));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Reset token is required" });
    });

    it("rejects mismatched passwords", async () => {
      const response = await resetPassword(createJsonRequest(
        "/api/auth/password-recovery/reset",
        {
          resetToken: "reset-token",
          password: "newpassword",
          passwordConfirm: "different",
        }
      ));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "The passwords don't match. Please type them again.",
      });
    });

    it("returns 401 when the reset token is invalid", async () => {
      passwordRecoveryStoreMock.getResetTokenEmail.mockReturnValueOnce(null);

      const response = await resetPassword(createJsonRequest(
        "/api/auth/password-recovery/reset",
        {
          resetToken: "reset-token",
          password: "newpassword",
          passwordConfirm: "newpassword",
        }
      ));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "The recovery session is invalid or expired. Please request a new recovery code.",
      });
    });

    it("updates the password and consumes the reset token", async () => {
      passwordRecoveryStoreMock.getResetTokenEmail.mockReturnValueOnce("victor@example.com");
      hashPasswordMock.mockResolvedValueOnce("hashed-password");
      prismaMock.user.findUnique.mockResolvedValueOnce({ email: "victor@example.com" });

      const response = await resetPassword(createJsonRequest(
        "/api/auth/password-recovery/reset",
        {
          resetToken: "reset-token",
          password: "newpassword",
          passwordConfirm: "newpassword",
        }
      ));

      expect(hashPasswordMock).toHaveBeenCalledWith("newpassword");
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { email: "victor@example.com" },
        data: { password: "hashed-password" },
      });
      expect(passwordRecoveryStoreMock.consumeResetToken).toHaveBeenCalledWith("reset-token");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: "Your password has been changed successfully",
      });
    });
  });
});