import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/check/route";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

describe("GET /api/auth/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current session user", async () => {
    getSessionMock.mockResolvedValue("victor");

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: "victor" });
  });

  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 500 when session lookup fails", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(new NextRequest("http://localhost/api/auth/check"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An error occurred" });
  });
});