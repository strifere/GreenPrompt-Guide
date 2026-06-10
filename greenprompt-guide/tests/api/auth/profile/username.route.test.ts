import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: vi.fn(),
  isUsernameAvailable: vi.fn(),
  updateUsername: vi.fn(),
}));

import { POST } from "@/app/api/auth/profile/username/route";
import { createSessionCookie, getSession } from "@/lib/session";
import {
  getUserByUsername,
  isUsernameAvailable,
  updateUsername,
} from "@/domain/user-repository";

describe("POST /api/auth/profile/username", () => {
  const mockGetSession = getSession as any;
  const mockCreateSessionCookie = createSessionCookie as any;
  const mockGetUserByUsername = getUserByUsername as any;
  const mockIsUsernameAvailable = isUsernameAvailable as any;
  const mockUpdateUsername = updateUsername as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "newusername" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
    expect(mockGetUserByUsername).not.toHaveBeenCalled();
  });

  it("returns 400 when username is missing or whitespace", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "   " }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Username is required" });
  });

  it("returns 200 when the username is unchanged", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockGetUserByUsername.mockResolvedValueOnce({
      username: "currentuser",
      email: "user@example.com",
      role: "user",
    });

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "currentuser" }),
    }));

    expect(mockGetUserByUsername).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Username unchanged",
      user: {
        username: "currentuser",
        email: "user@example.com",
        role: "user",
      },
    });
  });

  it("returns 409 when the username is already taken", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsUsernameAvailable.mockResolvedValueOnce(false);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "takenusername" }),
    }));

    expect(mockIsUsernameAvailable).toHaveBeenCalledWith("takenusername");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Username already taken" });
  });

  it("updates the username and refreshes the session cookie", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsUsernameAvailable.mockResolvedValueOnce(true);
    mockUpdateUsername.mockResolvedValueOnce({
      username: "newusername",
      email: "user@example.com",
    });

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "  newusername  " }),
    }));

    expect(mockIsUsernameAvailable).toHaveBeenCalledWith("newusername");
    expect(mockUpdateUsername).toHaveBeenCalledWith({
      currentUsername: "currentuser",
      newUsername: "newusername",
    });
    expect(mockCreateSessionCookie).toHaveBeenCalledWith("newusername");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Username updated successfully",
      user: {
        username: "newusername",
        email: "user@example.com",
      },
    });
  });

  it("returns 500 when the repository throws", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsUsernameAvailable.mockRejectedValueOnce(new Error("Database error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ username: "newusername" }),
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "An error occurred while updating the username",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Username update error:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
