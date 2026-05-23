import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/app/signup/signup-form";

const getSessionMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

describe("Signup page and form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Verification code sent to your email" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: "User created successfully",
            user: { username: "victor", email: "victor@example.com" },
          }),
        })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("redirects signed-in users away from the signup page", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    const SignupPage = (await import("@/app/signup/page")).default;

    await SignupPage();

    expect(redirectMock).toHaveBeenCalledWith("/catalog");
  });

  it("renders the signup form for anonymous users", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const SignupPage = (await import("@/app/signup/page")).default;

    const element = await SignupPage();
    render(element);

    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in here/i })).toBeInTheDocument();
  });

  it("renders the expected fields", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
  });

  it("toggles visibility for both password fields", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    await user.click(screen.getByRole("button", { name: /show confirm password/i }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    await user.click(screen.getByRole("button", { name: /hide confirm password/i }));

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("toggles the administrator auth code field", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    expect(screen.queryByLabelText(/admin auth\. code/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /toggle administrator account/i }));
    expect(screen.getByLabelText(/admin auth\. code/i)).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /toggle administrator account/i }));
    expect(screen.queryByLabelText(/admin auth\. code/i)).not.toBeInTheDocument();
  });

  it("submits the signup form and redirects on success", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^username$/i), "victor");
    await user.type(screen.getByLabelText(/^email$/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("heading", { name: /verify your email/i })).toBeInTheDocument();

    const verificationCodeInput = screen.getByLabelText(/^verification code$/i);

    await user.type(verificationCodeInput, "abc123");
    expect(verificationCodeInput).toHaveValue("ABC123");

    await user.click(screen.getByRole("button", { name: /^verify email$/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/catalog"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/signup/request-email-verification",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("shows backend signup errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email already registered" }),
      })
    );

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^username$/i), "victor");
    await user.type(screen.getByLabelText(/^email$/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a fallback error when verification code request fails without details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^username$/i), "victor");
    await user.type(screen.getByLabelText(/^email$/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/failed to send verification code/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /verify your email/i })).not.toBeInTheDocument();
  });

  it("shows a generic error when verification code request rejects with a non-error value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("network down"));

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^username$/i), "victor");
    await user.type(screen.getByLabelText(/^email$/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/an error occurred\. please try again\./i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /verify your email/i })).not.toBeInTheDocument();
  });

  it("enables resend after the countdown and shows resend failures", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Verification code sent to your email" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        })
    );

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);

    fireEvent.change(usernameInput, { target: { value: "victor" } });
    fireEvent.change(emailInput, { target: { value: "victor@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    });

    expect(screen.getByRole("button", { name: /resend in 60s/i })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const resendButton = screen.getByRole("button", { name: /^resend code$/i });
    expect(resendButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(resendButton);
    });

    expect(screen.getByText(/failed to resend verification code/i)).toBeInTheDocument();
  });

  it("shows a verification error when the code submission fails without details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Verification code sent to your email" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        })
    );

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^username$/i), "victor");
    await user.type(screen.getByLabelText(/^email$/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/^confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("heading", { name: /verify your email/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^verification code$/i), "abc123");
    await user.click(screen.getByRole("button", { name: /^verify email$/i }));

    expect(await screen.findByText(/failed to verify email/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
  });
});