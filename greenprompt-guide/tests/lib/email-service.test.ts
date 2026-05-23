import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    sendMail: sendMailMock,
  }))
);

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

async function loadEmailService() {
  vi.resetModules();
  return import("@/lib/email-service");
}

describe("lib/email-service", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEmailHost = process.env.EMAIL_HOST;
  const originalEmailPort = process.env.EMAIL_PORT;
  const originalEmailSecure = process.env.EMAIL_SECURE;
  const originalEmailUser = process.env.EMAIL_USER;
  const originalEmailPass = process.env.EMAIL_PASS;
  const originalEmailFrom = process.env.EMAIL_FROM;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.EMAIL_HOST = originalEmailHost;
    process.env.EMAIL_PORT = originalEmailPort;
    process.env.EMAIL_SECURE = originalEmailSecure;
    process.env.EMAIL_USER = originalEmailUser;
    process.env.EMAIL_PASS = originalEmailPass;
    process.env.EMAIL_FROM = originalEmailFrom;
    sendMailMock.mockReset();
    createTransportMock.mockReset();
    createTransportMock.mockImplementation(() => ({
      sendMail: sendMailMock,
    }));
  });

  it("short-circuits in development mode", async () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { emailService } = await loadEmailService();

    await expect(
      emailService.send({
        to: "victor@example.com",
        subject: "Hello",
        text: "Test message",
      })
    ).resolves.toBe(true);

    expect(sendMailMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("returns false when SMTP credentials are missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { emailService } = await loadEmailService();

    await expect(
      emailService.send({
        to: "victor@example.com",
        subject: "Hello",
        text: "Test message",
      })
    ).resolves.toBe(false);

    expect(errorSpy).toHaveBeenCalledWith(
      "Email send failed:",
      expect.any(TypeError)
    );
  });

  it("sends emails through Nodemailer with the configured from address", async () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_HOST = "smtp.gmail.com";
    process.env.EMAIL_PORT = "465";
    process.env.EMAIL_SECURE = "true";
    process.env.EMAIL_USER = "greenprompt.guide@gmail.com";
    process.env.EMAIL_PASS = "app-password";
    process.env.EMAIL_FROM = "GreenPrompt Guide <from@example.com>";
    sendMailMock.mockResolvedValueOnce({ messageId: "abc123" });
    const { emailService } = await loadEmailService();

    await expect(
      emailService.sendPasswordRecoveryCode("victor@example.com", "ABC123")
    ).resolves.toBe(true);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "greenprompt.guide@gmail.com",
          pass: "app-password",
        },
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "GreenPrompt Guide <from@example.com>",
        to: "victor@example.com",
        subject: "Password Recovery Code",
      })
    );
  });

  it("returns false when Nodemailer reports an error", async () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_HOST = "smtp.gmail.com";
    process.env.EMAIL_USER = "greenprompt.guide@gmail.com";
    process.env.EMAIL_PASS = "app-password";
    sendMailMock.mockRejectedValueOnce(new Error("denied"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { emailService } = await loadEmailService();

    await expect(
      emailService.send({
        to: "victor@example.com",
        subject: "Hello",
        text: "Test message",
      })
    ).resolves.toBe(false);

    expect(errorSpy).toHaveBeenCalled();
  });
});