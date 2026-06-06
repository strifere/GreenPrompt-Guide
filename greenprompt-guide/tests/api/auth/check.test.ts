import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/check/route";

const getSessionMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());
const clearSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  clearSession: clearSessionMock,
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: getUserByUsernameMock,
}));

describe("GET /api/auth/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current session user", async () => {
    getSessionMock.mockResolvedValue("victor");
    getUserByUsernameMock.mockResolvedValue({
      username: "victor",
      email: "victor@example.com",
      role: "ADMIN",
    });

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: "victor",
      role: "ADMIN",
    });
  });

  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 404 when the user no longer exists", async () => {
    getSessionMock.mockResolvedValue("victor");
    getUserByUsernameMock.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 403 and clears the session when the user is banned", async () => {
    getSessionMock.mockResolvedValue("victor");
    getUserByUsernameMock.mockResolvedValue({
      username: "victor",
      email: "victor@example.com",
      role: "ADMIN",
      banned: true,
    });

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(clearSessionMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "This account is currently banned and cannot be used" });
  });

  it("returns 500 when session lookup fails", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An error occurred" });
  });

  it("returns 404 when the session user does not exist", async () => {
    getSessionMock.mockResolvedValue("victor");
    getUserByUsernameMock.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });
});