import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CollaboratePage from "../../../app/collaboration/page";

const routerPushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("CollaboratePage", () => {
  it("renders the collaboration layout with explainer and submission form", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 401 }));

    render(<CollaboratePage />);

    expect(screen.getByRole("heading", { name: /how collaboration works/i })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /propose a practice for review/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/practice title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supporting pdf/i)).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("exposes the expected submission controls", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 401 }));

    render(<CollaboratePage />);

    const pdfInput = screen.getByLabelText(/supporting pdf/i);
    expect(pdfInput).toHaveAttribute("type", "file");
    expect(pdfInput).toHaveAttribute("accept", "application/pdf");

    expect(screen.getByRole("button", { name: /submit for review/i })).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("renders the collaboration page as a two-column workspace", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 401 }));

    render(<CollaboratePage />);

    expect(screen.getByLabelText(/collaboration instructions/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /propose a practice for review/i })).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("shows a login warning before submitting when the user is not authenticated", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 401 }));
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => undefined);

    render(<CollaboratePage />);

    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /sign in required/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/please log in before submitting a collaboration request/i)).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    submitSpy.mockRestore();
  });

  it("shows validation indicators and blocks submit when fields are invalid", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ user: "testuser", role: "USER" }), { status: 200 }));

    render(<CollaboratePage />);

    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));

    await waitFor(() => {
      expect(screen.getByText(/there are fields that are not correct; please check them before submitting\./i)).toBeInTheDocument();
    });

    expect(screen.getByText(/practice title is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/short summary is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/full description is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/a supporting pdf is required\./i)).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("shows a success modal after a successful submission", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        let url: string;

        if (typeof input === "string") {
          url = input;
        } else if (input instanceof Request) {
          url = input.url;
        } else {
          url = input.toString();
        }

        if (url.includes("/api/auth/check")) {
          return new Response(JSON.stringify({ user: "testuser" }), { status: 200 });
        }

        if (url.includes("/api/collaboration/requests")) {
          return new Response(
            JSON.stringify({
              message: "Collaboration request created successfully",
              request: {
                id: 1,
                practiceTitle: "Example practice",
                status: "PENDING",
                pdfUrl: "/api/collaboration/requests/1/pdf",
              },
            }),
            { status: 201 },
          );
        }

        return new Response(null, { status: 404 });
      });

    render(<CollaboratePage />);

    fireEvent.change(screen.getByLabelText(/practice title/i), { target: { value: "Example practice" } });
    fireEvent.change(screen.getByLabelText(/short summary/i), { target: { value: "Short summary" } });
    fireEvent.change(screen.getByLabelText(/full description/i), { target: { value: "Full description" } });
    fireEvent.change(screen.getByLabelText(/reference link/i), { target: { value: "https://example.com/paper" } });

    const fileInput = screen.getByLabelText(/supporting pdf/i) as HTMLInputElement;
    const file = new File(["pdf"], "source.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /request submitted successfully/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/your collaboration request was submitted successfully\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view my requests/i })).toHaveAttribute(
      "href",
      "/collaboration/my-requests/testuser",
    );

    expect(routerPushMock).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("navigates to my requests when the user is authenticated", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ user: "testuser", role: "USER" }), { status: 200 }));

    render(<CollaboratePage />);

    fireEvent.click(screen.getByRole("button", { name: /my requests/i }));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/collaboration/my-requests/testuser");
    });

    fetchSpy.mockRestore();
  });

  it("shows the List all requests button only for admin users", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ user: "adminuser", role: "ADMIN" }), { status: 200 }));

    render(<CollaboratePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /list all requests/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /list all requests/i }));

    expect(routerPushMock).toHaveBeenCalledWith("/collaboration/requests");

    fetchSpy.mockRestore();
  });

  it("does not show the List all requests button for non-admin users", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ user: "testuser", role: "USER" }), { status: 200 }));

    render(<CollaboratePage />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /list all requests/i })).not.toBeInTheDocument();
    });

    fetchSpy.mockRestore();
  });
});
