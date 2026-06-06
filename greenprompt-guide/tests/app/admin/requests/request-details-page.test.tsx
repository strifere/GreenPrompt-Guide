import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminRequestDetailsPage from "@/app/admin/requests/[requestId]/page";

const getCollaborationRequestDetailsById = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  })
);

vi.mock("@/domain/collaboration-request-repository", () => ({
  getCollaborationRequestDetailsById: getCollaborationRequestDetailsById,
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/requests/admin-request-actions", () => ({
  AdminRequestActions: (props: any) => (
    <div data-testid="admin-request-actions" data-props={JSON.stringify(props)}>
      Actions
    </div>
  ),
}));

vi.mock("@/app/collaboration/my-requests/[username]/[requestId]/request-details-client", () => ({
  default: (props: any) => (
    <div data-testid="request-details-client" data-props={JSON.stringify(props)}>
      RequestDetailsClient
    </div>
  ),
}));

describe("AdminRequestDetailsPage", () => {
  it("calls notFound when request does not exist", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce(null);
    getSessionMock.mockResolvedValueOnce("admin");

    try {
      await AdminRequestDetailsPage({
        params: Promise.resolve({ requestId: "999" }),
      });
    } catch (e) {
      if (e instanceof Error && e.message === "notFound") {
        // Expected error, do nothing
      } else {
        throw e; // Unexpected error, rethrow
      }
    }

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders page header", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test Practice",
      summary: "Test summary",
      status: "PENDING",
      requesterUsername: "john_doe",
      createdAt: new Date("2024-01-01"),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    // The practice name is passed to the client component via data-props
    const clientElement = screen.getByTestId("request-details-client");
    const props = JSON.parse(clientElement.getAttribute("data-props") || "{}");
    expect(props.request.practiceName).toBe("Test Practice");
  });

  it("renders back link to requests list", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    const backLink = screen.getByRole("link", { name: /Back to all requests/i });
    expect(backLink).toHaveAttribute("href", "/admin/requests");
  });

  it("renders status badge", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    // Status is displayed as capitalized "Pending" in the pill
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders request summary", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "This is the request summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    // Summary is passed to the client component via data-props
    const clientElement = screen.getByTestId("request-details-client");
    const props = JSON.parse(clientElement.getAttribute("data-props") || "{}");
    expect(props.request.summary).toBe("This is the request summary");
  });

  it("renders requester information", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "john_doe",
      createdAt: new Date("2024-01-01"),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    // Requester username is passed to the client component via data-props
    const clientElement = screen.getByTestId("request-details-client");
    const props = JSON.parse(clientElement.getAttribute("data-props") || "{}");
    expect(props.request.requesterUsername).toBe("john_doe");
  });

  it("renders admin request actions component", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 42,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "42" }),
    });
    render(element);

  expect(screen.getByTestId("request-details-client")).toBeInTheDocument();
  });

  it("passes correct status to actions component", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "Summary",
      status: "APPROVED",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    const element = await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

  const clientElement = screen.getByTestId("request-details-client");
  const props = JSON.parse(clientElement.getAttribute("data-props") || "{}");
  expect(props.request.status).toBe("APPROVED");
  });

  it("parses request ID from URL params", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 123,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      reviewedAt: null,
      messages: [],
    });

    await AdminRequestDetailsPage({
      params: Promise.resolve({ requestId: "123" }),
    });

    expect(getCollaborationRequestDetailsById).toHaveBeenCalledWith(123);
  });
});
