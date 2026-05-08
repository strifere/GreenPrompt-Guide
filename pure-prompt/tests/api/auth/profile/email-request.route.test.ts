import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma");
vi.mock("@/lib/session");
vi.mock("@/lib/auth");
vi.mock("@/lib/password-recovery");
vi.mock("@/lib/email-service");

import { POST } from "@/app/api/auth/profile/email/request/route";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { emailService } from "@/lib/email-service";
import { NextRequest } from "next/server";

describe("POST /api/auth/profile/email/request", () => {
  const mockGetSession = getSession as any;
  const mockPrisma = prisma as any;
  const mockIsValidEmail = isValidEmail as any;
  const mockPasswordRecoveryStore = passwordRecoveryStore as any;
  const mockEmailService = emailService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user = {
      findUnique: vi.fn(),
    };
    mockPrisma.emailVerificationToken = {
      create: vi.fn(),
    };
    mockEmailService.sendEmailChangeVerificationCode = vi.fn();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Not authenticated" });
    });
  });

  describe("Email Input Validation", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 400 when email is empty string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Email is required" });
    });

    it("should return 400 when email is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Email is required" });
    });

    it("should trim whitespace from email", async () => {
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        true
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "  newemail@example.com  " }),
      });

      await POST(request);

      expect(mockIsValidEmail).toHaveBeenCalledWith("newemail@example.com");
    });

    it("should return 400 when email is only whitespace", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "   " }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Email is required" });
    });

    it("should return 400 when email format is invalid", async () => {
      mockIsValidEmail.mockReturnValueOnce(false);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "invalidemail" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid email format" });
    });
  });

  describe("Current User Verification", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 404 when current user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should query database with correct parameters", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        true
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "currentuser" },
        select: { email: true },
      });
    });
  });

  describe("Email Already Associated", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 400 when email is already associated with current account", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "sameemail@example.com",
      });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "sameemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "This email is already associated with your account",
      });
    });

    it("should not create token when email is already associated", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "sameemail@example.com",
      });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "sameemail@example.com" }),
      });

      await POST(request);

      expect(mockPasswordRecoveryStore.createToken).not.toHaveBeenCalled();
    });
  });

  describe("Email Already Registered", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 409 when email is already registered", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce({ username: "anotheruser" });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "registered@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({ error: "Email already registered" });
    });

    it("should not send email when email is already registered", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce({ username: "anotheruser" });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "registered@example.com" }),
      });

      await POST(request);

      expect(mockEmailService.sendEmailChangeVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe("Successful Email Change Request", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should send verification code successfully", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        true
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: "Verification code sent to your email",
      });
    });

    it("should create token with new email", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        true
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      await POST(request);

      expect(mockPasswordRecoveryStore.createToken).toHaveBeenCalledWith(
        "newemail@example.com"
      );
    });

    it("should send email with correct parameters", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        true
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      await POST(request);

      expect(
        mockEmailService.sendEmailChangeVerificationCode
      ).toHaveBeenCalledWith("newemail@example.com", "TOKEN123");
    });
  });

  describe("Email Service Failure", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 500 when email service fails", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(
        false
      );

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "The current email isn't valid. Please try again later.",
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 500 on database error during user lookup", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "An error occurred. Please try again." });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change request error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on email service error", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: "oldemail@example.com",
      });
      mockPasswordRecoveryStore.createToken.mockReturnValueOnce("TOKEN123");
      mockEmailService.sendEmailChangeVerificationCode.mockRejectedValueOnce(
        new Error("Email service error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ email: "newemail@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "An error occurred. Please try again." });

      consoleErrorSpy.mockRestore();
    });
  });
});
