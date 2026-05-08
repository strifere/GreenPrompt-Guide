import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TopbarMenu } from "@/app/ui/topbar-menu";
import { useAuth } from "@/lib/use-auth";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/use-auth");
vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock("@/app/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

describe("TopbarMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should render menu button during loading", () => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<TopbarMenu />);
      expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
    });
  });

  describe("Not Authenticated State", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should render login and signup links when not authenticated", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText("Log in")).toBeInTheDocument();
        expect(screen.getByText("Sign up")).toBeInTheDocument();
      });
    });

    it("should have correct href for login link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const loginLink = await screen.findByText("Log in");
      
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("should have correct href for signup link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const signupLink = await screen.findByText("Sign up");
      
      expect(signupLink).toHaveAttribute("href", "/signup");
    });

    it("should close menu when clicking login link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const loginLink = await screen.findByText("Log in");
      fireEvent.click(loginLink);
      
      await waitFor(() => {
        expect(screen.queryByText("Log in")).not.toBeInTheDocument();
      });
    });

    it("should close menu when clicking signup link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const signupLink = await screen.findByText("Sign up");
      fireEvent.click(signupLink);
      
      await waitFor(() => {
        expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
      });
    });
  });

  describe("Authenticated State", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: "testuser",
        loading: false,
      });
    });

    it("should not render login/signup links when authenticated", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.queryByText("Log in")).not.toBeInTheDocument();
        expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
      });
    });

    it("should still render navigation links when authenticated", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText("Catalog")).toBeInTheDocument();
        expect(screen.getByText("Collaboration")).toBeInTheDocument();
        expect(screen.getByText("About")).toBeInTheDocument();
      });
    });
  });

  describe("Menu Toggle", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should open menu when clicking button", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(menuButton).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should close menu when clicking button again", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(menuButton).toHaveAttribute("aria-expanded", "true"));
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(menuButton).toHaveAttribute("aria-expanded", "false"));
    });

    it("should have aria-haspopup menu attribute", () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
    });
  });

  describe("Navigation Links", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should render all navigation links", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText("Catalog")).toHaveAttribute("href", "/catalog");
        expect(screen.getByText("Collaboration")).toHaveAttribute("href", "/collaboration");
        expect(screen.getByText("About")).toHaveAttribute("href", "/");
      });
    });

    it("should close menu when clicking catalog link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const catalogLink = await screen.findByText("Catalog");
      fireEvent.click(catalogLink);
      
      await waitFor(() => {
        expect(screen.queryByText("Catalog")).not.toBeInTheDocument();
      });
    });

    it("should close menu when clicking collaboration link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const collaborationLink = await screen.findByText("Collaboration");
      fireEvent.click(collaborationLink);
      
      await waitFor(() => {
        expect(screen.queryByText("Collaboration")).not.toBeInTheDocument();
      });
    });

    it("should close menu when clicking about link", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const aboutLink = await screen.findByText("About");
      fireEvent.click(aboutLink);
      
      await waitFor(() => {
        expect(screen.queryByText("About")).not.toBeInTheDocument();
      });
    });
  });

  describe("Theme Toggle", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should render theme toggle inside menu", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Interaction", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should close menu when pressing Escape key", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(screen.getByText("Catalog")).toBeInTheDocument());
      
      fireEvent.keyDown(globalThis.window, { key: "Escape" });
      
      await waitFor(() => {
        expect(screen.queryByText("Catalog")).not.toBeInTheDocument();
      });
    });

    it("should not close menu for other key presses", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(screen.getByText("Catalog")).toBeInTheDocument());
      
      fireEvent.keyDown(globalThis.window, { key: "Enter" });
      
      expect(screen.getByText("Catalog")).toBeInTheDocument();
    });
  });

  describe("Pointer Interaction", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should close menu when clicking outside", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(screen.getByText("Catalog")).toBeInTheDocument());
      
      fireEvent.pointerDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText("Catalog")).not.toBeInTheDocument();
      });
    });

    it("should not close menu when clicking inside menu", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      const catalogLink = await screen.findByText("Catalog");
      
      fireEvent.pointerDown(catalogLink);
      
      expect(screen.getByText("Catalog")).toBeInTheDocument();
    });

    it("should not close menu when clicking menu button", async () => {
      render(<TopbarMenu />);
      const menuButton = screen.getByLabelText("Open menu");
      
      fireEvent.click(menuButton);
      await waitFor(() => expect(screen.getByText("Catalog")).toBeInTheDocument());
      
      fireEvent.pointerDown(menuButton);
      
      expect(screen.getByText("Catalog")).toBeInTheDocument();
    });
  });

  describe("Event Cleanup", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it("should remove event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(globalThis.window, "removeEventListener");
      
      const { unmount } = render(<TopbarMenu />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it("should add event listeners on mount", () => {
      const addEventListenerSpy = vi.spyOn(globalThis.window, "addEventListener");
      
      render(<TopbarMenu />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });
});
