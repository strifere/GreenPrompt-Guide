import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/session");
vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: vi.fn(),
}));

import { GET } from "@/app/api/auth/profile/route";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";

describe("GET /api/auth/profile", () => {
  const mockGetSession = getSession as any;
  const mockGetUserByUsername = getUserByUsername as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
    expect(mockGetUserByUsername).not.toHaveBeenCalled();
  });

  it("returns 404 when the repository does not find a user", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockGetUserByUsername.mockResolvedValueOnce(null);

    const response = await GET();

    expect(mockGetUserByUsername).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns the current profile when the repository resolves a user", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockGetUserByUsername.mockResolvedValueOnce({
      username: "currentuser",
      email: "user@example.com",
      role: "user",
    });

    const response = await GET();

    expect(mockGetUserByUsername).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      },
    });
  });

  it("returns 500 when the repository throws", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockGetUserByUsername.mockRejectedValueOnce(new Error("Database connection error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An error occurred" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Profile lookup error:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
