import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session");
vi.mock("@/lib/auth");
vi.mock("@/lib/password-recovery");
vi.mock("@/lib/email-service");
vi.mock("@/domain/user-repository", () => ({
  getUserEmailByUsername: vi.fn(),
  isEmailAvailable: vi.fn(),
}));

import { POST } from "@/app/api/auth/profile/email/request/route";
import { isValidEmail } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { getSession } from "@/lib/session";
import { getUserEmailByUsername, isEmailAvailable } from "@/domain/user-repository";

describe("POST /api/auth/profile/email/request", () => {
  const mockGetSession = getSession as any;
  const mockIsValidEmail = isValidEmail as any;
  const mockPasswordRecoveryStore = passwordRecoveryStore as any;
  const mockEmailService = emailService as any;
  const mockGetUserEmailByUsername = getUserEmailByUsername as any;
  const mockIsEmailAvailable = isEmailAvailable as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "newemail@example.com" }),
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 400 when email is missing or invalid", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "invalidemail" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid email format" });
  });

  it("returns 404 when the current user cannot be found", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockGetUserEmailByUsername.mockResolvedValueOnce(null);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "newemail@example.com" }),
    }));

    expect(mockGetUserEmailByUsername).toHaveBeenCalledWith("currentuser");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 400 when the new email matches the current one", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "same@example.com" });

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "same@example.com" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "This email is already associated with your account",
    });
    expect(mockIsEmailAvailable).not.toHaveBeenCalled();
  });

  it("returns 409 when the new email is already registered", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "current@example.com" });
    mockIsEmailAvailable.mockResolvedValueOnce(false);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "taken@example.com" }),
    }));

    expect(mockIsEmailAvailable).toHaveBeenCalledWith("taken@example.com");
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email already registered" });
  });

  it("sends a verification code when the email is available", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "current@example.com" });
    mockIsEmailAvailable.mockResolvedValueOnce(true);
    mockPasswordRecoveryStore.createToken.mockReturnValueOnce("ABC123");
    mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(true);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com" }),
    }));

    expect(mockPasswordRecoveryStore.createToken).toHaveBeenCalledWith("new@example.com");
    expect(mockEmailService.sendEmailChangeVerificationCode).toHaveBeenCalledWith(
      "new@example.com",
      "ABC123"
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Verification code sent to your email",
    });
  });

  it("returns 500 when the email service fails", async () => {
    mockGetSession.mockResolvedValueOnce("currentuser");
    mockIsValidEmail.mockReturnValueOnce(true);
    mockGetUserEmailByUsername.mockResolvedValueOnce({ email: "current@example.com" });
    mockIsEmailAvailable.mockResolvedValueOnce(true);
    mockPasswordRecoveryStore.createToken.mockReturnValueOnce("ABC123");
    mockEmailService.sendEmailChangeVerificationCode.mockResolvedValueOnce(false);

    const response = await POST(new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com" }),
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "The current email isn't valid. Please try again later.",
    });
  });
});
