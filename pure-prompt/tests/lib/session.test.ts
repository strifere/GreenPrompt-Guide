import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

const cookiesMock = vi.hoisted(() => vi.fn(async () => cookieStore));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { clearSession, createSessionCookie, getSession } from "@/lib/session";

describe("lib/session", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCookieSecure = process.env.COOKIE_SECURE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.COOKIE_SECURE = originalCookieSecure;
  });

  it("sets an insecure cookie when COOKIE_SECURE=false", async () => {
    process.env.COOKIE_SECURE = "false";

    await createSessionCookie("victor");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "auth-session",
      "victor",
      expect.objectContaining({ secure: false, httpOnly: true, sameSite: "lax", path: "/" })
    );
  });

  it("defaults to secure cookies in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.COOKIE_SECURE;

    await createSessionCookie("victor");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "auth-session",
      "victor",
      expect.objectContaining({ secure: true })
    );
  });

  it("reads the session cookie", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "victor" });

    await expect(getSession()).resolves.toBe("victor");
  });

  it("clears the session cookie", async () => {
    await clearSession();

    expect(cookieStore.delete).toHaveBeenCalledWith("auth-session");
  });
});