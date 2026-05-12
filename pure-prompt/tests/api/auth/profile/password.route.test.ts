import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session");
vi.mock("@/lib/auth");
vi.mock("@/domain/user-repository", () => ({
  getUserByUsernameWithPassword: vi.fn(),
  updatePassword: vi.fn(),
}));

import { POST } from "@/app/api/auth/profile/password/route";
import { hashPassword, isValidPassword, verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import {
  getUserByUsernameWithPassword,
  updatePassword,
} from "@/domain/user-repository";

describe("POST /api/auth/profile/password", () => {
  const mockGetSession = getSession as any;
  const mockHashPassword = hashPassword as any;
  const mockIsValidPassword = isValidPassword as any;
  const mockVerifyPassword = verifyPassword as any;
  const mockGetUserByUsernameWithPassword = getUserByUsernameWithPassword as any;
  const mockUpdatePassword = updatePassword as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "All fields are required" });
  });

  it("returns 400 when passwords do not match", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "newpass123",
        passwordConfirm: "different",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Passwords do not match" });
  });

  it("returns 400 when the new password is too short", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(false);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "short",
        passwordConfirm: "short",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Password must be at least 8 characters",
    });
  });

  it("returns 404 when the repository cannot find the current user", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(true);
    mockGetUserByUsernameWithPassword.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(mockGetUserByUsernameWithPassword).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 401 when the current password is incorrect", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(true);
    mockGetUserByUsernameWithPassword.mockResolvedValueOnce({
      username: "currentuser",
      email: "user@example.com",
      role: "user",
      password: "hashedoldpass",
    });
    mockVerifyPassword.mockResolvedValueOnce(false);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "wrongpass",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(mockVerifyPassword).toHaveBeenCalledWith("wrongpass", "hashedoldpass");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Current password is incorrect" });
  });

  it("returns 400 when the new password is the same as the current password", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(true);
    mockGetUserByUsernameWithPassword.mockResolvedValueOnce({
      username: "currentuser",
      email: "user@example.com",
      role: "user",
      password: "hashedoldpass",
    });
    // First call verifies the provided current password; second call checks
    // whether the candidate new password matches the stored hash. Both should
    // return true to simulate the 'new equals current' case.
    mockVerifyPassword.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "oldpass123",
        passwordConfirm: "oldpass123",
      }),
    }));

    expect(mockVerifyPassword).toHaveBeenCalledWith("oldpass123", "hashedoldpass");
    // The second verify compares the candidate new password
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "New password must be different from the current password" });
  });

  it("updates the password after validating the current one", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(true);
    mockGetUserByUsernameWithPassword.mockResolvedValueOnce({
      username: "currentuser",
      email: "user@example.com",
      role: "user",
      password: "hashedoldpass",
    });
    mockVerifyPassword.mockResolvedValueOnce(true);
    mockHashPassword.mockResolvedValueOnce("hashednewpass");
    mockUpdatePassword.mockResolvedValueOnce();

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(mockHashPassword).toHaveBeenCalledWith("newpass123");
    expect(mockUpdatePassword).toHaveBeenCalledWith({
      username: "currentuser",
      hashedPassword: "hashednewpass",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Password updated successfully",
    });
  });

  it("returns 500 when the repository throws", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidPassword.mockReturnValueOnce(true);
    mockGetUserByUsernameWithPassword.mockRejectedValueOnce(new Error("Database error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "oldpass123",
        password: "newpass123",
        passwordConfirm: "newpass123",
      }),
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "An error occurred while updating the password",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Password update error:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
