import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthButtons } from "@/app/ui/auth-buttons";
import { useAuth } from "@/lib/use-auth";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/use-auth");
vi.mock("next/navigation");
vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("AuthButtons", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should return null when loading is true", () => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: true,
      });

      const { container } = render(<AuthButtons />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Not Authenticated State", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should render login and signup links when user is not authenticated", () => {
      render(<AuthButtons />);
      expect(screen.getByText("Log in")).toBeInTheDocument();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
    });
  });

  describe("Authenticated State - Menu Interaction", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "USER" },
        loading: false,
      });
    });

    it("should render user menu button with username when authenticated", () => {
      render(<AuthButtons />);
      expect(screen.getByLabelText("Open user menu")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });

    it("should hide the admin interface link for standard users", async () => {
      render(<AuthButtons />);

      fireEvent.click(screen.getByLabelText("Open user menu"));

      await waitFor(() => {
        expect(screen.queryByText("Admin interface")).not.toBeInTheDocument();
      });
    });

    it("should open menu when clicking the user button", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText("My profile")).toBeInTheDocument();
        expect(screen.getByText("Log Out")).toBeInTheDocument();
      });
    });

    it("should close menu when clicking the user button again", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText("My profile")).toBeInTheDocument());
      
      fireEvent.click(button);
      await waitFor(() => expect(screen.queryByText("My profile")).not.toBeInTheDocument());
    });

    it("should toggle aria-expanded attribute correctly", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      expect(button).toHaveAttribute("aria-expanded", "false");
      
      fireEvent.click(button);
      await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "true"));
    });

    it("should navigate to profile when clicking 'My profile' link", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const profileLink = await screen.findByText("My profile");
      
      expect(profileLink).toHaveAttribute("href", `/user/${encodeURIComponent("testuser")}`);
    });

    it("should show the admin interface link for admin users", async () => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "ADMIN" },
        loading: false,
      });

      render(<AuthButtons />);
      fireEvent.click(screen.getByLabelText("Open user menu"));

      const adminLink = await screen.findByText("Admin interface");
      expect(adminLink).toHaveAttribute("href", "/admin");
    });

    it("should close menu when clicking 'My profile' link", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const profileLink = await screen.findByText("My profile");
      // Simulate the onClick handler that closes the menu
      fireEvent.click(profileLink);
      
      await waitFor(() => expect(screen.queryByText("My profile")).not.toBeInTheDocument());
    });
  });

  describe("Logout Functionality", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "USER" },
        loading: false,
      });
    });

    it("should logout successfully", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/auth/logout",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("should show 'Logging Out...' text during logout", async () => {
      (globalThis.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
          )
      );

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => expect(screen.getByText("Logging Out...")).toBeInTheDocument());
    });

    it("should disable logout button during logout", async () => {
      (globalThis.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
          )
      );

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => expect(logoutBtn).toBeDisabled());
    });

    it("should close menu after successful logout", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => expect(screen.queryByText("My profile")).not.toBeInTheDocument());
    });

    it("should dispatch auth-changed event on logout success", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const dispatchEvent = vi.spyOn(globalThis, "dispatchEvent");

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => {
        expect(dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "auth-changed" })
        );
      });
    });

    it("should handle logout error gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Logout error:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should not proceed with logout on failed response", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const logoutBtn = await screen.findByText("Log Out");
      fireEvent.click(logoutBtn);
      
      await waitFor(() => {
        expect(mockRefresh).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("Keyboard Interaction", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "USER" },
        loading: false,
      });
    });

    it("should close menu when pressing Escape key", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText("My profile")).toBeInTheDocument());
      
      fireEvent.keyDown(globalThis.window, { key: "Escape" });
      
      await waitFor(() => expect(screen.queryByText("My profile")).not.toBeInTheDocument());
    });

    it("should not interfere with other key presses", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText("My profile")).toBeInTheDocument());
      
      fireEvent.keyDown(globalThis.window, { key: "Enter" });
      
      await waitFor(() => expect(screen.getByText("My profile")).toBeInTheDocument());
    });
  });

  describe("Pointer Interaction", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "USER" },
        loading: false,
      });
    });

    it("should close menu when clicking outside", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText("My profile")).toBeInTheDocument());
      
      fireEvent.pointerDown(document.body);
      
      await waitFor(() => expect(screen.queryByText("My profile")).not.toBeInTheDocument());
    });

    it("should not close menu when clicking inside menu", async () => {
      render(<AuthButtons />);
      const button = screen.getByLabelText("Open user menu");
      
      fireEvent.click(button);
      const profileLink = await screen.findByText("My profile");
      
      fireEvent.pointerDown(profileLink);
      
      expect(screen.getByText("My profile")).toBeInTheDocument();
    });
  });

  describe("Event Cleanup", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: { username: "testuser", role: "USER" },
        loading: false,
      });
    });

    it("should remove event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(globalThis.window, "removeEventListener");
      
      const { unmount } = render(<AuthButtons />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it("should add event listeners on mount", () => {
      const addEventListenerSpy = vi.spyOn(globalThis.window, "addEventListener");
      
      render(<AuthButtons />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });
});
