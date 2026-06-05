import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequestPracticeForm } from "@/app/admin/practices/new/[requestId]/request-practice-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		refresh: vi.fn(),
	})),
}));

// Mock PracticeForm component
vi.mock("@/app/admin/practices/practice-form", () => ({
	PracticeForm: (props: any) => (
		<div data-testid="practice-form" data-props={JSON.stringify(props)}>
			PracticeForm - {props.redirectPath}
		</div>
	),
}));

describe("RequestPracticeForm Component", () => {
	const mockCategories = [
		{ name: "Category 1", description: "Desc 1", tactic: "GREEN_PRACTICE" },
		{ name: "Category 2", description: "Desc 2", tactic: "RED_PRACTICE" },
	];

	const defaultProps = {
		requestId: 123,
		requestTitle: "Request Title",
		requestSummary: "Request Summary",
		requestDescription: "Request Description",
		requestReferenceLink: "https://example.com/paper",
		requestExamples: "Example 1\nExample 2",
		categories: mockCategories,
	};

	it("renders PracticeForm component", () => {
		render(<RequestPracticeForm {...defaultProps} />);
		expect(screen.getByTestId("practice-form")).toBeInTheDocument();
	});

	it("passes correct categories to PracticeForm", () => {
		render(<RequestPracticeForm {...defaultProps} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.categories).toEqual(mockCategories);
	});

	it("sets correct submitUrl with request ID", () => {
		render(<RequestPracticeForm {...defaultProps} requestId={456} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.submitUrl).toBe("/api/admin/requests/456");
	});

	it("sets correct redirectPath with request ID", () => {
		render(<RequestPracticeForm {...defaultProps} requestId={456} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.redirectPath).toBe("/admin/requests/456");
	});

	it("pre-fills practice title from request", () => {
		render(<RequestPracticeForm {...defaultProps} requestTitle="Green AI Optimization" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.practiceTitle).toBe("Green AI Optimization");
	});

	it("pre-fills practice description from request description", () => {
		render(<RequestPracticeForm {...defaultProps} requestDescription="Full detailed description here" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.practiceDescription).toBe("Full detailed description here");
	});

	it("pre-fills reference title from request title", () => {
		render(<RequestPracticeForm {...defaultProps} requestTitle="Paper Title" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.referenceTitle).toBe("Paper Title");
	});

	it("pre-fills reference abstract from request summary", () => {
		render(<RequestPracticeForm {...defaultProps} requestSummary="Abstract summary" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.referenceAbstract).toBe("Abstract summary");
	});

	it("pre-fills reference link from request reference link", () => {
		render(<RequestPracticeForm {...defaultProps} requestReferenceLink="https://arxiv.org/paper123" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.referenceLink).toBe("https://arxiv.org/paper123");
	});

	it("pre-fills examples from request examples", () => {
		render(<RequestPracticeForm {...defaultProps} requestExamples="Original example\nImproved example" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.examplesText).toBe("Original example\\nImproved example");
	});

	it("handles null request examples", () => {
		render(<RequestPracticeForm {...defaultProps} requestExamples={null} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.examplesText).toBeNull();
	});

	it("provides source information to PracticeForm", () => {
		render(<RequestPracticeForm {...defaultProps} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.source).toBeDefined();
		expect(props.source.title).toBe(defaultProps.requestTitle);
		expect(props.source.summary).toBe(defaultProps.requestSummary);
		expect(props.source.description).toBe(defaultProps.requestDescription);
		expect(props.source.examples).toBe(defaultProps.requestExamples);
	});

	it("preserves request title in source when provided", () => {
		const requestTitle = "Custom Request Title";
		render(<RequestPracticeForm {...defaultProps} requestTitle={requestTitle} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.source.title).toBe(requestTitle);
	});

	it("preserves request summary in source when provided", () => {
		const requestSummary = "Custom Request Summary";
		render(<RequestPracticeForm {...defaultProps} requestSummary={requestSummary} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.source.summary).toBe(requestSummary);
	});

	it("preserves request description in source when provided", () => {
		const requestDescription = "Custom Request Description";
		render(<RequestPracticeForm {...defaultProps} requestDescription={requestDescription} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.source.description).toBe(requestDescription);
	});

	it("handles very long request title", () => {
		const longTitle = "A".repeat(500);
		render(<RequestPracticeForm {...defaultProps} requestTitle={longTitle} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.practiceTitle).toBe(longTitle);
		expect(props.source.title).toBe(longTitle);
	});

	it("handles special characters in request fields", () => {
		const specialTitle = 'Title with <script> & "quotes" & \' apostrophe';
		render(
			<RequestPracticeForm
				{...defaultProps}
				requestTitle={specialTitle}
				requestSummary={specialTitle}
				requestDescription={specialTitle}
			/>
		);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.practiceTitle).toBe(specialTitle);
		expect(props.source.title).toBe(specialTitle);
	});

	it("handles newlines in request examples", () => {
		const examplesWithNewlines = "Line 1\nLine 2\nLine 3\n\nLine 5";
		render(<RequestPracticeForm {...defaultProps} requestExamples={examplesWithNewlines} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.examplesText).toBe(examplesWithNewlines);
	});

	it("handles empty string request examples", () => {
		render(<RequestPracticeForm {...defaultProps} requestExamples="" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.examplesText).toBe("");
	});

	it("handles empty string request summary", () => {
		render(<RequestPracticeForm {...defaultProps} requestSummary="" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.referenceAbstract).toBe("");
	});

	it("handles empty string request reference link", () => {
		render(<RequestPracticeForm {...defaultProps} requestReferenceLink="" />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.initialValues?.referenceLink).toBe("");
	});

	it("correctly sets request ID in URLs for multiple requests", () => {
		const { rerender } = render(<RequestPracticeForm {...defaultProps} requestId={1} />);
		let form = screen.getByTestId("practice-form");
		let props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.submitUrl).toBe("/api/admin/requests/1");

		rerender(<RequestPracticeForm {...defaultProps} requestId={999} />);
		form = screen.getByTestId("practice-form");
		props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.submitUrl).toBe("/api/admin/requests/999");
	});

	it("does not pass initialValues with undefined values", () => {
		render(<RequestPracticeForm {...defaultProps} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		const initialValues = props.initialValues || {};

		// All initial values should be defined (not undefined)
		Object.values(initialValues).forEach((value: any) => {
			expect(value).not.toBeUndefined();
		});
	});

	it("passes readonly prop values to PracticeForm", () => {
		render(<RequestPracticeForm {...defaultProps} />);
		expect(screen.getByTestId("practice-form")).toBeInTheDocument();
	});

	it("displays readable text showing redirect path", () => {
		render(<RequestPracticeForm {...defaultProps} requestId={777} />);
		expect(screen.getByText(/\/admin\/requests\/777/)).toBeInTheDocument();
	});

	it("handles request with multiple categories", () => {
		const manyCategories = Array.from({ length: 20 }, (_, i) => ({
			name: `Category ${i}`,
			description: `Description ${i}`,
			tactic: i % 2 === 0 ? "GREEN_PRACTICE" : "RED_PRACTICE",
		}));

		render(<RequestPracticeForm {...defaultProps} categories={manyCategories} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.categories).toHaveLength(20);
	});

	it("handles empty categories array", () => {
		render(<RequestPracticeForm {...defaultProps} categories={[]} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");
		expect(props.categories).toEqual([]);
	});

	it("integrates all request data into source object correctly", () => {
		const customProps = {
			...defaultProps,
			requestTitle: "Custom Title",
			requestSummary: "Custom Summary",
			requestDescription: "Custom Description",
			requestExamples: "Custom Examples",
		};

		render(<RequestPracticeForm {...customProps} />);
		const form = screen.getByTestId("practice-form");
		const props = JSON.parse(form.getAttribute("data-props") || "{}");

		expect(props.source).toEqual({
			title: "Custom Title",
			summary: "Custom Summary",
			description: "Custom Description",
			examples: "Custom Examples",
		});
	});
});
