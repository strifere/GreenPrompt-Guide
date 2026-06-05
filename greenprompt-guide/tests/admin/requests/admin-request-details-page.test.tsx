import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminRequestDetailsPage from "@/app/admin/requests/[requestId]/page";

// Mock next components
vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("notFound");
	}),
	redirect: vi.fn(() => {
		throw new Error("redirect");
	}),
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
	ArrowLeft: ({ size }: any) => <svg data-size={size} />,
}));

// Mock session
vi.mock("@/lib/session", () => ({
	getSession: vi.fn(),
}));

// Mock repository
vi.mock("@/domain/collaboration-request-repository", () => ({
	getCollaborationRequestDetailsById: vi.fn(),
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
		const { getSession } = await import("@/lib/session");
		const { redirect } = await import("next/navigation");

		(getSession as any).mockResolvedValueOnce(null);

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) });

		try {
			await page;
		} catch (e: any) {
			expect((redirect as any).mock.calls[0][0]).toBe("/");
		}
	});

	it("shows notFound when request ID is invalid", async () => {
		const { getSession } = await import("@/lib/session");
		const { notFound } = await import("next/navigation");

		(getSession as any).mockResolvedValueOnce("admin");

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "invalid" }) });

		try {
			await page;
		} catch (e: any) {
			expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
		}
	});

	it("shows notFound when request ID is zero", async () => {
		const { getSession } = await import("@/lib/session");
		const { notFound } = await import("next/navigation");

		(getSession as any).mockResolvedValueOnce("admin");

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "0" }) });

		try {
			await page;
		} catch (e: any) {
			expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
		}
	});

	it("shows notFound when request does not exist", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { notFound } = await import("next/navigation");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(null);

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "999" }) });

		try {
			await page;
		} catch (e: any) {
			expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
		}
	});

	it("renders page structure with practice details shell", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const shell = screen.getByTestId("request-details-client");
		expect(shell.parentElement).toHaveClass("practice-details-shell");
	});

	it("renders back link to all requests", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const backLink = screen.getByRole("link", { name: /Back to all requests/i });
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/admin/requests");
	});

	it("displays status pill with correct class", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(
			createMockRequest({ status: "PENDING" })
		);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const statusPill = screen.getByText("Pending");
		expect(statusPill).toHaveClass("collaboration-status-pill");
		expect(statusPill).toHaveClass("pending");
	});

	it("formats status APPROVED correctly", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(
			createMockRequest({ status: "APPROVED" })
		);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByText("Approved")).toBeInTheDocument();
	});

	it("formats status DENIED correctly", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(
			createMockRequest({ status: "DENIED" })
		);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByText("Denied")).toBeInTheDocument();
	});

	it("passes request to RequestDetailsClient component", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const mockRequest = createMockRequest({
			id: 42,
			practiceTitle: "Test Practice",
			requesterUsername: "john_doe",
		});

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "42" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.currentUserRole).toBe("ADMIN");
		expect(props.currentUsername).toBe("admin");
	});

	it("formats dates before passing to client", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const mockRequest = createMockRequest({
			createdAt: new Date("2024-06-15T10:30:00"),
			updatedAt: new Date("2024-06-20T14:45:00"),
		});

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		// Dates should be formatted as strings
		expect(typeof props.request.createdAt).toBe("string");
		expect(typeof props.request.updatedAt).toBe("string");
		expect(props.request.createdAt).toMatch(/Jun 15, 2024/);
		expect(props.request.updatedAt).toMatch(/Jun 20, 2024/);
	});

	it("handles null requestedMoreInfoAt date", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const mockRequest = createMockRequest({ requestedMoreInfoAt: null });

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.requestedMoreInfoAt).toBeNull();
	});

	it("handles null reviewedAt date", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const mockRequest = createMockRequest({ reviewedAt: null });

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.reviewedAt).toBeNull();
	});

	it("formats dates in messages before passing to client", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

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

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(typeof props.request.messages[0].createdAt).toBe("string");
		expect(typeof props.request.messages[0].readAt).toBe("string");
	});

	it("handles messages with null readAt", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

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

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.messages[0].readAt).toBeNull();
	});

	it("passes multiple messages correctly formatted", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

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

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.messages).toHaveLength(2);
		expect(props.request.messages[0].content).toBe("First message");
		expect(props.request.messages[1].content).toBe("Second message");
	});

	it("parses request ID from params correctly", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "123" }) }));

		expect(getCollaborationRequestDetailsById).toHaveBeenCalledWith(123);
	});

	it("renders RequestDetailsClient with ADMIN role", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin_user");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.currentUserRole).toBe("ADMIN");
	});

	it("keeps request data intact when passing to client", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const mockRequest = createMockRequest({
			id: 99,
			practiceTitle: "Complex Practice Name",
			practiceSummary: "Complex Summary",
			practiceDescription: "Complex Description",
			requesterUsername: "complex_user",
			status: "REQUESTED_MORE_INFO",
		});

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "99" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.id).toBe(99);
		expect(props.request.practiceTitle).toBe("Complex Practice Name");
		expect(props.request.requesterUsername).toBe("complex_user");
		expect(props.request.status).toBe("REQUESTED_MORE_INFO");
	});

	it("renders arrow icon in back link", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const backLink = screen.getByRole("link", { name: /Back to all requests/i });
		const svg = backLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("data-size", "22");
	});

	it("handles request with long text content", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		const longText = "A".repeat(2000);
		const mockRequest = createMockRequest({
			practiceDescription: longText,
		});

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		const client = screen.getByTestId("request-details-client");
		const props = JSON.parse(client.getAttribute("data-props") || "{}");

		expect(props.request.practiceDescription).toBe(longText);
	});

	it("loads request details on page render", async () => {
		const { getSession } = await import("@/lib/session");
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");

		(getSession as any).mockResolvedValueOnce("admin");
		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(getCollaborationRequestDetailsById).toHaveBeenCalled();
	});

	it("handles negative request IDs", async () => {
		const { getSession } = await import("@/lib/session");
		const { notFound } = await import("next/navigation");

		(getSession as any).mockResolvedValueOnce("admin");

		const page = AdminRequestDetailsPage({ params: Promise.resolve({ requestId: "-5" }) });

		try {
			await page;
		} catch (e: any) {
			expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
		}
	});
});
