/**
 * In-memory store for password recovery tokens
 * In production, this should be stored in a database or Redis
 */

interface RecoveryToken {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

interface ResetToken {
  email: string;
  expiresAt: number;
}

class PasswordRecoveryStore {
  private tokens: Map<string, RecoveryToken> = new Map();
  private resetTokens: Map<string, ResetToken> = new Map();
  private readonly CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
  private readonly RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ATTEMPTS = 5;

  /**
   * Generate a random recovery code
   */
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Create a new recovery token for an email
   */
  createToken(email: string): string {
    const code = this.generateCode();
    const now = Date.now();

    this.tokens.set(code, {
      code,
      email,
      expiresAt: now + this.CODE_EXPIRY_MS,
      attempts: 0,
    });

    return code;
  }

  /**
   * Create a one-time reset token after the recovery code has been verified
   */
  createResetToken(email: string): string {
    const resetToken = crypto.randomUUID();

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
    const token = this.tokens.get(code);

    if (!token) {
      return null;
    }

    // Check if email matches
    if (token.email !== email) {
      return null;
    }

    // Check if expired
    if (Date.now() > token.expiresAt) {
      this.tokens.delete(code);
      return null;
    }

    // Check attempts
    token.attempts += 1;
    if (token.attempts > this.MAX_ATTEMPTS) {
      this.tokens.delete(code);
      return null;
    }

    this.tokens.delete(code);

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
    const token = this.tokens.get(code);

    if (!token) {
      return false;
    }

    if (token.email !== email) {
      return false;
    }

    if (Date.now() > token.expiresAt) {
      this.tokens.delete(code);
      return false;
    }

    return true;
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
    const token = this.tokens.get(code);

    if (!token) {
      return 0;
    }

    const timeLeft = token.expiresAt - Date.now();
    return Math.max(0, timeLeft);
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now();
    const expiredCodes: string[] = [];
    const expiredResetTokens: string[] = [];

    for (const [code, token] of this.tokens.entries()) {
      if (now > token.expiresAt) {
        expiredCodes.push(code);
      }
    }

    for (const [resetToken, token] of this.resetTokens.entries()) {
      if (now > token.expiresAt) {
        expiredResetTokens.push(resetToken);
      }
    }

    expiredCodes.forEach((code) => this.tokens.delete(code));
    expiredResetTokens.forEach((resetToken) => this.resetTokens.delete(resetToken));
  }
}

// Singleton instance
export const passwordRecoveryStore = new PasswordRecoveryStore();

// Cleanup every 5 minutes
setInterval(() => {
  passwordRecoveryStore.cleanup();
}, 5 * 60 * 1000);
