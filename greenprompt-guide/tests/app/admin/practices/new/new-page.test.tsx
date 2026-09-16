import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NewPracticePage from "@/app/admin/practices/new/page";

// Mock next/link
vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
	ArrowLeft: ({ size, className }: any) => <svg className={className} data-size={size} />,
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
	prisma: {
		category: {
			findMany: vi.fn(),
		},
	},
}));

// Mock repository
vi.mock("@/domain/reference-repository", () => ({
	listReferences: vi.fn(),
}));

// Mock PracticeForm component
vi.mock("@/app/admin/practices/practice-form", () => ({
	PracticeForm: ({ categories, references, submitUrl, redirectPath }: any) => (
		<div data-testid="practice-form" data-categories={JSON.stringify(categories)} data-references={JSON.stringify(references)} data-submit-url={submitUrl} data-redirect-path={redirectPath}>
			Practice Form
		</div>
	),
}));

describe("NewPracticePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page header with title and description", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		expect(screen.getByText("Practices")).toBeInTheDocument();
		expect(screen.getByText("Create practice")).toBeInTheDocument();
		expect(
			screen.getByText(/Add a catalog practice directly, including its reference, category, and examples./)
		).toBeInTheDocument();
	});

	it("renders back link to practices list", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		const backLink = screen.getByRole("link", { name: /Back to practices/i });
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/admin/practices");
	});

	it("renders arrow icon in header", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		const svg = screen.getByRole("link", { name: /Back to practices/i }).querySelector("svg");
		expect(svg).toBeInTheDocument();
	});

	it("loads categories from database ordered by name", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		const mockCategories = [
			{ name: "Category A", description: "Desc A", tactic: "GREEN_PRACTICE" },
			{ name: "Category B", description: "Desc B", tactic: "RED_PRACTICE" },
		];

		(prisma.category.findMany as any).mockResolvedValueOnce(mockCategories);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		expect(prisma.category.findMany).toHaveBeenCalledWith({
			orderBy: { name: "asc" },
			select: {
				name: true,
				description: true,
				tactic: true,
			},
		});

		const form = screen.getByTestId("practice-form");
		expect(form).toHaveAttribute("data-categories", JSON.stringify(mockCategories));
	});

	it("loads references from repository", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		const mockReferences = [
			{ title: "Ref 1", year: 2023, authors: "Author 1" },
			{ title: "Ref 2", year: 2024, authors: "Author 2" },
		];

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce(mockReferences);

		render(await NewPracticePage());

		expect(listReferences).toHaveBeenCalled();

		const form = screen.getByTestId("practice-form");
		expect(form).toHaveAttribute("data-references", JSON.stringify(mockReferences));
	});

	it("passes correct props to PracticeForm component", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		const mockCategories = [{ name: "Cat 1", description: "Desc", tactic: "GREEN_PRACTICE" }];
		const mockReferences = [{ title: "Ref 1", year: 2023, authors: "Author" }];

		(prisma.category.findMany as any).mockResolvedValueOnce(mockCategories);
		(listReferences as any).mockResolvedValueOnce(mockReferences);

		render(await NewPracticePage());

		const form = screen.getByTestId("practice-form");
		expect(form).toHaveAttribute("data-submit-url", "/api/admin/practices");
		expect(form).toHaveAttribute("data-redirect-path", "/admin/practices");
	});

	it("renders PracticeForm component", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		expect(screen.getByTestId("practice-form")).toBeInTheDocument();
		expect(screen.getByText("Practice Form")).toBeInTheDocument();
	});

	it("handles empty categories list", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		const form = screen.getByTestId("practice-form");
		const categories = JSON.parse(form.getAttribute("data-categories") || "[]");
		expect(categories).toEqual([]);
	});

	it("handles empty references list", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		(prisma.category.findMany as any).mockResolvedValueOnce([]);
		(listReferences as any).mockResolvedValueOnce([]);

		render(await NewPracticePage());

		const form = screen.getByTestId("practice-form");
		const references = JSON.parse(form.getAttribute("data-references") || "[]");
		expect(references).toEqual([]);
	});

	it("handles multiple categories and references", async () => {
		const { prisma } = await import("@/lib/prisma");
		const { listReferences } = await import("@/domain/reference-repository");

		const mockCategories = Array.from({ length: 5 }, (_, i) => ({
			name: `Category ${i + 1}`,
			description: `Desc ${i + 1}`,
			tactic: i % 2 === 0 ? "GREEN_PRACTICE" : "RED_PRACTICE",
		}));

		const mockReferences = Array.from({ length: 3 }, (_, i) => ({
			title: `Reference ${i + 1}`,
			year: 2020 + i,
			authors: `Author ${i + 1}`,
		}));

		(prisma.category.findMany as any).mockResolvedValueOnce(mockCategories);
		(listReferences as any).mockResolvedValueOnce(mockReferences);

		render(await NewPracticePage());

		const form = screen.getByTestId("practice-form");
		const categories = JSON.parse(form.getAttribute("data-categories") || "[]");
		const references = JSON.parse(form.getAttribute("data-references") || "[]");

		expect(categories).toHaveLength(5);
		expect(references).toHaveLength(3);
	});
});
