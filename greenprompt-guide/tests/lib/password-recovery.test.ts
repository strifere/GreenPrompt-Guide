import { afterEach, describe, expect, it, vi } from "vitest";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { emailVerificationStore } from "@/lib/email-verification";

describe("lib/password-recovery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("creates a code and verifies it once", () => {
    const email = "victor@example.com";
    const code = passwordRecoveryStore.createToken(email);

    expect(passwordRecoveryStore.isCodeValid(code, email)).toBe(true);

    const resetToken = passwordRecoveryStore.verifyCode(code, email);

    expect(resetToken).toEqual(expect.any(String));
    expect(passwordRecoveryStore.isCodeValid(code, email)).toBe(false);
    expect(passwordRecoveryStore.getResetTokenEmail(resetToken as string)).toBe(email);
  });

  it("rejects invalid or mismatched recovery codes", () => {
    const code = passwordRecoveryStore.createToken("victor@example.com");

    expect(passwordRecoveryStore.verifyCode(code, "other@example.com")).toBeNull();
    expect(passwordRecoveryStore.verifyCode("missing", "victor@example.com")).toBeNull();
  });

  it("expires recovery codes and reset tokens over time", () => {
    const now = Date.now();
    const dateSpy = vi.spyOn(Date, "now");
    dateSpy.mockReturnValue(now);

    const code = passwordRecoveryStore.createToken("victor@example.com");

    dateSpy.mockReturnValue(now + 16 * 60 * 1000);

    expect(passwordRecoveryStore.verifyCode(code, "victor@example.com")).toBeNull();
    expect(passwordRecoveryStore.isCodeValid(code, "victor@example.com")).toBe(false);
  });

  it("consumes reset tokens", () => {
    const code = passwordRecoveryStore.createToken("victor@example.com");
    const resetToken = passwordRecoveryStore.verifyCode(code, "victor@example.com");

    expect(passwordRecoveryStore.getResetTokenEmail(resetToken as string)).toBe("victor@example.com");

    passwordRecoveryStore.consumeResetToken(resetToken as string);

    expect(passwordRecoveryStore.getResetTokenEmail(resetToken as string)).toBeNull();
  });

  it("expires reset tokens and invalidates them by email", () => {
    const now = Date.now();
    const dateSpy = vi.spyOn(Date, "now");
    dateSpy.mockReturnValue(now);

    const resetToken = passwordRecoveryStore.createResetToken("victor@example.com");

    expect(passwordRecoveryStore.getResetTokenEmail(resetToken)).toBe("victor@example.com");
    expect(passwordRecoveryStore.isResetTokenValid(resetToken, "victor@example.com")).toBe(true);

    dateSpy.mockReturnValue(now + 16 * 60 * 1000);

    expect(passwordRecoveryStore.getResetTokenEmail(resetToken)).toBeNull();
    expect(passwordRecoveryStore.isResetTokenValid(resetToken, "victor@example.com")).toBe(false);
  });

  it("delegates expiry lookup to the email verification store", () => {
    const expirySpy = vi.spyOn(emailVerificationStore, "getTimeUntilExpiryByCode").mockReturnValue(42);

    expect(passwordRecoveryStore.getTimeUntilExpiry("ABC123")).toBe(42);
    expect(expirySpy).toHaveBeenCalledWith("ABC123");
  });

  it("cleans up expired reset tokens and runs the scheduled cleanup callback", async () => {
    vi.useFakeTimers();

    const now = Date.now();
    const dateSpy = vi.spyOn(Date, "now");
    dateSpy.mockReturnValue(now);

    vi.resetModules();
    const { passwordRecoveryStore: freshPasswordRecoveryStore } = await import("@/lib/password-recovery");

    const cleanupSpy = vi.spyOn(freshPasswordRecoveryStore, "cleanup");
    const resetToken = freshPasswordRecoveryStore.createResetToken("victor@example.com");

    dateSpy.mockReturnValue(now + 16 * 60 * 1000);

    freshPasswordRecoveryStore.cleanup();

    expect(cleanupSpy).toHaveBeenCalled();
    expect(freshPasswordRecoveryStore.getResetTokenEmail(resetToken)).toBeNull();

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(cleanupSpy).toHaveBeenCalled();
  });
});