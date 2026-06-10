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

  it("sends password recovery code with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendPasswordRecoveryCode("test@example.com", "RECOVERY_CODE");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "Password Recovery Code",
      text: expect.stringContaining("RECOVERY_CODE"),
      html: expect.stringContaining("<strong>RECOVERY_CODE</strong>"),
    });
  });

  it("sends admin request acceptance email with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendAdminRequestResponse("test@example.com", true, "");
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Your admin request has been accepted",
      html: expect.stringContaining("Congratulations!"),
    }));
  });

  it("sends admin request rejection email with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendAdminRequestResponse("test@example.com", false, "Not a good fit");
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Your admin request has been rejected",
      html: expect.stringContaining("Not a good fit"),
    }));
  });

  it("sends email successfully in production mode", async () => {
    process.env.NODE_ENV = "production";
    let capturedOptions: any;
    (emailService as any).transporter = {
      sendMail: async (opts: any) => {
        capturedOptions = opts;
        return { messageId: "prod-msg-1" };
      },
    };

    const ok = await emailService.send({ to: "prod@example.com", subject: "Prod Test", text: "Prod Text" });
    expect(ok).toBe(true);
    expect(capturedOptions.to).toBe("prod@example.com");
  });

  it("logs text only in development mode when no html is provided", async () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await emailService.send({ to: "dev@example.com", subject: "Dev Text Test", text: "Dev Text Body" });
    
    expect(logSpy).toHaveBeenCalledWith("Email Service (development mode)");
    expect(logSpy).toHaveBeenCalledWith("To: dev@example.com");
    expect(logSpy).toHaveBeenCalledWith("Subject: Dev Text Test");
    expect(logSpy).toHaveBeenCalledWith("\nDev Text Body");
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining("HTML:"));
  });

  it("sends email change verification code with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendEmailChangeVerificationCode("change@example.com", "CHANGE_CODE");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "change@example.com",
      subject: "Email Change Verification Code",
      text: expect.stringContaining("CHANGE_CODE"),
      html: expect.stringContaining("<strong>CHANGE_CODE</strong>"),
    });
  });

  it("sends user deletion notice with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendUserDeletionNotice("deleted@example.com", "Violation of terms");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "deleted@example.com",
      subject: "Your GreenPrompt Guide account has been deleted",
      text: expect.stringContaining("Violation of terms"),
      html: expect.stringContaining("<strong>Reason:</strong> Violation of terms"),
    });
  });

  it("sends user ban notice with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendUserBanNotice("banned@example.com", "Spamming");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "banned@example.com",
      subject: "Your GreenPrompt Guide account has been banned",
      text: expect.stringContaining("Spamming"),
      html: expect.stringContaining("<strong>Reason:</strong> Spamming"),
    });
});

  it("sends user unban notice with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendUserUnbanNotice("unbanned@example.com");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "unbanned@example.com",
      subject: "Your GreenPrompt Guide account has been restored",
      text: expect.stringContaining("restored"),
      html: expect.stringContaining("restored"),
    });
  });

  it("sends admin promotion notice with correct content", async () => {
    const sendSpy = vi.spyOn(emailService, "send").mockResolvedValue(true);
    await emailService.sendAdminPromotionNotice("newadmin@example.com");
    expect(sendSpy).toHaveBeenCalledWith({
      to: "newadmin@example.com",
      subject: "You've been promoted to admin!",
      text: expect.stringContaining("promoted"),
      html: expect.stringContaining("promoted"),
    });
  });

  it("uses custom from address when EMAIL_FROM is set", async () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_FROM = "Custom From <custom@example.com>";
    
    let capturedFrom: string | undefined;
    (emailService as any).transporter = {
      sendMail: async (opts: any) => {
        capturedFrom = opts.from;
        return { messageId: "msg-custom" };
      },
    };

    await emailService.send({ to: "x@y.com", subject: "s", text: "t" });
    expect(capturedFrom).toBe("Custom From <custom@example.com>");
  });
});
