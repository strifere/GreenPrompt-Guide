import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminDeleteAction } from "@/app/admin/admin-delete-action";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

global.fetch = mockFetch;

describe("AdminDeleteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders delete button", () => {
    render(<AdminDeleteAction type="dataset" objectKey="test-dataset" />);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("opens dialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="dataset" objectKey="test-dataset" />);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(screen.getByText("Delete dataset?")).toBeInTheDocument();
  });

  it("shows confirmation dialog with entity name", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="reference" objectKey="Important Paper" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.getByText(/important paper/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently remove/i)).toBeInTheDocument();
  });

  it("closes dialog when backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="dataset" objectKey="test-dataset" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText("Delete dataset?")).toBeInTheDocument();

    const backdrop = screen.getByRole("button", { name: /close delete/i });
    await user.click(backdrop);

    expect(screen.queryByText("Delete dataset?")).not.toBeInTheDocument();
  });

  it("closes dialog when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="dataset" objectKey="test-dataset" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByText("Delete dataset?")).not.toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="dataset" objectKey="test-dataset" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    const closeButton = screen.getByRole("button", { name: "✕" });
    await user.click(closeButton);

    expect(screen.queryByText("Delete dataset?")).not.toBeInTheDocument();
  });

  it("shows special message for reference deletion", async () => {
    const user = userEvent.setup();
    render(<AdminDeleteAction type="reference" objectKey="Paper Title" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.getByText(/associated practices and hyperparameters/i)).toBeInTheDocument();
  });

  it("calls delete endpoint with correct URL for datasets", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="dataset" objectKey="my-dataset" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    const confirmButton = screen.getByRole("button", { name: /i'm sure, delete/i });
    await user.click(confirmButton);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/datasets/my-dataset",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("calls delete endpoint with correct URL for models", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="model" objectKey="gpt-4" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/models/gpt-4",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("calls delete endpoint with correct URL for references", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="reference" objectKey="Paper Title" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/references/Paper%20Title",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("calls delete endpoint with correct URL for practices", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="practice" objectKey="my-practice" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/practices/my-practice",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("calls delete endpoint with numeric ID for hyperparameters", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="hyperparameter" objectKey={42} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/hyperparameters/42",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("disables confirm button while loading", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<AdminDeleteAction type="dataset" objectKey="test" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    const confirmButton = screen.getByRole("button", { name: /i'm sure, delete/i });

    await user.click(confirmButton);
    expect(confirmButton).toBeDisabled();
  });

  it("shows error message on failed deletion", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Permission denied" }),
    });

    render(<AdminDeleteAction type="dataset" objectKey="test" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(screen.getByText("Permission denied")).toBeInTheDocument();
  });

  it("shows generic error message when delete fails without error response", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="dataset" objectKey="test" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(screen.getByText(/failed to delete datasets/i)).toBeInTheDocument();
  });

  it("closes dialog and refreshes on successful deletion", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="dataset" objectKey="test" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.queryByText("Delete dataset?")).not.toBeInTheDocument();
  });

  it("handles special characters in object key", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDeleteAction type="reference" objectKey="Paper & Study 2024" />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /i'm sure, delete/i }));

    expect(mockFetch).toHaveBeenCalled();
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain("Paper%20%26%20Study%202024");
  });
});
