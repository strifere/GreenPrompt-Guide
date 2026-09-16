import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminRequestsPage from "@/app/admin/requests/page";

// Mock next/link
vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock repository
vi.mock("@/domain/collaboration-request-repository", () => ({
	listAllCollaborationRequests: vi.fn(),
}));

// Mock AdminRequestDeleteAction component
vi.mock("@/app/admin/requests/admin-request-actions", () => ({
	AdminRequestDeleteAction: ({ requestId }: any) => (
		<div data-testid={`delete-action-${requestId}`}>Delete Action</div>
	),
}));

describe("AdminRequestsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockRequest = (overrides = {}) => ({
		id: 1,
		practiceTitle: "Test Practice",
		practiceSummary: "Test Summary",
		requesterUsername: "testuser",
		status: "PENDING",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-02"),
		...overrides,
	});

	it("renders page header with title", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		(listAllCollaborationRequests as any).mockResolvedValueOnce([]);

		render(await AdminRequestsPage());

		expect(screen.getByText("Requests")).toBeInTheDocument();
		expect(screen.getByText("Collaboration requests")).toBeInTheDocument();
	});

	it("renders requests panel with aria label", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		(listAllCollaborationRequests as any).mockResolvedValueOnce([]);

		render(await AdminRequestsPage());

		expect(screen.getByLabelText("All collaboration requests")).toBeInTheDocument();
	});

	it("displays empty state when no requests exist", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		(listAllCollaborationRequests as any).mockResolvedValueOnce([]);

		render(await AdminRequestsPage());

		expect(screen.getByText("No requests yet")).toBeInTheDocument();
		expect(
			screen.getByText("There are no collaboration requests in the system yet.")
		).toBeInTheDocument();
	});

	it("renders request list when requests exist", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 1, practiceTitle: "Practice 1" }),
			createMockRequest({ id: 2, practiceTitle: "Practice 2" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Practice 1")).toBeInTheDocument();
		expect(screen.getByText("Practice 2")).toBeInTheDocument();
	});

	it("displays practice title for each request", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ practiceTitle: "Green AI Optimization" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Green AI Optimization")).toBeInTheDocument();
	});

	it("displays practice summary for each request", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ practiceSummary: "This is a test summary" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("This is a test summary")).toBeInTheDocument();
	});

	it("displays request status with correct CSS class", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ status: "PENDING" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const statusPill = screen.getByText("Pending");
		expect(statusPill).toHaveClass("collaboration-status-pill");
		expect(statusPill).toHaveClass("pending");
	});

	it("formats status APPROVED correctly", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ status: "APPROVED" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Approved")).toBeInTheDocument();
	});

	it("formats status DENIED correctly", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ status: "DENIED" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Denied")).toBeInTheDocument();
	});

	it("formats status REQUESTED_MORE_INFO correctly", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ status: "REQUESTED_MORE_INFO" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Requested more info")).toBeInTheDocument();
	});

	it("displays requester username", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ requesterUsername: "alice" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("alice")).toBeInTheDocument();
	});

	it("displays created date in correct format", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ createdAt: new Date("2024-06-15T10:30:00") }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		// DateTimeFormat should format as "medium" date and "short" time
		const createdDateText = screen.getByText(/Jun 15, 2024/);
		expect(createdDateText).toBeInTheDocument();
	});

	it("displays modified date in correct format", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ updatedAt: new Date("2024-06-20T14:45:00") }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const updatedDateText = screen.getByText(/Jun 20, 2024/);
		expect(updatedDateText).toBeInTheDocument();
	});

	it("renders link to request details", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 42, practiceTitle: "Test Practice" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const link = screen.getByRole("link", { name: /Test Practice/ });
		expect(link).toHaveAttribute("href", "/admin/requests/42");
	});

	it("renders AdminRequestDeleteAction for each request", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 1 }),
			createMockRequest({ id: 2 }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByTestId("delete-action-1")).toBeInTheDocument();
		expect(screen.getByTestId("delete-action-2")).toBeInTheDocument();
	});

	it("renders metadata labels for each request", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest(),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Requester")).toBeInTheDocument();
		expect(screen.getByText("Created")).toBeInTheDocument();
		expect(screen.getByText("Modified")).toBeInTheDocument();
	});

	it("displays metadata values correctly", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({
				requesterUsername: "john_doe",
				createdAt: new Date("2024-05-01"),
				updatedAt: new Date("2024-05-10"),
			}),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("john_doe")).toBeInTheDocument();
	});

	it("handles multiple requests with different statuses", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 1, status: "PENDING" }),
			createMockRequest({ id: 2, status: "APPROVED" }),
			createMockRequest({ id: 3, status: "DENIED" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Pending")).toBeInTheDocument();
		expect(screen.getByText("Approved")).toBeInTheDocument();
		expect(screen.getByText("Denied")).toBeInTheDocument();
	});

	it("displays each request in separate card", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 1, practiceTitle: "Practice 1", practiceSummary: "Summary 1" }),
			createMockRequest({ id: 2, practiceTitle: "Practice 2", practiceSummary: "Summary 2" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const practice1Link = screen.getByRole("link", { name: /Practice 1/ });
		const practice2Link = screen.getByRole("link", { name: /Practice 2/ });

		// Different cards contain different summaries
		expect(practice1Link.closest("article")).toBeInTheDocument();
		expect(practice2Link.closest("article")).toBeInTheDocument();
	});

	it("renders panel as article elements", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ id: 1 }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const articles = screen.getAllByRole("article");
		expect(articles.length).toBeGreaterThan(0);
	});

	it("loads all collaboration requests on page load", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		(listAllCollaborationRequests as any).mockResolvedValueOnce([]);

		render(await AdminRequestsPage());

		expect(listAllCollaborationRequests).toHaveBeenCalled();
	});

	it("handles large number of requests", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = Array.from({ length: 50 }, (_, i) =>
			createMockRequest({ id: i + 1, practiceTitle: `Practice ${i + 1}` })
		);

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Practice 1")).toBeInTheDocument();
		expect(screen.getByText("Practice 50")).toBeInTheDocument();
	});

	it("handles special characters in practice title", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ practiceTitle: "Practice & <Special> \"Chars\"" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText("Practice & <Special> \"Chars\"")).toBeInTheDocument();
	});

	it("renders correct list class for styling", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest(),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const listContainer = screen.getByLabelText("All collaboration requests");
		expect(listContainer).toHaveClass("collaboration-requests-panel");
	});

	it("handles requests with very long descriptions", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const longSummary = "A".repeat(1000);
		const mockRequests = [
			createMockRequest({ practiceSummary: longSummary }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		expect(screen.getByText(longSummary)).toBeInTheDocument();
	});

	it("displays status pill with text alignment", async () => {
		const { listAllCollaborationRequests } = await import("@/domain/collaboration-request-repository");
		const mockRequests = [
			createMockRequest({ status: "PENDING" }),
		];

		(listAllCollaborationRequests as any).mockResolvedValueOnce(mockRequests);

		render(await AdminRequestsPage());

		const statusPill = screen.getByText("Pending");
		const titleBar = statusPill.closest("div");
		expect(titleBar?.className).toMatch(/titleBar/);
	});
});
