import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../app/api/auth/signup/request-email-verification/route";

vi.mock("@/domain/user-repository", () => ({
  isUsernameAvailable: vi.fn(),
  isEmailAvailable: vi.fn(),
}));

vi.mock("@/lib/email-service", () => ({
  emailService: { sendSignupVerificationCode: vi.fn() },
}));

vi.mock("@/lib/email-verification", () => ({
  emailVerificationStore: { createCode: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  isValidEmail: vi.fn(),
  isValidPassword: vi.fn(),
}));

import { isUsernameAvailable, isEmailAvailable } from "@/domain/user-repository";
import { emailService } from "@/lib/email-service";
import { emailVerificationStore } from "@/lib/email-verification";
import { isValidEmail, isValidPassword } from "@/lib/auth";

function makeReq(body: unknown) {
  return { json: async () => body } as unknown as Request;
}

describe("POST /api/auth/signup/request-email-verification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (isUsernameAvailable as any).mockResolvedValue(true);
    (isEmailAvailable as any).mockResolvedValue(true);
    (emailVerificationStore.createCode as any).mockReturnValue("CODE123");
    (emailService.sendSignupVerificationCode as any).mockResolvedValue(true);
    (isValidEmail as any).mockReturnValue(true);
    (isValidPassword as any).mockReturnValue(true);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeReq({ username: "user" } as any));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/all fields are required/i);
  });

  it("returns 400 for invalid email format", async () => {
    (isValidEmail as any).mockReturnValue(false);
    const body = { username: "u", email: "bad", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid email format/i);
  });

  it("returns 400 for invalid password", async () => {
    (isValidPassword as any).mockReturnValue(false);
    const body = { username: "u", email: "a@b.com", password: "short", passwordConfirm: "short" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/password must be at least 8 characters/i);
  });

  it("returns 400 when passwords do not match", async () => {
    const body = { username: "u", email: "a@b.com", password: "password1", passwordConfirm: "different" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/passwords do not match/i);
  });

  it("returns 409 when username is taken", async () => {
    (isUsernameAvailable as any).mockResolvedValue(false);
    const body = { username: "taken", email: "a@b.com", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/username already taken/i);
  });

  it("returns 409 when email is already registered", async () => {
    (isEmailAvailable as any).mockResolvedValue(false);
    const body = { username: "u", email: "a@b.com", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/email already registered/i);
  });

  it("returns 500 when email service fails", async () => {
    (emailService.sendSignupVerificationCode as any).mockResolvedValue(false);
    const body = { username: "u", email: "a@b.com", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/current email isn't valid/i);
  });

  it("returns 200 on success", async () => {
    const body = { username: "u", email: "a@b.com", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/verification code sent/i);
    expect(emailVerificationStore.createCode).toHaveBeenCalledWith("a@b.com");
    expect(emailService.sendSignupVerificationCode).toHaveBeenCalledWith("a@b.com", "CODE123");
  });

  it("returns generic 500 when an unexpected exception occurs", async () => {
    (isUsernameAvailable as any).mockImplementation(() => { throw new Error("boom"); });
    const body = { username: "u", email: "a@b.com", password: "password1", passwordConfirm: "password1" };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/an error occurred/i);
  });
});
