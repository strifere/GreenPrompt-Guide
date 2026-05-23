import { randomInt } from "node:crypto";

type VerificationCodeRecord = {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
};

class EmailVerificationStore {
  private readonly codesByEmail = new Map<string, VerificationCodeRecord>();
  private readonly CODE_EXPIRY_MS = 15 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 5;

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateCode(): string {
    return Array.from({ length: 6 }, () => randomInt(36).toString(36)).join("").toUpperCase();
  }

  private getValidRecord(email: string): VerificationCodeRecord | null {
    const normalizedEmail = this.normalizeEmail(email);
    const record = this.codesByEmail.get(normalizedEmail);

    if (!record) {
      return null;
    }

    if (Date.now() > record.expiresAt) {
      this.codesByEmail.delete(normalizedEmail);
      return null;
    }

    return record;
  }

  createCode(email: string): string {
    const normalizedEmail = this.normalizeEmail(email);
    const code = this.generateCode();

    this.codesByEmail.set(normalizedEmail, {
      code,
      email: normalizedEmail,
      expiresAt: Date.now() + this.CODE_EXPIRY_MS,
      attempts: 0,
    });

    return code;
  }

  claimCode(email: string, code: string): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    const record = this.getValidRecord(normalizedEmail);

    if (!record) {
      return false;
    }

    if (record.code !== code) {
      record.attempts += 1;

      if (record.attempts > this.MAX_ATTEMPTS) {
        this.codesByEmail.delete(normalizedEmail);
      }

      return false;
    }

    this.codesByEmail.delete(normalizedEmail);
    return true;
  }

  isCodeValid(email: string, code: string): boolean {
    const record = this.getValidRecord(email);

    return record?.code === code;
  }

  getTimeUntilExpiryByEmail(email: string): number {
    const record = this.getValidRecord(email);

    if (!record) {
      return 0;
    }

    return Math.max(0, record.expiresAt - Date.now());
  }

  getTimeUntilExpiryByCode(code: string): number {
    for (const record of this.codesByEmail.values()) {
      if (record.code === code) {
        if (Date.now() > record.expiresAt) {
          this.codesByEmail.delete(record.email);
          return 0;
        }

        return Math.max(0, record.expiresAt - Date.now());
      }
    }

    return 0;
  }

  cleanup(): void {
    const now = Date.now();

    for (const [email, record] of this.codesByEmail.entries()) {
      if (now > record.expiresAt) {
        this.codesByEmail.delete(email);
      }
    }
  }
}

export const emailVerificationStore = new EmailVerificationStore();