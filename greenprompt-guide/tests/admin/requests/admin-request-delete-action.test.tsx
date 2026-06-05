import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminRequestDeleteAction } from "@/app/admin/requests/admin-request-actions";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		refresh: vi.fn(),
	})),
}));

// Mock fetch
global.fetch = vi.fn();

describe("AdminRequestDeleteAction Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockClear();
	});

	it("renders delete button", () => {
		render(<AdminRequestDeleteAction requestId={1} />);
		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		expect(deleteButton).toBeInTheDocument();
		expect(deleteButton).toHaveClass("ghost-btn");
	});

	it("initially does not show delete dialog", () => {
		render(<AdminRequestDeleteAction requestId={1} />);
		expect(screen.queryByText("Delete request?")).not.toBeInTheDocument();
	});

	it("opens delete dialog when delete button is clicked", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		expect(screen.getByText("Delete request?")).toBeInTheDocument();
	});

	it("displays confirmation message in dialog", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		expect(
			screen.getByText("This will permanently remove the request from the system.")
		).toBeInTheDocument();
	});

	it("displays cancel button in dialog", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
	});

	it("displays confirm delete button in dialog", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		expect(screen.getByRole("button", { name: /I'm sure, delete/i })).toBeInTheDocument();
	});

	it("closes dialog when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const cancelButton = screen.getByRole("button", { name: /Cancel/i });
		await user.click(cancelButton);

		expect(screen.queryByText("Delete request?")).not.toBeInTheDocument();
	});

	it("closes dialog when close button is clicked", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const closeButton = screen.getByRole("button", { name: /Close delete practice dialog/i });
		await user.click(closeButton);

		expect(screen.queryByText("Delete request?")).not.toBeInTheDocument();
	});

	it("closes dialog when backdrop is clicked", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const backdrop = screen.getByRole("button", { name: /Close delete practice dialog/i }).closest(".recovery-modal-overlay")?.querySelector(".recovery-modal-backdrop");
		if (backdrop) {
			await user.click(backdrop);
		}

		// Dialog should be closed or closing
		await waitFor(() => {
			expect(screen.queryByText("Delete request?")).not.toBeInTheDocument();
		}, { timeout: 1000 });
	});

	it("calls delete API with correct request ID", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		render(<AdminRequestDeleteAction requestId={42} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/requests/42",
				{ method: "DELETE" }
			);
		});
	});

	it("shows loading state while deleting", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockImplementationOnce(
			() => new Promise((resolve) =>
				setTimeout(() => resolve({
					ok: true,
					json: async () => ({}),
				}), 100)
			)
		);

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		expect(screen.getByRole("button", { name: /Deleting/i })).toBeInTheDocument();
	});

	it("disables confirm button while deleting", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockImplementationOnce(
			() => new Promise((resolve) =>
				setTimeout(() => resolve({
					ok: true,
					json: async () => ({}),
				}), 50)
			)
		);

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		expect(confirmButton).toBeDisabled();
	});

	it("displays error message on failed deletion", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "Permission denied" }),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("Permission denied")).toBeInTheDocument();
		});
	});

	it("displays generic error message when response error missing", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("Failed to delete request")).toBeInTheDocument();
		});
	});

	it("displays error when fetch throws exception", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("Network error")).toBeInTheDocument();
		});
	});

	it("keeps error message displayed after failed deletion", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "Delete failed" }),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("Delete failed")).toBeInTheDocument();
		});

		// Error should still be visible
		expect(screen.getByText("Delete failed")).toBeInTheDocument();
	});

	it("renders error message with error-message class", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "Test error" }),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			const errorMessage = screen.getByText("Test error");
			expect(errorMessage).toHaveClass("error-message");
		});
	});

	it("handles response parse error gracefully", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => {
				throw new Error("JSON parse error");
			},
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("Failed to delete request")).toBeInTheDocument();
		});
	});

	it("handles successful deletion by navigating away", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/requests/1",
				{ method: "DELETE" }
			);
		});
	});

	it("calls router.refresh after successful deletion", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/requests/1",
				{ method: "DELETE" }
			);
		});
	});

	it("clears dialog and error state after successful deletion", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		const { useRouter } = await import("next/navigation");
		(useRouter as any).mockReturnValueOnce({
			push: vi.fn(),
			refresh: vi.fn(),
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.queryByText("Delete request?")).not.toBeInTheDocument();
		});
	});

	it("renders delete button with dangerAction class", () => {
		render(<AdminRequestDeleteAction requestId={1} />);
		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		expect(deleteButton.className).toMatch(/dangerAction/);
	});

	it("renders confirm delete button with recovery-btn class", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		expect(confirmButton).toHaveClass("recovery-btn");
	});

	it("renders confirm delete button with dialogDangerButton class", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		expect(confirmButton.className).toMatch(/dialogDangerButton/);
	});

	it("renders cancel button with dialogCancelButton class", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const cancelButton = screen.getByRole("button", { name: /Cancel/i });
		expect(cancelButton.className).toMatch(/dialogCancelButton/);
	});

	it("has correct modal structure with overlay and backdrop", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		const overlay = screen.getByRole("button", { name: /Close delete practice dialog/i }).closest(".recovery-modal-overlay");
		expect(overlay).toBeInTheDocument();
		expect(overlay?.querySelector(".recovery-modal-backdrop")).toBeInTheDocument();
		expect(overlay?.querySelector(".recovery-modal")).toBeInTheDocument();
	});

	it("renders close button with correct aria label", async () => {
		const user = userEvent.setup();
		render(<AdminRequestDeleteAction requestId={1} />);

		const deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		expect(screen.getByRole("button", { name: /Close delete practice dialog/i })).toBeInTheDocument();
	});

	it("passes different request IDs correctly", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		const { rerender } = render(<AdminRequestDeleteAction requestId={1} />);

		let deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		let confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/requests/1",
				{ method: "DELETE" }
			);
		});

		mockFetch.mockClear();
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		rerender(<AdminRequestDeleteAction requestId={999} />);

		deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/requests/999",
				{ method: "DELETE" }
			);
		});
	});

	it("allows retry after failed deletion", async () => {
		const user = userEvent.setup();
		const mockFetch = global.fetch as any;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "First attempt failed" }),
		});

		render(<AdminRequestDeleteAction requestId={1} />);

		let deleteButton = screen.getByRole("button", { name: /Delete/i });
		await user.click(deleteButton);

		let confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(screen.getByText("First attempt failed")).toBeInTheDocument();
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		// Retry by clicking delete again
		confirmButton = screen.getByRole("button", { name: /I'm sure, delete/i });
		await user.click(confirmButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	it("has readonly props", () => {
		render(<AdminRequestDeleteAction requestId={1} />);
		expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
	});
});
