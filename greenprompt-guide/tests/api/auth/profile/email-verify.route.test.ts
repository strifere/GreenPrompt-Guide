import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session");
vi.mock("@/lib/auth");
vi.mock("@/lib/password-recovery");
vi.mock("@/domain/user-repository", () => ({
  getUserEmailByUsername: vi.fn(),
  getUserByEmail: vi.fn(),
  updateEmail: vi.fn(),
}));

import { POST } from "@/app/api/auth/profile/email/verify/route";
import { isValidEmail } from "@/lib/auth";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { getSession } from "@/lib/session";
import {
  getUserByEmail,
  getUserEmailByUsername,
  updateEmail,
} from "@/domain/user-repository";

describe("POST /api/auth/profile/email/verify", () => {
  const mockGetSession = getSession as any;
  const mockIsValidEmail = isValidEmail as any;
  const mockPasswordRecoveryStore = passwordRecoveryStore as any;
  const mockGetUserEmailByUsername = getUserEmailByUsername as any;
  const mockGetUserByEmail = getUserByEmail as any;
  const mockUpdateEmail = updateEmail as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", code: "ABC123" }),
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 400 for missing email or code", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "", code: "" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Email is required" });
  });

  it("returns 401 when the verification code is invalid", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", code: "ABC123" }),
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "The introduced code isn't correct. Please try again.",
    });
    expect(mockUpdateEmail).not.toHaveBeenCalled();
  });

  it("returns 404 when the current user cannot be found", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    mockGetUserEmailByUsername.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", code: "ABC123" }),
    }));

    expect(mockGetUserEmailByUsername).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 409 when the new email belongs to another user", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "current@example.com" });
    mockGetUserByEmail.mockResolvedValueOnce({
      username: "anotheruser",
      email: "new@example.com",
      role: "user",
      password: "hashed",
    });

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", code: "ABC123" }),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
    expect(mockUpdateEmail).not.toHaveBeenCalled();
  });

  it("updates the email and consumes the reset token", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockPasswordRecoveryStore.verifyCode.mockReturnValueOnce("RESET_TOKEN");
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "current@example.com" });
    mockGetUserByEmail.mockResolvedValueOnce(null);
    mockUpdateEmail.mockResolvedValueOnce({
      username: "currentuser",
      email: "new@example.com",
      role: "user",
    });

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", code: "abc123" }),
    }));

    expect(mockPasswordRecoveryStore.verifyCode).toHaveBeenCalledWith(
      "ABC123",
      "new@example.com"
    );
    expect(mockUpdateEmail).toHaveBeenCalledWith({
      username: "currentuser",
      newEmail: "new@example.com",
    });
    expect(mockPasswordRecoveryStore.consumeResetToken).toHaveBeenCalledWith("RESET_TOKEN");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Email updated successfully",
      user: { email: "new@example.com" },
    });
  });
});
