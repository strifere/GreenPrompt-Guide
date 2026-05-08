import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma");
vi.mock("@/lib/session");

import { POST } from "@/app/api/auth/profile/username/route";
import { getSession, createSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

describe("POST /api/auth/profile/username", () => {
  const mockGetSession = getSession as any;
  const mockPrisma = prisma as any;
  const mockCreateSessionCookie = createSessionCookie as any;

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
        body: JSON.stringify({ username: "newusername" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Not authenticated" });
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 400 when username is empty string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Username is required" });
    });

    it("should return 400 when username is not a string", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Username is required" });
    });

    it("should trim whitespace from username", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        username: "newusername",
        email: "user@example.com",
      });
      mockCreateSessionCookie.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "  newusername  " }),
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { username: "newusername" },
        })
      );
    });

    it("should return 400 when username is only whitespace", async () => {
      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "   " }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Username is required" });
    });
  });

  describe("Unchanged Username", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 200 when username is unchanged", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
      });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "currentuser" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Username unchanged");
      expect(data.user).toEqual({
        username: "currentuser",
        email: "user@example.com",
      });
    });

    it("should not update database when username is unchanged", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "currentuser",
        email: "user@example.com",
      });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "currentuser" }),
      });

      await POST(request);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return 404 when current user is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "currentuser" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "User not found" });
    });
  });

  describe("Username Already Taken", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 409 when username is already taken", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "takenusername",
      }); // User with this username exists

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "takenusername" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({ error: "Username already taken" });
    });

    it("should not update database when username is taken", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        username: "existinguser",
      });

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "existinguser" }),
      });

      await POST(request);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("Successful Username Update", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should update username successfully", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        username: "newusername",
        email: "user@example.com",
      });
      mockCreateSessionCookie.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "newusername" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Username updated successfully");
      expect(data.user).toEqual({
        username: "newusername",
        email: "user@example.com",
      });
    });

    it("should call prisma.user.update with correct parameters", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        username: "newusername",
        email: "user@example.com",
      });
      mockCreateSessionCookie.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "newusername" }),
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { username: "currentuser" },
        data: { username: "newusername" },
        select: { username: true, email: true },
      });
    });

    it("should create new session cookie after username update", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        username: "newusername",
        email: "user@example.com",
      });
      mockCreateSessionCookie.mockResolvedValueOnce(null);

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "newusername" }),
      });

      await POST(request);

      expect(mockCreateSessionCookie).toHaveBeenCalledWith("newusername");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValueOnce("currentuser");
    });

    it("should return 500 on database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "newusername" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An error occurred while updating the username",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Username update error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on update error", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockRejectedValueOnce(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new NextRequest(new URL("http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify({ username: "newusername" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An error occurred while updating the username",
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
