import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordRecoveryModal } from "@/app/ui/password-recovery-modal";

describe("PasswordRecoveryModal", () => {
  const onClose = vi.fn();
  let setIntervalMock: ReturnType<typeof vi.spyOn>;
  let clearIntervalMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setIntervalMock = vi.spyOn(globalThis, "setInterval").mockImplementation((callback: TimerHandler) => {
      if (typeof callback === "function") {
        for (let index = 0; index < 60; index += 1) {
          callback();
        }
      }

      return 1 as unknown as number;
    });
    clearIntervalMock = vi.spyOn(globalThis, "clearInterval").mockImplementation(() => undefined);
  });

  afterEach(() => {
    setIntervalMock.mockRestore();
    clearIntervalMock.mockRestore();
  });

  it("returns nothing when closed", () => {
    const { container } = render(<PasswordRecoveryModal isOpen={false} onClose={onClose} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("walks through the recovery flow end to end", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Recovery code sent to your email" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Code verified successfully", resetToken: "reset-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Your password has been changed successfully" }),
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<PasswordRecoveryModal isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText(/email/i), "victor@example.com");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByRole("heading", { name: /enter verification code/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/verification code/i), "abc123");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByRole("heading", { name: /create new password/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByRole("heading", { name: /password changed successfully/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-recovery/request",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-recovery/verify-code",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-recovery/reset",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("allows resending the code after the countdown finishes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Recovery code sent to your email" }),
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<PasswordRecoveryModal isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText(/email/i), "victor@example.com");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /resend code/i })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: /resend code/i }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});