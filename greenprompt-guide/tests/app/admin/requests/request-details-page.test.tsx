import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminRequestDetailsPage from "@/app/admin/requests/[requestId]/page";

const getCollaborationRequestDetailsById = vi.hoisted(() => vi.fn());
const findExistingJobMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  })
);

vi.mock("@/domain/collaboration-request-repository", () => ({
  getCollaborationRequestDetailsById,
  findExistingJob: findExistingJobMock,
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/requests/[requestId]/llm-analysis-panel", () => ({
  LlmAnalysisPanel: (props: any) => (
    <div data-testid="llm-analysis-panel" data-props={JSON.stringify(props)}>
      LlmAnalysisPanel
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
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound when request does not exist", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce(null);
    getSessionMock.mockResolvedValueOnce("admin");

    try {
      // @ts-expect-error
      await AdminRequestDetailsPage({
        params: { requestId: "999" },
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
      updatedAt: new Date("2024-01-01"),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
    });
    render(element);

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
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
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
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
    });
    render(element);

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
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
    });
    render(element);

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
      updatedAt: new Date("2024-01-01"),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
    });
    render(element);

    const clientElement = screen.getByTestId("request-details-client");
    const props = JSON.parse(clientElement.getAttribute("data-props") || "{}");
    expect(props.request.requesterUsername).toBe("john_doe");
  });

  it("renders LlmAnalysisPanel when request is not approved", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 42,
      practiceName: "Test",
      summary: "Summary",
      status: "PENDING",
      requesterUsername: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "42" },
    });
    render(element);

    expect(screen.getByTestId("llm-analysis-panel")).toBeInTheDocument();
  });

  it("does not render LlmAnalysisPanel when request is approved", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 42,
      practiceName: "Test",
      summary: "Summary",
      status: "APPROVED",
      requesterUsername: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "42" },
    });
    render(element);

    expect(screen.queryByTestId("llm-analysis-panel")).not.toBeInTheDocument();
  });

  it("passes correct status to request details client component", async () => {
    getSessionMock.mockResolvedValueOnce("admin");
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test",
      summary: "Summary",
      status: "APPROVED",
      requesterUsername: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    const element = await AdminRequestDetailsPage({
      // @ts-expect-error
      params: { requestId: "1" },
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
      updatedAt: new Date(),
      reviewedAt: null,
      messages: [],
    });
    findExistingJobMock.mockResolvedValue(null);

    // @ts-expect-error
    await AdminRequestDetailsPage({
      params: { requestId: "123" },
    });

    expect(getCollaborationRequestDetailsById).toHaveBeenCalledWith(123);
  });
});
