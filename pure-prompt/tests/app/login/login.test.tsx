import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/login/login-form";

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

vi.mock("@/app/ui/password-recovery-modal", () => ({
  PasswordRecoveryModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="password-recovery-modal" /> : null,
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

describe("Login page and form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Login successful" }),
      }) as unknown as typeof fetch
    );
  });

  it("redirects signed-in users away from the login page", async () => {
    getSessionMock.mockResolvedValueOnce("victor");
    const LoginPage = (await import("@/app/login/page")).default;

    await LoginPage();

    expect(redirectMock).toHaveBeenCalledWith("/catalog");
  });

  it("renders the login form for anonymous users", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const LoginPage = (await import("@/app/login/page")).default;

    const element = await LoginPage();
    render(element);

    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders the expected fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create an account/i })).toBeInTheDocument();
  });

  it("submits credentials and redirects on success", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username or email/i), "victor@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/catalog"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("shows backend errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid username, email, or password" }),
      }) as unknown as typeof fetch
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/username or email/i), "victor");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid username, email, or password/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("opens the password recovery modal", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /forgot your password/i }));

    expect(screen.getByTestId("password-recovery-modal")).toBeInTheDocument();
  });
});