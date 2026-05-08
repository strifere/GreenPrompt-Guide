import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma");
vi.mock("@/lib/session");
vi.mock("@/lib/auth");

import { POST } from "@/app/api/auth/profile/password/route";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidPassword,
  verifyPassword,
} from "@/lib/auth";
import { NextRequest } from "next/server";

describe("POST /api/auth/profile/password", () => {
  const mockGetSession = getSession as any;
  const mockPrisma = prisma as any;
  const mockHashPassword = hashPassword as any;
  const mockIsValidPassword = isValidPassword as any;
  const mockVerifyPassword = verifyPassword as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user = {
      findUnique: vi.fn(),
      update: vi.fn(),
    };
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Not authenticated" });
    });
  });

  describe("Input Validation - Required Fields", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 400 when currentPassword is missing", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });

    it("should return 400 when currentPassword is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: 123,
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });

    it("should return 400 when password is missing", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });

    it("should return 400 when password is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: 123,
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });

    it("should return 400 when passwordConfirm is missing", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });

    it("should return 400 when passwordConfirm is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: 123,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "All fields are required" });
    });
  });

  describe("Password Match Validation", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 400 when passwords do not match", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "differentpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Passwords do not match" });
    });

    it("should not validate password format when passwords don't match", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "short",
          passwordConfirm: "different",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Passwords do not match" });
      expect(mockIsValidPassword).not.toHaveBeenCalled();
    });
  });

  describe("Password Format Validation", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 400 when password is less than 8 characters", async () => {
      mockIsValidPassword.mockReturnValueOnce(false);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "short",
          passwordConfirm: "short",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Password must be at least 8 characters",
      });
    });

    it("should validate new password format", async () => {
      mockIsValidPassword.mockReturnValueOnce(true);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockResolvedValueOnce("hashednewpass");
      mockPrisma.user.update.mockResolvedValueOnce({});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockIsValidPassword).toHaveBeenCalledWith("newpass123");
    });
  });

  describe("Current User Lookup", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidPassword.mockReturnValueOnce(true);
    });

    it("should return 404 when current user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });

    it("should query database with correct parameters", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockResolvedValueOnce("hashednewpass");
      mockPrisma.user.update.mockResolvedValueOnce({});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "currentuser" },
      });
    });
  });

  describe("Current Password Verification", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidPassword.mockReturnValueOnce(true);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
    });

    it("should return 401 when current password is incorrect", async () => {
      mockVerifyPassword.mockResolvedValueOnce(false);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "wrongpass",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Current password is incorrect" });
    });

    it("should verify current password with correct parameters", async () => {
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockResolvedValueOnce("hashednewpass");
      mockPrisma.user.update.mockResolvedValueOnce({});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockVerifyPassword).toHaveBeenCalledWith(
        "oldpass123",
        "hashedoldpass"
      );
    });

    it("should not update password when current password is incorrect", async () => {
      mockVerifyPassword.mockResolvedValueOnce(false);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "wrongpass",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("Successful Password Update", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidPassword.mockReturnValueOnce(true);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockResolvedValueOnce("hashednewpass");
      mockPrisma.user.update.mockResolvedValueOnce({});
    });

    it("should update password successfully", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: "Password updated successfully",
      });
    });

    it("should hash new password before updating", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockHashPassword).toHaveBeenCalledWith("newpass123");
    });

    it("should update user with hashed password", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { username: "currentuser" },
        data: { password: "hashednewpass" },
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockIsValidPassword.mockReturnValueOnce(true);
    });

    it("should return 500 on database error during user lookup", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An error occurred while updating the password",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Password update error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on update error", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockResolvedValueOnce("hashednewpass");
      mockPrisma.user.update.mockRejectedValueOnce(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An error occurred while updating the password",
      });

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on hash error", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        password: "hashedoldpass",
      });
      mockVerifyPassword.mockResolvedValueOnce(true);
      mockHashPassword.mockRejectedValueOnce(new Error("Hash error"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass123",
          password: "newpass123",
          passwordConfirm: "newpass123",
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });
  });
});
