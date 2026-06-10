import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminRequestDetailsPage from "@/app/admin/requests/[requestId]/page";

// Mock next components
vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const notFoundMock = vi.hoisted(() => vi.fn(() => {
	throw new Error("notFound");
}));
const redirectMock = vi.hoisted(() => vi.fn(() => {
	throw new Error("redirect");
}));
vi.mock("next/navigation", () => ({
	notFound: notFoundMock,
	redirect: redirectMock,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
	ArrowLeft: ({ size }: any) => <svg data-size={size} />,
}));

// Mock session
const getSessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/session", () => ({
	getSession: getSessionMock,
}));

// Mock repository
const getCollaborationRequestDetailsByIdMock = vi.hoisted(() => vi.fn());
const findExistingJobMock = vi.hoisted(() => vi.fn());
vi.mock("@/domain/collaboration-request-repository", () => ({
	getCollaborationRequestDetailsById: getCollaborationRequestDetailsByIdMock,
	findExistingJob: findExistingJobMock,
}));

vi.mock("@/app/admin/requests/[requestId]/llm-analysis-panel", () => ({
	LlmAnalysisPanel: (props: any) => (
		<div data-testid="llm-analysis-panel" data-props={JSON.stringify(props)}>
			LlmAnalysisPanel
		</div>
	),
}));

// Mock RequestDetailsClient
vi.mock("@/app/collaboration/my-requests/[username]/[requestId]/request-details-client", () => ({
	default: (props: any) => (
		<div data-testid="request-details-client" data-props={JSON.stringify(props)}>
			RequestDetailsClient
		</div>
	),
}));

describe("AdminRequestDetailsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockRequest = (overrides = {}) => ({
		id: 1,
		practiceTitle: "Test Practice",
		practiceSummary: "Test Summary",
		practiceDescription: "Test Description",
		requesterUsername: "testuser",
		status: "PENDING",
		createdAt: new Date("2024-01-01T10:00:00"),
		updatedAt: new Date("2024-01-02T14:00:00"),
		requestedMoreInfoAt: null,
		reviewedAt: null,
		messages: [],
		...overrides,
	});

	it("redirects to home when user is not authenticated", async () => {
		getSessionMock.mockResolvedValueOnce(null);

		const pagePromise = AdminRequestDetailsPage({
			params: Promise.resolve({ requestId: "1" }),
		});

		await expect(pagePromise).rejects.toThrow("redirect");
		expect(redirectMock).toHaveBeenCalledWith("/");
	});

	it("shows notFound when request ID is invalid", async () => {
		getSessionMock.mockResolvedValueOnce("admin");

		const pagePromise = AdminRequestDetailsPage({
			params: Promise.resolve({ requestId: "invalid" }),
		});

		await expect(pagePromise).rejects.toThrow("notFound");
	});

	it("shows notFound when request ID is zero", async () => {
		getSessionMock.mockResolvedValueOnce("admin");

		const pagePromise = AdminRequestDetailsPage({
			params: Promise.resolve({ requestId: "0" }),
		});

		await expect(pagePromise).rejects.toThrow("notFound");
	});

	it("shows notFound when request does not exist", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(null);

		const pagePromise = AdminRequestDetailsPage({
			params: Promise.resolve({ requestId: "999" }),
		});

		await expect(pagePromise).rejects.toThrow("notFound");
	});

	it("renders page structure with practice details shell", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const shell = screen.getByTestId("request-details-client");
		expect(shell.parentElement).toHaveClass("practice-details-shell");
	});

	it("renders back link to all requests", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const backLink = screen.getByRole("link", { name: /Back to all requests/i });
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/admin/requests");
	});

	it("displays status pill with correct class", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(
			createMockRequest({ status: "PENDING" })
		);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const statusPill = screen.getByText("Pending");
		expect(statusPill).toHaveClass("collaboration-status-pill");
		expect(statusPill).toHaveClass("pending");
	});

	it("formats status APPROVED correctly", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(
			createMockRequest({ status: "APPROVED" })
		);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByText("Approved")).toBeInTheDocument();
	});

	it("formats status DENIED correctly", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(
			createMockRequest({ status: "DENIED" })
		);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByText("Denied")).toBeInTheDocument();
	});

	it("passes request to RequestDetailsClient component", async () => {
		const mockRequest = createMockRequest({
			id: 42,
			practiceTitle: "Test Practice",
			requesterUsername: "john_doe",
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "42" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.currentUserRole).toBe("ADMIN");
		expect(props.currentUsername).toBe("admin");
		expect(props.request.id).toBe(42);
	});

	it("formats dates before passing to client", async () => {
		const mockRequest = createMockRequest({
			createdAt: new Date("2024-06-15T10:30:00"),
			updatedAt: new Date("2024-06-20T14:45:00"),
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		// Dates should be formatted as strings
		expect(typeof props.request.createdAt).toBe("string");
		expect(typeof props.request.updatedAt).toBe("string");
		expect(props.request.createdAt).toMatch(/Jun 15, 2024/);
		expect(props.request.updatedAt).toMatch(/Jun 20, 2024/);
	});

	it("handles null requestedMoreInfoAt date", async () => {
		const mockRequest = createMockRequest({ requestedMoreInfoAt: null });

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.request.requestedMoreInfoAt).toBeNull();
	});

	it("handles null reviewedAt date", async () => {
		const mockRequest = createMockRequest({ reviewedAt: null });

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.request.reviewedAt).toBeNull();
	});

	it("formats dates in messages before passing to client", async () => {
		const mockRequest = createMockRequest({
			messages: [
				{
					id: 1,
					content: "Message 1",
					senderUsername: "user1",
					createdAt: new Date("2024-06-10T09:00:00"),
					readAt: new Date("2024-06-10T10:00:00"),
				},
			],
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(typeof props.request.messages[0].createdAt).toBe("string");
		expect(typeof props.request.messages[0].readAt).toBe("string");
	});

	it("handles messages with null readAt", async () => {
		const mockRequest = createMockRequest({
			messages: [
				{
					id: 1,
					content: "Message",
					senderUsername: "user1",
					createdAt: new Date(),
					readAt: null,
				},
			],
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.request.messages[0].readAt).toBeNull();
	});

	it("passes multiple messages correctly formatted", async () => {
		const mockRequest = createMockRequest({
			messages: [
				{
					id: 1,
					content: "First message",
					senderUsername: "user1",
					createdAt: new Date("2024-06-10T09:00:00"),
					readAt: null,
				},
				{
					id: 2,
					content: "Second message",
					senderUsername: "user2",
					createdAt: new Date("2024-06-10T10:00:00"),
					readAt: new Date("2024-06-10T11:00:00"),
				},
			],
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.request.messages).toHaveLength(2);
		expect(props.request.messages[0].content).toBe("First message");
		expect(props.request.messages[1].content).toBe("Second message");
	});

	it("parses request ID from params correctly", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "123" }) }));

		expect(getCollaborationRequestDetailsByIdMock).toHaveBeenCalledWith(123);
	});

	it("renders RequestDetailsClient with ADMIN role", async () => {
		getSessionMock.mockResolvedValueOnce("admin_user");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.currentUserRole).toBe("ADMIN");
	});

	it("renders arrow icon in back link", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const backLink = screen.getByRole("link", { name: /Back to all requests/i });
		const svg = backLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("data-size", "22");
	});

	it("handles request with long text content", async () => {
		const longText = "A".repeat(2000);
		const mockRequest = createMockRequest({
			practiceDescription: longText,
		});

		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.dataset.props || "{}");

		expect(props.request.practiceDescription).toBe(longText);
	});

	it("loads request details on page render", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(createMockRequest());
		findExistingJobMock.mockResolvedValue(null);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(getCollaborationRequestDetailsByIdMock).toHaveBeenCalled();
	});

	it("handles negative request IDs", async () => {
		getSessionMock.mockResolvedValueOnce("admin");

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "-5" }) });

		await expect(page).rejects.toThrow("notFound");
	});

	it("renders LlmAnalysisPanel when request is not approved", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		const mockRequest = createMockRequest({ status: "PENDING" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValueOnce(null)

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByTestId("llm-analysis-panel")).toBeInTheDocument();
	});

	it("does not render LlmAnalysisPanel when request is approved", async () => {
		getSessionMock.mockResolvedValueOnce("admin");
		const mockRequest = createMockRequest({ status: "APPROVED" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(mockRequest);
		findExistingJobMock.mockResolvedValueOnce(null)

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.queryByTestId("llm-analysis-panel")).not.toBeInTheDocument();
	});
});

