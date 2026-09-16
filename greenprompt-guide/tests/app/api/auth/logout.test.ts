import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

const clearSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  clearSession: clearSessionMock,
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the session and returns success", async () => {
    const response = await POST(new NextRequest("http://localhost/api/auth/logout", { method: "POST" }));

    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Logged out successfully" });
  });

  it("returns 500 when clearing the session fails", async () => {
    clearSessionMock.mockRejectedValueOnce(new Error("boom"));

    const response = await POST(new NextRequest("http://localhost/api/auth/logout", { method: "POST" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An error occurred during logout" });
  });
});