import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma");
vi.mock("@/lib/session");

import { GET } from "@/app/api/auth/profile/route";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

describe("GET /api/auth/profile", () => {
  const mockGetSession = getSession as any;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user = {
      findUnique: vi.fn(),
    };
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Not authenticated" });
    });

    it("should not query database when user is not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      await GET();

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("User Lookup", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should query database with correct parameters", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      await GET();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "currentuser" },
        select: {
          username: true,
          email: true,
          role: true,
        },
      });
    });

    it("should return 404 when user is not found in database", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });
  });

  describe("Successful Profile Retrieval", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return user profile with correct structure", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: {
          username: "currentuser",
          email: "user@example.com",
          role: "user",
        },
      });
    });

    it("should return profile with admin role", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "adminuser",
        email: "admin@example.com",
        role: "admin",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe("admin");
    });

    it("should include username in response", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "testuser",
        email: "test@example.com",
        role: "user",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.user.username).toBe("testuser");
    });

    it("should include email in response", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.user.email).toBe("user@example.com");
    });

    it("should include role in response", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "moderator",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.user.role).toBe("moderator");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 500 on database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Database connection error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "An error occurred" });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Profile lookup error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle timeout errors gracefully", async () => {
      const timeoutError = new Error("Request timeout");
      mockPrisma.user.findUnique.mockRejectedValueOnce(timeoutError);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "An error occurred" });

      consoleErrorSpy.mockRestore();
    });

    it("should not expose sensitive error messages", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Password hash mismatch")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await GET();
      const data = await response.json();

      expect(data.error).toBe("An error occurred");
      expect(data.error).not.toContain("hash");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Session Verification", () => {
    it("should get session exactly once", async () => {
      mockGetSession.mockResolvedValueOnce("currentuser");
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      await GET();

      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it("should handle session with special characters", async () => {
      mockGetSession.mockResolvedValueOnce("user@domain.com");
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "user@domain.com",
        email: "user@example.com",
        role: "user",
      });

      const response = await GET();
      await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "user@domain.com" },
        select: {
          username: true,
          email: true,
          role: true,
        },
      });
    });
  });

  describe("Response Headers", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return JSON response", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      const response = await GET();

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Multiple Requests", () => {
    it("should handle multiple consecutive requests", async () => {
      mockGetSession
        .mockResolvedValueOnce("user1")
        .mockResolvedValueOnce("user2");

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          username: "user1",
          email: "user1@example.com",
          role: "user",
        })
        .mockResolvedValueOnce({
          username: "user2",
          email: "user2@example.com",
          role: "user",
        });

      const response1 = await GET();
      const data1 = await response1.json();

      const response2 = await GET();
      const data2 = await response2.json();

      expect(data1.user.username).toBe("user1");
      expect(data2.user.username).toBe("user2");
      expect(mockGetSession).toHaveBeenCalledTimes(2);
    });
  });

  describe("Field Selection", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should only select required fields from database", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      });

      await GET();

      const callArgs = mockPrisma.user.findUnique.mock.calls[0][0];
      expect(callArgs.select).toEqual({
        username: true,
        email: true,
        role: true,
      });

      // Verify it's not selecting password or other sensitive fields
      expect(callArgs.select).not.toHaveProperty("password");
    });
  });
});
