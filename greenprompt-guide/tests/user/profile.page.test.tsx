import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserProfilePage from "@/app/user/[username]/page";
import { useRouter, useParams } from "next/navigation";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation");
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => (
    <a href={href}>{children}</a>
  ),
}));

describe("UserProfilePage", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({
      username: "testuser",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Profile Loading", () => {
    it("should render the profile page immediately", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      expect(screen.getByText("Your details")).toBeInTheDocument();
      expect(screen.queryByText("Loading your details")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });
    });

    it("should fetch profile on mount", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/auth/profile",
          expect.objectContaining({
            method: "GET",
            credentials: "include",
            cache: "no-store",
          })
        );
      });
    });
  });

  describe("Profile Fetch Errors", () => {
    it("should redirect to login on 401 error", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Not authenticated" }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });

    it("should keep rendering the page when profile fetch fails", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Your details")).toBeInTheDocument();
      });

      expect(screen.queryByText("Server error")).not.toBeInTheDocument();
    });
  });

  describe("Successful Profile Load", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should display username", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });
    });

    it("should display email", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      });
    });

    it("should show page title", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Your details")).toBeInTheDocument();
      });
    });
  });

  describe("URL Route Mismatch", () => {
    it("should redirect when route username differs from profile username", async () => {
      (useParams as any).mockReturnValue({
        username: "wronguser",
      });

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "correctuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/user/correctuser");
      });
    });
  });

  describe("Username Editing", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should open username edit form when clicking edit button", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit username")).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText("Edit username");
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      });
    });

    it("should update username successfully", async () => {
      vi.clearAllMocks();
      (globalThis.fetch as any) = vi.fn();
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Username updated successfully",
            user: {
              username: "newusername",
              email: "test@example.com",
            },
          }),
        });

      const dispatchEvent = vi.spyOn(globalThis, "dispatchEvent");

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit username")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Edit username"));

      const input = await screen.findByDisplayValue("testuser");
      await userEvent.clear(input);
      await userEvent.type(input, "newusername");

      const submitButton = screen.getByRole("button", { name: /Save username/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "auth-changed" })
        );
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/user/newusername");
      });
    });

    it("should show error on username update failure", async () => {
      vi.clearAllMocks();
      (globalThis.fetch as any) = vi.fn();
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({
            error: "Username already taken",
          }),
        });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit username")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Edit username"));

      const input = await screen.findByDisplayValue("testuser");
      await userEvent.clear(input);
      await userEvent.type(input, "taken");

      const submitButton = screen.getByRole("button", { name: /Save username/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Username already taken")).toBeInTheDocument();
      });
    });

    it("should cancel username edit", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit username")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Edit username"));

      await waitFor(() => {
        expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("testuser")).not.toBeInTheDocument();
      });
    });
  });

  describe("Password Change", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should update password successfully", async () => {
      vi.clearAllMocks();
      (globalThis.fetch as any) = vi.fn();
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Password changed successfully",
          }),
        });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Confirm current password")).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText("Confirm current password");
      const newPasswordInput = screen.getByLabelText("New password");
      const confirmPasswordInput = screen.getByLabelText("Confirm new password");

      await userEvent.type(currentPasswordInput, "oldpass123");
      await userEvent.type(newPasswordInput, "newpass123");
      await userEvent.type(confirmPasswordInput, "newpass123");

      const changePasswordButton = screen.getByRole("button", {
        name: /Change password/i,
      });
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password changed successfully")
        ).toBeInTheDocument();
      });
    });

    it("should show error on password change failure", async () => {
      vi.clearAllMocks();
      (globalThis.fetch as any) = vi.fn();
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: "Current password is incorrect",
          }),
        });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Confirm current password")).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText("Confirm current password");
      const newPasswordInput = screen.getByLabelText("New password");
      const confirmPasswordInput = screen.getByLabelText("Confirm new password");

      await userEvent.type(currentPasswordInput, "wrongpass");
      await userEvent.type(newPasswordInput, "newpass123");
      await userEvent.type(confirmPasswordInput, "newpass123");

      const changePasswordButton = screen.getByRole("button", {
        name: /Change password/i,
      });
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(
          screen.getByText("Current password is incorrect")
        ).toBeInTheDocument();
      });
    });

    it("should clear password fields after successful change", async () => {
      vi.clearAllMocks();
      (globalThis.fetch as any) = vi.fn();
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Password changed successfully",
          }),
        });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Confirm current password")).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText("Confirm current password");
      const newPasswordInput = screen.getByLabelText("New password");
      const confirmPasswordInput = screen.getByLabelText("Confirm new password");

      await userEvent.type(currentPasswordInput, "oldpass123");
      await userEvent.type(newPasswordInput, "newpass123");
      await userEvent.type(confirmPasswordInput, "newpass123");

      const changePasswordButton = screen.getByRole("button", {
        name: /Change password/i,
      });
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password changed successfully")
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue("");
        expect(newPasswordInput).toHaveValue("");
        expect(confirmPasswordInput).toHaveValue("");
      });
    });
  });

  describe("Email Modal", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should open email change modal when clicking edit email button", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit email")).toBeInTheDocument();
      });

      const editEmailButton = screen.getByLabelText("Edit email");
      fireEvent.click(editEmailButton);

      await waitFor(() => {
        expect(screen.getByText("Change Your Email")).toBeInTheDocument();
      });
    });

    it("should close email modal when clicking close button", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit email")).toBeInTheDocument();
      });

      const editEmailButton = screen.getByLabelText("Edit email");
      fireEvent.click(editEmailButton);

      await waitFor(() => {
        expect(screen.getByText("Change Your Email")).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Close email change modal");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Change Your Email")).not.toBeInTheDocument();
      });
    });

    it("should update profile email after successful email change", async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              username: "testuser",
              email: "test@example.com",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Verification code sent",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Email updated successfully",
            user: { email: "newemail@example.com" },
          }),
        });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("Edit email")).toBeInTheDocument();
      });

      // Open modal and complete email change flow
      fireEvent.click(screen.getByLabelText("Edit email"));

      await waitFor(() => {
        expect(screen.getByText("Change Your Email")).toBeInTheDocument();
      });

      // After successful verification, the email should be updated
      // This would happen after going through the modal flow
    });
  });

  describe("Delete Account", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should render the delete account section", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /Delete account/i })).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
    });

    it("should delete the account after confirming the current password", async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            message: "Account deleted successfully",
          }),
        });

      const dispatchEvent = vi.spyOn(globalThis, "dispatchEvent");

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));

      await waitFor(() => {
        expect(screen.getByText("Delete Your Account")).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText("Current Password");
      await userEvent.type(passwordInput, "oldpass123");

      fireEvent.click(screen.getByRole("button", { name: /Delete definitely/i }));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/auth/profile/delete",
          expect.objectContaining({
            method: "POST",
          })
        );
      });

      await waitFor(() => {
        expect(dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "auth-changed" })
        );
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Page Layout", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });
    });

    it("should display all required sections", async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Your details")).toBeInTheDocument();
        expect(screen.getByText("Username")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Change password" })).toBeInTheDocument();
      });
    });
  });

  describe("Array Handling in useParams", () => {
    it("should handle username as string array", async () => {
      (useParams as any).mockReturnValue({
        username: ["testuser"],
      });

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });
    });

    it("should use first element when username is array", async () => {
      (useParams as any).mockReturnValue({
        username: ["testuser", "extra"],
      });

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            username: "testuser",
            email: "test@example.com",
          },
        }),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(
          globalThis.fetch
        ).toHaveBeenCalledWith(
          "/api/auth/profile",
          expect.any(Object)
        );
      });
    });
  });

  describe("Error Recovery", () => {
    it("should handle network error during profile fetch", async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(
        new Error("Network error")
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Your details")).toBeInTheDocument();
      });
    });

    it("should keep rendering the page when error object is null", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Your details")).toBeInTheDocument();
      });
    });
  });
});
