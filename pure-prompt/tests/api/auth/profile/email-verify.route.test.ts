import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma");
vi.mock("@/lib/session");
vi.mock("@/lib/auth");
vi.mock("@/lib/password-recovery");

import { POST } from "@/app/api/auth/profile/email/verify/route";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { NextRequest } from "next/server";

describe("POST /api/auth/profile/email/verify", () => {
  const mockGetSession = getSession as any;
  const mockPrisma = prisma as any;
  const mockIsValidEmail = isValidEmail as any;
  const mockPasswordRecoveryStore = passwordRecoveryStore as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user = {
      findUnique: vi.fn(),
      update: vi.fn(),
    };
    mockPrisma.emailVerificationToken = {
      findUnique: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
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
        body: JSON.stringify({
          email: "",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Email is required" });
    });

    it("should return 400 when email is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: 123,
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Email is required" });
    });

    it("should trim whitespace from email", async () => {
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPasswordRecoveryStore.consumeResetToken.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "  newemail@example.com  ",
          code: "ABC123",
        }),
      });

      await POST(request);

      expect(mockIsValidEmail).toHaveBeenCalledWith("newemail@example.com");
    });

    it("should return 400 when email is only whitespace", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "   ",
          code: "ABC123",
        }),
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
        body: JSON.stringify({
          email: "invalidemail",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid email format" });
    });
  });

  describe("Code Input Validation", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 400 when code is empty string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Code is required" });
    });

    it("should return 400 when code is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: 123,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Code is required" });
    });

    it("should trim and uppercase code", async () => {
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPasswordRecoveryStore.consumeResetToken.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "  abc123  ",
        }),
      });

      await POST(request);

      expect(mockPasswordRecoveryStore.verifyCode).toHaveBeenCalledWith(
        "ABC123",
        "newemail@example.com"
      );
    });

    it("should return 400 when code is only whitespace", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "   ",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Code is required" });
    });
  });

  describe("Code Verification", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
    });

    it("should return 401 when code is invalid", async () => {
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "INVALID",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: "The introduced code isn't correct. Please try again.",
      });
    });

    it("should not update email when code is invalid", async () => {
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "INVALID",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("Current User Verification", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    });

    it("should return 404 when current user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should query current user with correct parameters", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPasswordRecoveryStore.consumeResetToken.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { username: "currentuser" },
        select: { email: true },
      });
    });
  });

  describe("Email Already Registered - Different User", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    });

    it("should return 409 when email is registered to different user", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce({ username: "anotheruser" });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "registered@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({ error: "Email already registered" });
    });

    it("should not update email when registered to different user", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce({ username: "anotheruser" });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "registered@example.com",
          code: "ABC123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should allow same email for same user", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "newemail@example.com" })
        .mockResolvedValueOnce({ username: "currentuser" });
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPasswordRecoveryStore.consumeResetToken.mockReturnValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe("Successful Email Update", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPasswordRecoveryStore.consumeResetToken.mockReturnValueOnce(null);
    });

    it("should update email successfully", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: "Email updated successfully",
        user: { email: "newemail@example.com" },
      });
    });

    it("should update database with correct parameters", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { username: "currentuser" },
        data: { email: "newemail@example.com" },
      });
    });

    it("should consume reset token after successful update", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      await POST(request);

      expect(mockPasswordRecoveryStore.consumeResetToken).toHaveBeenCalledWith(
        "RESET_TOKEN"
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidEmail.mockReturnValueOnce(true);
      mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    });

    it("should return 500 on database error during current user lookup", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "An error occurred. Please try again." });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change verify error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on database error during email check", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockRejectedValueOnce(new Error("Database error"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on update error", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ email: "oldemail@example.com" })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockRejectedValueOnce(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          email: "newemail@example.com",
          code: "ABC123",
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });
  });
});
