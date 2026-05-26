import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { emailService } from "../../lib/email-service";

describe("EmailService", () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const ORIGINAL_EMAIL_FROM = process.env.EMAIL_FROM;
  let originalTransporter: any;

  beforeEach(() => {
    // preserve original transporter so we can restore it
    originalTransporter = (emailService as any).transporter;
    vi.restoreAllMocks();
    // default environment
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    process.env.EMAIL_FROM = ORIGINAL_EMAIL_FROM;
    (emailService as any).transporter = originalTransporter;
  });

  it("logs HTML and returns true in development mode when sending signup verification code", async () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await emailService.sendSignupVerificationCode("a@b.com", "CODE123");

    expect(result).toBe(true);
    // last HTML log includes the HTML body
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("HTML: <p>Your email verification code is: <strong>CODE123</strong>"));
  });

  it("uses default from address when EMAIL_FROM is not set", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.EMAIL_FROM;

    let capturedFrom: string | undefined;
    (emailService as any).transporter = {
      sendMail: async (opts: any) => {
        capturedFrom = opts.from;
        return { messageId: "msg-1" };
      },
    };

    const ok = await emailService.send({ to: "x@y.com", subject: "s", text: "t" });
    expect(ok).toBe(true);
    expect(capturedFrom).toBe("GreenPrompt Guide <greenprompt.guide@gmail.com>");
  });

  it("returns false and logs error when transporter.sendMail throws", async () => {
    process.env.NODE_ENV = "production";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (emailService as any).transporter = {
      sendMail: async () => {
        throw new Error("send failed");
      },
    };

    const ok = await emailService.send({ to: "x@y.com", subject: "s", text: "t" });
    expect(ok).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Email send failed:"), expect.any(Error));
  });
});
