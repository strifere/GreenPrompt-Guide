import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EditPracticePage from "@/app/admin/practices/edit/[practiceName]/page";

const getPracticeByNameMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
	$transaction: vi.fn(),
	category: { findMany: vi.fn() },
	promptTechnique: { findMany: vi.fn() },
	model: { findMany: vi.fn() },
	reference: { findMany: vi.fn() },
	hyperparameter: { findMany: vi.fn() },
}));
const practiceFormMock = vi.hoisted(() => vi.fn());

vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/domain/practice-repository", () => ({
	getPracticeByName: getPracticeByNameMock,
}));

vi.mock("@/lib/prisma", () => ({
	prisma: prismaMock,
}));

vi.mock("@/app/admin/practices/practice-form", () => ({
	PracticeForm: (props: unknown) => {
		practiceFormMock(props);
		return <div data-testid="practice-form" />;
	},
}));

function buildPractice() {
	return {
		name: "Constraint-first Prompting",
		description: "Define constraints first.",
		greenScore: 82,
		tactic: "GREEN_PRACTICE",
		categories: [{ category: { name: "Prompt Compression" } }],
		prompts: [{ promptTechnique: { name: "Few-shot" } }],
		models: [{ model: { name: "GPT-4o-mini" } }],
		papers: [{ reference: { title: "Low-energy Prompt Engineering" } }],
		hyperparameters: [{ id: 20 }],
		practiceExamples: [
			{
				scenario: "Summarization",
				originalPrompts: "Summarize this.",
				improvedPrompts: "Summarize in 5 bullets.",
				observations: "Lower token usage.",
			},
		],
		metrics: [
			{
				subtype: "GENERIC",
				title: "Energy use",
				value: "-18%",
				description: null,
				confidence: 0.9,
				energyMetrics: [],
				accuracyMetrics: [],
			},
		],
	};
}

describe("Edit practice page", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("loads the practice and passes edit initial values to the form", async () => {
		getPracticeByNameMock.mockResolvedValueOnce(buildPractice());
		prismaMock.$transaction.mockResolvedValueOnce([
			[{ name: "Prompt Compression", description: null, tactic: "GREEN_PRACTICE" }],
			[{ name: "Few-shot" }],
			[{ name: "GPT-4o-mini" }],
			[{ title: "Low-energy Prompt Engineering", year: 2025 }],
			[{ id: 20, name: "temperature", value: "0.1", dataType: "float", referenceTitle: "Low-energy Prompt Engineering" }],
		]);

		render(
			await EditPracticePage({
				params: Promise.resolve({ practiceName: "Constraint-first%20Prompting" }),
			}),
		);

		expect(screen.getByRole("heading", { name: /modify practice/i })).toBeInTheDocument();
		expect(screen.getByTestId("practice-form")).toBeInTheDocument();
		expect(getPracticeByNameMock).toHaveBeenCalledWith("Constraint-first Prompting");
		expect(practiceFormMock).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: "edit",
				method: "PATCH",
				submitUrl: "/api/admin/practices/Constraint-first%20Prompting",
				initialValues: expect.objectContaining({
					practiceTitle: "Constraint-first Prompting",
					selectedCategoryNames: ["Prompt Compression"],
					selectedPromptTechniqueNames: ["Few-shot"],
					selectedModelNames: ["GPT-4o-mini"],
					selectedReferenceTitles: ["Low-energy Prompt Engineering"],
					selectedHyperparameterIds: [20],
				}),
			}),
		);
	});
});
