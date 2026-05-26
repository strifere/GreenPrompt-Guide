/**
 * In-memory store for password recovery tokens
 * In production, this should be stored in a database or Redis
 */

import { randomUUID } from "node:crypto";
import { emailVerificationStore } from "./email-verification";

interface ResetToken {
  email: string;
  expiresAt: number;
}

class PasswordRecoveryStore {
  private readonly resetTokens: Map<string, ResetToken> = new Map();
  private readonly RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Create a new recovery token for an email
   */
  createToken(email: string): string {
    return emailVerificationStore.createCode(email);
  }

  /**
   * Create a one-time reset token after the recovery code has been verified
   */
  createResetToken(email: string): string {
    const resetToken = randomUUID();

    this.resetTokens.set(resetToken, {
      email,
      expiresAt: Date.now() + this.RESET_TOKEN_EXPIRY_MS,
    });

    return resetToken;
  }

  /**
   * Verify a recovery code and invalidate it immediately on success
   */
  verifyCode(code: string, email: string): string | null {
    const codeClaimed = emailVerificationStore.claimCode(email, code);

    if (!codeClaimed) {
      return null;
    }

    return this.createResetToken(email);
  }

  /**
   * Read the email for a reset token without consuming it
   */
  getResetTokenEmail(resetToken: string): string | null {
    const token = this.resetTokens.get(resetToken);

    if (!token) {
      return null;
    }

    if (Date.now() > token.expiresAt) {
      this.resetTokens.delete(resetToken);
      return null;
    }

    return token.email;
  }

  /**
   * Consume a reset token (mark it as used)
   */
  consumeResetToken(resetToken: string): void {
    this.resetTokens.delete(resetToken);
  }

  /**
   * Check if a code is still valid (without consuming it)
   */
  isCodeValid(code: string, email: string): boolean {
    return emailVerificationStore.isCodeValid(email, code);
  }

  /**
   * Check if a reset token is still valid (without consuming it)
   */
  isResetTokenValid(resetToken: string, email: string): boolean {
    const token = this.resetTokens.get(resetToken);

    if (!token) {
      return false;
    }

    if (token.email !== email) {
      return false;
    }

    if (Date.now() > token.expiresAt) {
      this.resetTokens.delete(resetToken);
      return false;
    }

    return true;
  }

  /**
   * Check how much time is left before a code expires
   */
  getTimeUntilExpiry(code: string): number {
    return emailVerificationStore.getTimeUntilExpiryByCode(code);
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const expiredResetTokens: string[] = [];

    emailVerificationStore.cleanup();

    for (const [resetToken, token] of this.resetTokens.entries()) {
      if (Date.now() > token.expiresAt) {
        expiredResetTokens.push(resetToken);
      }
    }

    expiredResetTokens.forEach((resetToken) => this.resetTokens.delete(resetToken));
  }
}

// Singleton instance
export const passwordRecoveryStore = new PasswordRecoveryStore();

// Cleanup every 5 minutes
setInterval(() => {
  passwordRecoveryStore.cleanup();
}, 5 * 60 * 1000);
