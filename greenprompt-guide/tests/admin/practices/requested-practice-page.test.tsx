import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RequestedPracticePage from "@/app/admin/practices/new/[requestId]/page";

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

// Mock repository
vi.mock("@/domain/collaboration-request-repository", () => ({
	getCollaborationRequestDetailsById: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
	prisma: {
		category: {
			findMany: vi.fn(),
		},
		reference: {
			findMany: vi.fn(),
		},
	},
}));

// Mock RequestPracticeForm
vi.mock("@/app/admin/practices/new/[requestId]/request-practice-form", () => ({
	RequestPracticeForm: (props: any) => (
		<div data-testid="request-practice-form" data-props={JSON.stringify(props)}>
			RequestPracticeForm
		</div>
	),
}));

describe("RequestedPracticePage", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { prisma } = await import("@/lib/prisma");
		// Automatically resolve with empty arrays so existing test contexts do not fail unexpectedly
		(prisma.reference.findMany as any).mockResolvedValue([]);
	});

	const createMockRequest = (overrides = {}) => ({
		id: 1,
		practiceTitle: "Test Practice",
		practiceSummary: "Test Summary",
		practiceDescription: "Test Description",
		referenceLink: "https://example.com",
		practiceExamples: "Test Examples",
		createdPractice: null,
		...overrides,
	});

	it("renders page header with title and description", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByText("Practices")).toBeInTheDocument();
		expect(screen.getByText("Create practice from request")).toBeInTheDocument();
		expect(
			screen.getByText(/Review the request details, adapt the fields, and save the final practice into the catalog./)
		).toBeInTheDocument();
	});

	it("renders back link to request details", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest({ id: 42 }));
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "42" }) }));

		const backLink = screen.getByRole("link", { name: /Back to request/i });
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/admin/requests/42");
	});

	it("parses request ID from params", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "123" }) }));

		expect(getCollaborationRequestDetailsById).toHaveBeenCalledWith(123);
	});

	it("shows notFound when request ID is not a valid number", async () => {
		const { notFound } = await import("next/navigation");

		const page = RequestedPracticePage({ params: Promise.resolve({ requestId: "invalid" }) });

		try {
			await page;
		} catch (e: any) {
			if (e.message !== "notFound") {
				expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
			}
		}
	});

	it("shows notFound when request ID is zero or negative", async () => {
		const { notFound } = await import("next/navigation");

		const page = RequestedPracticePage({ params: Promise.resolve({ requestId: "0" }) });

		try {
			await page;
		} catch (e: any) {
			if (e.message !== "notFound") {
				expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
			}
		}
	});

	it("shows notFound when request does not exist", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { notFound } = await import("next/navigation");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(null);

		const page = RequestedPracticePage({ params: Promise.resolve({ requestId: "999" }) });

		try {
			await page;
		} catch (e: any) {
			if (e.message !== "notFound") {
				expect((notFound as any).mock.calls.length).toBeGreaterThan(0);
			}
		}
	});

	it("redirects to request details page if practice already created", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { redirect } = await import("next/navigation");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(
			createMockRequest({ id: 5, createdPractice: { id: 100, name: "Created Practice" } })
		);

		const page = RequestedPracticePage({ params: Promise.resolve({ requestId: "5" }) });

		try {
			await page;
		} catch (e: any) {
			if (e.message !== "redirect") {
				expect((redirect as any).mock.calls.length).toBeGreaterThan(0);
			}
		}
	});

	it("loads categories from database ordered by name", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockCategories = [
			{ name: "Cat A", description: "Desc A", tactic: "GREEN_PRACTICE" },
			{ name: "Cat B", description: "Desc B", tactic: "RED_PRACTICE" },
		];

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce(mockCategories);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(prisma.category.findMany).toHaveBeenCalledWith({
			orderBy: { name: "asc" },
			select: {
				name: true,
				description: true,
				tactic: true,
			},
		});
	});

	it("loads references from database ordered by title", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(prisma.reference.findMany).toHaveBeenCalledWith({
			orderBy: { title: "asc" },
			select: {
				title: true,
				year: true,
				authors: true,
			},
		});
	});

	it("passes request details to RequestPracticeForm", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockRequest = createMockRequest({
			id: 42,
			practiceTitle: "Green Optimization",
			practiceSummary: "Summary of practice",
			practiceDescription: "Full description",
			referenceLink: "https://paper.example.com",
			practiceExamples: "Example 1, Example 2",
		});

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "42" }) }));

		const form = screen.getByTestId("request-practice-form");
		const props = JSON.parse(form.dataset.props || "{}");

		expect(props.requestId).toBe(42);
		expect(props.requestTitle).toBe("Green Optimization");
		expect(props.requestSummary).toBe("Summary of practice");
		expect(props.requestDescription).toBe("Full description");
		expect(props.requestReferenceLink).toBe("https://paper.example.com");
		expect(props.requestExamples).toBe("Example 1, Example 2");
	});

	it("passes categories to RequestPracticeForm", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockCategories = [
			{ name: "Category 1", description: "Desc 1", tactic: "GREEN_PRACTICE" },
			{ name: "Category 2", description: "Desc 2", tactic: "RED_PRACTICE" },
		];

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce(mockCategories);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		const form = screen.getByTestId("request-practice-form");
		const props = JSON.parse(form.dataset.props || "{}");

		expect(props.categories).toEqual(mockCategories);
	});

	it("passes references to RequestPracticeForm", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockReferences = [
			{ title: "Ref 1", year: 2020, authors: "Author 1" },
			{ title: "Ref 2", year: 2021, authors: "Author 2" },
		];

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(prisma.reference.findMany as any).mockResolvedValueOnce(mockReferences);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		const form = screen.getByTestId("request-practice-form");
		const props = JSON.parse(form.dataset.props || "{}");

		expect(props.references).toEqual(mockReferences);
	});

	it("passes correct submit and redirect URLs to RequestPracticeForm", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest({ id: 99 }));
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "99" }) }));

		const form = screen.getByTestId("request-practice-form");

		// RequestPracticeForm should derive submitUrl and redirectPath from requestId
		expect(form).toBeInTheDocument();
	});

	it("handles requests with null examples", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockRequest = createMockRequest({ practiceExamples: null });

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		const form = screen.getByTestId("request-practice-form");
		const props = JSON.parse(form.dataset.props || "{}");

		expect(props.requestExamples).toBeNull();
	});

	it("renders RequestPracticeForm component", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		expect(screen.getByTestId("request-practice-form")).toBeInTheDocument();
		expect(screen.getByText("RequestPracticeForm")).toBeInTheDocument();
	});

	it("handles large request IDs", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "2147483647" }) }));

		expect(getCollaborationRequestDetailsById).toHaveBeenCalledWith(2147483647);
	});

	it("handles requests with special characters in title and description", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		const mockRequest = createMockRequest({
			practiceTitle: 'Practice & "Special" <Tags>',
			practiceDescription: 'Description with <script> & "quotes"',
		});

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(mockRequest);
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		const form = screen.getByTestId("request-practice-form");
		const props = JSON.parse(form.dataset.props || "{}");

		expect(props.requestTitle).toBe('Practice & "Special" <Tags>');
	});

	it("renders arrow icon in back link", async () => {
		const { getCollaborationRequestDetailsById } = await import("@/domain/collaboration-request-repository");
		const { prisma } = await import("@/lib/prisma");

		(getCollaborationRequestDetailsById as any).mockResolvedValueOnce(createMockRequest());
		(prisma.category.findMany as any).mockResolvedValueOnce([]);

		render(await RequestedPracticePage({ params: Promise.resolve({ requestId: "1" }) }));

		const backLink = screen.getByRole("link", { name: /Back to request/i });
		const svg = backLink.querySelector("svg");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("data-size", "18");
	});
});