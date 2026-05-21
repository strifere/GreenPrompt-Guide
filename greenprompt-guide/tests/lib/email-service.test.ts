import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
const resendConstructorMock = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  }))
);

vi.mock("resend", () => ({
  Resend: resendConstructorMock,
}));

async function loadEmailService() {
  vi.resetModules();
  return import("@/lib/email-service");
}

describe("lib/email-service", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.RESEND_API_KEY = originalApiKey;
    process.env.RESEND_FROM_EMAIL = originalFrom;
    sendMock.mockReset();
    resendConstructorMock.mockReset();
    resendConstructorMock.mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
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

    expect(sendMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("returns false when the API key is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { emailService } = await loadEmailService();

    await expect(
      emailService.send({
        to: "victor@example.com",
        subject: "Hello",
        text: "Test message",
      })
    ).resolves.toBe(false);

    expect(errorSpy).toHaveBeenCalledWith("RESEND_API_KEY is missing. Email delivery is disabled.");
  });

  it("sends emails through Resend with the configured from address", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "GreenPrompt Guide <from@example.com>";
    sendMock.mockResolvedValueOnce({ error: null });
    const { emailService } = await loadEmailService();

    await expect(
      emailService.sendPasswordRecoveryCode("victor@example.com", "ABC123")
    ).resolves.toBe(true);

    expect(resendConstructorMock).toHaveBeenCalledWith("re_test_key");
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "GreenPrompt Guide <from@example.com>",
        to: "victor@example.com",
        subject: "Password Recovery Code",
      })
    );
  });

  it("returns false when Resend reports an error", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key";
    sendMock.mockResolvedValueOnce({ error: { message: "denied" } });
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