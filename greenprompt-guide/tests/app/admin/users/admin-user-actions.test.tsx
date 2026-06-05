
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminUserActions } from "@/app/admin/users/admin-user-actions";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

global.fetch = vi.fn();

describe("AdminUserActions", () => {
    const mockRouter = {
        refresh: vi.fn(),
    };
    
    beforeEach(() => {
        vi.resetAllMocks();
        (useRouter as vi.Mock).mockReturnValue(mockRouter);
    });

    const defaultProps = {
        username: "testuser",
        email: "test@example.com",
        banned: false,
    };

    it("renders Ban and Delete buttons when user is not banned", () => {
        render(<AdminUserActions {...defaultProps} />);
        expect(screen.getByRole("button", { name: "Ban" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("renders Unban and Delete buttons when user is banned", () => {
        render(<AdminUserActions {...defaultProps} banned={true} />);
        expect(screen.getByRole("button", { name: "Unban" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("opens ban dialog on clicking Ban button", () => {
        render(<AdminUserActions {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: "Ban" }));
        expect(screen.getByRole("heading", { name: "Ban testuser?" })).toBeInTheDocument();
    });

    it("opens unban dialog on clicking Unban button", () => {
        render(<AdminUserActions {...defaultProps} banned={true} />);
        fireEvent.click(screen.getByRole("button", { name: "Unban" }));
        expect(screen.getByRole("heading", { name: "Unban testuser?" })).toBeInTheDocument();
    });

    it("opens delete dialog on clicking Delete button", () => {
        render(<AdminUserActions {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(screen.getByRole("heading", { name: "Delete testuser?" })).toBeInTheDocument();
    });

    it("closes dialog on clicking close button", () => {
        render(<AdminUserActions {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(screen.getByRole("heading", { name: "Delete testuser?" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "✕" }));
        expect(screen.queryByRole("heading", { name: "Delete testuser?" })).not.toBeInTheDocument();
    });

    it("disables confirm button if reason is required and not provided for ban", () => {
        render(<AdminUserActions {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: "Ban" }));
        const confirmButton = screen.getByRole("button", { name: "I'm sure, ban" });
        expect(confirmButton).toBeDisabled();
        fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "A reason" } });
        expect(confirmButton).not.toBeDisabled();
    });

    it("submits ban request and refreshes router on success", async () => {
        (fetch as vi.Mock).mockResolvedValue({ ok: true });
        render(<AdminUserActions {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: "Ban" }));
        fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Spam" } });
        fireEvent.click(screen.getByRole("button", { name: "I'm sure, ban" }));

        expect(screen.getByRole("button", { name: "Banning..." })).toBeDisabled();
        
        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/admin/users/testuser", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ban", reason: "Spam" }),
            });
        });

        await vi.waitFor(() => {
            expect(mockRouter.refresh).toHaveBeenCalled();
            expect(screen.queryByRole("heading")).not.toBeInTheDocument();
        });
    });

    it("submits delete request and refreshes router on success", async () => {
        (fetch as vi.Mock).mockResolvedValue({ ok: true });
        render(<AdminUserActions {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Violation" } });
        fireEvent.click(screen.getByRole("button", { name: "I'm sure, delete" }));

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/admin/users/testuser", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Violation" }),
            });
            expect(mockRouter.refresh).toHaveBeenCalled();
        });
    });

    it("shows an error message on failed submission", async () => {
        (fetch as vi.Mock).mockResolvedValue({
             ok: false,
             json: async () => ({ error: "Server error" })
        });
        render(<AdminUserActions {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: "Ban" }));
        fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Spam" } });
        fireEvent.click(screen.getByRole("button", { name: "I'm sure, ban" }));

        await vi.waitFor(() => {
            expect(screen.getByText("Server error")).toBeInTheDocument();
        });

        // The dialog should not close, and the button should be enabled again
        expect(screen.getByRole("heading", { name: "Ban testuser?" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "I'm sure, ban" })).not.toBeDisabled();
    });
});
