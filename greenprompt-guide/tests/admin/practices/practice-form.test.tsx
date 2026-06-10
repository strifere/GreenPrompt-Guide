import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeForm } from "@/app/admin/practices/practice-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		refresh: vi.fn(),
	})),
}));

// Mock fetch
globalThis.fetch = vi.fn();

describe("PracticeForm Component", () => {
	const mockCategories = [
		{ name: "Category 1", description: "Desc 1", tactic: "GREEN_PRACTICE" },
		{ name: "Category 2", description: "Desc 2", tactic: "RED_PRACTICE" },
	];

	const mockPromptTechniques = [
		{ name: "Chain of Thought" },
		{ name: "Few Shot" },
	];

	const mockModels = [
		{ name: "GPT-4" },
		{ name: "Claude" },
	];

	const mockReferences = [
		{ title: "Reference 1", year: 2023, authors: "Author 1" },
		{ title: "Reference 2", year: 2024, authors: "Author 2" },
	];

	const mockHyperparameters = [
		{ id: 1, name: "temperature", value: "0.7", dataType: "float", referenceTitle: "Reference 1" },
		{ id: 2, name: "max_tokens", value: "2048", dataType: "int", referenceTitle: "Reference 2" },
	];

	const defaultProps = {
		categories: mockCategories,
		submitUrl: "/api/admin/practices",
		redirectPath: "/admin/practices",
		promptTechniques: mockPromptTechniques,
		models: mockModels,
		references: mockReferences,
		hyperparameters: mockHyperparameters,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(globalThis.fetch as any).mockClear();
	});

	describe("Rendering - Basic Fields", () => {
		it("renders practice details section with all basic fields", () => {
			render(<PracticeForm {...defaultProps} />);
			
			expect(screen.getByLabelText("Practice title")).toBeInTheDocument();
			expect(screen.getByLabelText("Green score")).toBeInTheDocument();
			expect(screen.getByLabelText("Practice description")).toBeInTheDocument();
			expect(screen.getByLabelText("Tactic")).toBeInTheDocument();
		});

		it("renders save button", () => {
			render(<PracticeForm {...defaultProps} />);
			expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
		});

		it("initializes with empty values when no initialValues provided", () => {
			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title") as HTMLInputElement;
			const descriptionInput = screen.getByLabelText("Practice description") as HTMLTextAreaElement;
			
			expect(titleInput.value).toBe("");
			expect(descriptionInput.value).toBe("");
		});

		it("initializes with provided initial values", () => {
			const initialValues = {
				practiceTitle: "Test Practice",
				practiceDescription: "Test Description",
				greenScore: 75,
				tactic: "RED_PRACTICE",
			};

			render(<PracticeForm {...defaultProps} initialValues={initialValues} />);
			
			const titleInput = screen.getByLabelText("Practice title") as HTMLInputElement;
			const descriptionInput = screen.getByLabelText("Practice description") as HTMLTextAreaElement;
			const scoreInput = screen.getByLabelText("Green score") as HTMLInputElement;
			const tacticSelect = screen.getByLabelText("Tactic") as HTMLSelectElement;
			
			expect(titleInput.value).toBe("Test Practice");
			expect(descriptionInput.value).toBe("Test Description");
			expect(scoreInput.value).toBe("75");
			expect(tacticSelect.value).toBe("RED_PRACTICE");
		});
	});

	describe("Categories Section - Create Mode", () => {
		it("renders category checkboxes in create mode", () => {
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			expect(screen.getByText("Category 1")).toBeInTheDocument();
			expect(screen.getByText("Category 2")).toBeInTheDocument();
		});

		it("allows toggling category selection", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const checkbox = screen.getAllByRole("checkbox")[0];
			await user.click(checkbox);
			
			expect(checkbox).toBeChecked();
			
			await user.click(checkbox);
			expect(checkbox).not.toBeChecked();
		});

		it("renders create new category checkbox", () => {
			render(<PracticeForm {...defaultProps} mode="create" />);
			expect(screen.getByText("Create a new category too")).toBeInTheDocument();
		});

		it("shows new category fields when create new category is checked", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const createNewCheckbox = screen.getByText("Create a new category too").closest("label")?.querySelector("input[type='checkbox']");
			await user.click(createNewCheckbox!);
			
			expect(screen.getByLabelText("Category name")).toBeInTheDocument();
			expect(screen.getByLabelText("Category description")).toBeInTheDocument();
			expect(screen.getByLabelText("Category tactic")).toBeInTheDocument();
		});

		it("allows entering new category details", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const createNewCheckbox = screen.getByText("Create a new category too").closest("label")?.querySelector("input[type='checkbox']");
			await user.click(createNewCheckbox!);
			
			const nameInput = screen.getByLabelText("Category name") as HTMLInputElement;
			const descInput = screen.getByLabelText("Category description") as HTMLTextAreaElement;
			
			await user.type(nameInput, "New Category");
			await user.type(descInput, "New Category Desc");
			
			expect(nameInput.value).toBe("New Category");
			expect(descInput.value).toBe("New Category Desc");
		});
	});

	describe("Practice Examples - Add/Remove", () => {
		it("renders with one empty example by default", () => {
			render(<PracticeForm {...defaultProps} />);
			expect(screen.getByText("Example 1")).toBeInTheDocument();
			expect(screen.getByLabelText("Scenario")).toBeInTheDocument();
		});

		it("renders add example button", () => {
			render(<PracticeForm {...defaultProps} />);
			expect(screen.getByRole("button", { name: /Add example/i })).toBeInTheDocument();
		});

		it("adds new example when add button is clicked", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const addButton = screen.getByRole("button", { name: /Add example/i });
			await user.click(addButton);
			
			expect(screen.getByText("Example 2")).toBeInTheDocument();
		});

		it("displays remove button only when multiple examples exist", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			let removeButtons = screen.queryAllByRole("button", { name: /Remove/i });
			expect(removeButtons).toHaveLength(0);
			
			const addButton = screen.getByRole("button", { name: /Add example/i });
			await user.click(addButton);
			
			removeButtons = screen.getAllByRole("button", { name: /Remove/i });
			expect(removeButtons.length).toBeGreaterThan(0);
		});

		it("removes example when remove button is clicked", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const addButton = screen.getByRole("button", { name: /Add example/i });
			await user.click(addButton);
			await user.click(addButton);
			
			expect(screen.getByText("Example 3")).toBeInTheDocument();
			
			const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
			await user.click(removeButtons[1]);
			
			expect(screen.queryByText("Example 3")).not.toBeInTheDocument();
		});

		it("always keeps at least one example when removing", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const addButton = screen.getByRole("button", { name: /Add example/i });
			await user.click(addButton);
			
			const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
			await user.click(removeButtons[0]);
			await user.click(removeButtons[0]);
			
			expect(screen.getByText("Example 1")).toBeInTheDocument();
		});
	});

	describe("Example Fields - Data Entry", () => {
		it("allows updating example scenario", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const scenarioInput = screen.getByLabelText("Scenario") as HTMLInputElement;
			await user.type(scenarioInput, "Test scenario");
			
			expect(scenarioInput.value).toBe("Test scenario");
		});

		it("allows updating example original prompts", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const originalInput = screen.getByLabelText("Original prompts") as HTMLTextAreaElement;
			await user.type(originalInput, "Original prompt text");
			
			expect(originalInput.value).toBe("Original prompt text");
		});

		it("allows updating example improved prompts", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const improvedInput = screen.getByLabelText("Improved prompts") as HTMLTextAreaElement;
			await user.type(improvedInput, "Improved prompt text");
			
			expect(improvedInput.value).toBe("Improved prompt text");
		});

		it("allows updating example observations", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} />);
			
			const observationsInput = screen.getByLabelText("Observations") as HTMLTextAreaElement;
			await user.type(observationsInput, "Test observations");
			
			expect(observationsInput.value).toBe("Test observations");
		});

		it("initializes examples from initialValues", () => {
			const initialValues = {
				examples: [
					{
						scenario: "Test Scenario",
						originalPrompts: "Original",
						improvedPrompts: "Improved",
						observations: "Observations",
					},
				],
			};

			render(<PracticeForm {...defaultProps} initialValues={initialValues} />);
			
			const scenarioInput = screen.getByLabelText("Scenario") as HTMLInputElement;
			expect(scenarioInput.value).toBe("Test Scenario");
		});
	});

	describe("Reference Section - Create Mode", () => {
		it("renders reference mode toggle when references exist", () => {
			render(<PracticeForm {...defaultProps} mode="create" />);
			expect(screen.getByText("Use an existing reference")).toBeInTheDocument();
			expect(screen.getByText("Create a new reference")).toBeInTheDocument();
		});

		it("shows existing reference dropdown when mode is existing", async () => {
			userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const existingRadio = screen.getByLabelText("Use an existing reference") as HTMLInputElement;
			expect(existingRadio.checked).toBe(true);
			
			expect(screen.getByLabelText("Available references")).toBeInTheDocument();
		});

		it("shows new reference fields when mode is new and no existing references", () => {
			render(<PracticeForm {...defaultProps} references={[]} mode="create" />);
			
			expect(screen.getByLabelText("Title")).toBeInTheDocument();
			expect(screen.getByLabelText("Authors")).toBeInTheDocument();
			expect(screen.getByLabelText("Abstract")).toBeInTheDocument();
		});

		it("switches reference mode from existing to new", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const newRadio = screen.getByLabelText("Create a new reference") as HTMLInputElement;
			await user.click(newRadio);
			
			expect(newRadio.checked).toBe(true);
			expect(screen.getByLabelText("Title")).toBeInTheDocument();
		});

		it("allows entering all new reference fields", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} references={[]} mode="create" />);
			
			const titleInput = screen.getByLabelText("Title") as HTMLInputElement;
			const authorsInput = screen.getByLabelText("Authors") as HTMLInputElement;
			const abstractInput = screen.getByLabelText("Abstract") as HTMLTextAreaElement;
			const keywordsInput = screen.getByLabelText("Keywords") as HTMLInputElement;
			const yearInput = screen.getByLabelText("Year") as HTMLInputElement;
			const studyTypeInput = screen.getByLabelText("Study type") as HTMLInputElement;
			
			await user.type(titleInput, "New Reference");
			await user.type(authorsInput, "Author Names");
			await user.type(abstractInput, "Abstract content");
			await user.type(keywordsInput, "keyword1, keyword2");
			await user.clear(yearInput);
			await user.type(yearInput, "2024");
			await user.type(studyTypeInput, "Research Paper");
			
			expect(titleInput.value).toBe("New Reference");
			expect(authorsInput.value).toBe("Author Names");
			expect(abstractInput.value).toBe("Abstract content");
			expect(yearInput.value).toBe("2024");
		});
	});

	describe("Edit Mode - Additional Sections", () => {
		it("renders category checkboxes in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText("Category 1")).toBeInTheDocument();
			expect(screen.getByText("Category 2")).toBeInTheDocument();
		});

		it("renders prompt techniques section in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText("Chain of Thought")).toBeInTheDocument();
			expect(screen.getByText("Few Shot")).toBeInTheDocument();
		});

		it("renders models section in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText("GPT-4")).toBeInTheDocument();
			expect(screen.getByText("Claude")).toBeInTheDocument();
		});

		it("renders hyperparameters section in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText(/temperature: 0.7/)).toBeInTheDocument();
			expect(screen.getByText(/max_tokens: 2048/)).toBeInTheDocument();
		});

		it("allows toggling prompt technique selection in edit mode", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const checkboxes = screen.getAllByRole("checkbox");
			const chainOfThoughtCheckbox = checkboxes.find((cb) => 
				cb.closest("label")?.textContent?.includes("Chain of Thought")
			);
			
			await user.click(chainOfThoughtCheckbox!);
			expect(chainOfThoughtCheckbox).toBeChecked();
		});

		it("allows toggling model selection in edit mode", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const checkboxes = screen.getAllByRole("checkbox");
			const gpt4Checkbox = checkboxes.find((cb) =>
				cb.closest("label")?.textContent?.includes("GPT-4")
			);
			
			await user.click(gpt4Checkbox!);
			expect(gpt4Checkbox).toBeChecked();
		});

		it("initializes with pre-selected categories from initial values in edit mode", () => {
			const initialValues = {
				selectedCategoryNames: ["Category 1"],
				selectedPromptTechniqueNames: ["Chain of Thought"],
				selectedModelNames: ["GPT-4"],
			};

			render(<PracticeForm {...defaultProps} mode="edit" initialValues={initialValues} />);
			
			const checkboxes = screen.getAllByRole("checkbox");
			const category1Checkbox = checkboxes.find((cb) =>
				cb.closest("label")?.textContent?.includes("Category 1")
			) as HTMLInputElement;
			
			expect(category1Checkbox.checked).toBe(true);
		});
	});

	describe("Metrics Section - Edit Mode Only", () => {
		it("renders metrics section only in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="create" />);
			expect(screen.queryByText("Metrics")).not.toBeInTheDocument();
			
			const { unmount } = render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText("Metrics")).toBeInTheDocument();
			unmount();
		});

		it("renders with one empty metric in edit mode", () => {
			render(<PracticeForm {...defaultProps} mode="edit" />);
			expect(screen.getByText("Metric 1")).toBeInTheDocument();
			expect(screen.getByLabelText("Metric type")).toBeInTheDocument();
		});

		it("adds metric when add button clicked", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const addMetricButton = screen.getAllByRole("button", { name: /Add metric/i })[0];
			await user.click(addMetricButton);
			
			expect(screen.getByText("Metric 2")).toBeInTheDocument();
		});

		it("removes metric when remove button clicked", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const addMetricButton = screen.getAllByRole("button", { name: /Add metric/i })[0];
			await user.click(addMetricButton);
			
			const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
			const metricRemoveButton = removeButtons.at(-1) as HTMLButtonElement;
			await user.click(metricRemoveButton);
			
			expect(screen.queryByText("Metric 2")).not.toBeInTheDocument();
		});

		it("updates metric title", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricTitleInput = screen.getByLabelText("Title") as HTMLInputElement;
			await user.type(metricTitleInput, "Energy Reduction");
			
			expect(metricTitleInput.value).toBe("Energy Reduction");
		});

		it("updates metric value", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricValueInput = screen.getByLabelText("Value") as HTMLInputElement;
			await user.type(metricValueInput, "25%");
			
			expect(metricValueInput.value).toBe("25%");
		});

		it("changes metric type and shows energy-specific fields", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricTypeSelect = screen.getByLabelText("Metric type") as HTMLSelectElement;
			await user.selectOptions(metricTypeSelect, "ENERGY");
			
			expect(screen.getByLabelText("Energy type")).toBeInTheDocument();
			expect(screen.getByLabelText("Unit")).toBeInTheDocument();
			expect(screen.getByLabelText("Min value")).toBeInTheDocument();
			expect(screen.getByLabelText("Max value")).toBeInTheDocument();
			expect(screen.getByLabelText("Best guess value")).toBeInTheDocument();
		});

		it("changes metric type and shows accuracy-specific fields", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricTypeSelect = screen.getByLabelText("Metric type") as HTMLSelectElement;
			await user.selectOptions(metricTypeSelect, "ACCURACY");
			
			expect(screen.getByLabelText("Accuracy level")).toBeInTheDocument();
			expect(screen.getByLabelText("Score")).toBeInTheDocument();
		});

		it("allows updating energy metric fields", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricTypeSelect = screen.getByLabelText("Metric type") as HTMLSelectElement;
			await user.selectOptions(metricTypeSelect, "ENERGY");
			
			const energyTypeSelect = screen.getByLabelText("Energy type") as HTMLSelectElement;
			await user.selectOptions(energyTypeSelect, "REDUCTION");
			
			const minInput = screen.getByLabelText("Min value") as HTMLInputElement;
			await user.type(minInput, "10");
			
			expect(energyTypeSelect.value).toBe("REDUCTION");
			expect(minInput.value).toBe("10");
		});

		it("allows updating accuracy metric fields", async () => {
			const user = userEvent.setup();
			render(<PracticeForm {...defaultProps} mode="edit" />);
			
			const metricTypeSelect = screen.getByLabelText("Metric type") as HTMLSelectElement;
			await user.selectOptions(metricTypeSelect, "ACCURACY");
			
			const accuracyLevelSelect = screen.getByLabelText("Accuracy level") as HTMLSelectElement;
			await user.selectOptions(accuracyLevelSelect, "BETTER");
			
			expect(accuracyLevelSelect.value).toBe("BETTER");
		});
	});

	describe("Source Information Display", () => {
		it("displays source information when provided", () => {
			const source = {
				title: "Requested Practice",
				summary: "This is a summary",
				description: "Full description",
				examples: "Some examples",
			};

			render(<PracticeForm {...defaultProps} source={source} />);
			
			expect(screen.getByText("Requested practice")).toBeInTheDocument();
			expect(screen.getByText("Requested Practice")).toBeInTheDocument();
			expect(screen.getByText("This is a summary")).toBeInTheDocument();
			expect(screen.getByText("Full description")).toBeInTheDocument();
			expect(screen.getByText("Request examples")).toBeInTheDocument();
		});

		it("does not display source when not provided", () => {
			render(<PracticeForm {...defaultProps} />);
			expect(screen.queryByText("Requested practice")).not.toBeInTheDocument();
		});
	});

	describe("Form Submission - Create Mode", () => {
		it("submits form with correct data structure", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			render(<PracticeForm {...defaultProps} mode="create" />);
			
			const titleInput = screen.getByLabelText("Practice title") as HTMLInputElement;
			const descriptionInput = screen.getByLabelText("Practice description") as HTMLTextAreaElement;
			const greenScoreInput = screen.getByLabelText("Green score") as HTMLInputElement;
			
			await user.type(titleInput, "Test Practice");
			await user.type(descriptionInput, "Test Description");
			await user.clear(greenScoreInput);
			await user.type(greenScoreInput, "75");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/practices",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.stringContaining("Test Practice"),
				})
			);
		});

		it("shows saving state during submission", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockImplementationOnce(
				() => new Promise((resolve) => 
					setTimeout(() => resolve({
						ok: true,
						json: async () => ({}),
					}), 100)
				)
			);

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title") as HTMLInputElement;
			const descriptionInput = screen.getByLabelText("Practice description") as HTMLTextAreaElement;
			
			await user.type(titleInput, "Test");
			await user.type(descriptionInput, "Test");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			expect(screen.getByRole("button", { name: /Saving/i })).toBeInTheDocument();
		});

		it("displays error message on submission failure", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Failed to save practice" }),
			});

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title");
			const descriptionInput = screen.getByLabelText("Practice description");
			
			await user.type(titleInput, "Test");
			await user.type(descriptionInput, "Test");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			expect(await screen.findByText("Failed to save practice")).toBeInTheDocument();
		});

		it("disables submit button while saving", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockImplementationOnce(
				() => new Promise((resolve) => 
					setTimeout(() => resolve({
						ok: true,
						json: async () => ({}),
					}), 50)
				)
			);

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title");
			const descriptionInput = screen.getByLabelText("Practice description");
			
			await user.type(titleInput, "Test");
			await user.type(descriptionInput, "Test");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			expect(submitButton).toBeDisabled();
		});
	});

	describe("Form Submission - Edit Mode", () => {
		it("submits form with PATCH method in edit mode", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const initialValues = {
				practiceTitle: "Existing Practice",
				practiceDescription: "Existing Description",
				selectedCategoryNames: ["Category 1"],
				selectedPromptTechniqueNames: ["Chain of Thought"],
				selectedModelNames: ["GPT-4"],
				selectedReferenceTitles: ["Reference 1"],
				selectedHyperparameterIds: [1],
			};

			render(
				<PracticeForm
					{...defaultProps}
					mode="edit"
					method="PATCH"
					submitUrl="/api/admin/practices/1"
					initialValues={initialValues}
				/>
			);
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/admin/practices/1",
				expect.objectContaining({
					method: "PATCH",
				})
			);
		});

		it("includes selected items in edit mode submission", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const initialValues = {
				practiceTitle: "Test",
				practiceDescription: "Test Desc",
				selectedCategoryNames: ["Category 1"],
				selectedPromptTechniqueNames: ["Chain of Thought"],
				selectedModelNames: ["GPT-4"],
				selectedReferenceTitles: ["Reference 1"],
				selectedHyperparameterIds: [1],
			};

			render(
				<PracticeForm
					{...defaultProps}
					mode="edit"
					method="PATCH"
					submitUrl="/api/admin/practices/1"
					initialValues={initialValues}
				/>
			);
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.categoryNames).toEqual(["Category 1"]);
			expect(callBody.promptTechniqueNames).toEqual(["Chain of Thought"]);
			expect(callBody.modelNames).toEqual(["GPT-4"]);
		});
	});

	describe("Utility Functions - Metadata", () => {
		it("trims whitespace from form inputs before submission", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title");
			const descriptionInput = screen.getByLabelText("Practice description");
			
			await user.type(titleInput, "  Test Practice  ");
			await user.type(descriptionInput, "  Test Description  ");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.practice.name).toBe("Test Practice");
			expect(callBody.practice.description).toBe("Test Description");
		});

		it("converts green score to number on submission", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title");
			const descriptionInput = screen.getByLabelText("Practice description");
			const greenScoreInput = screen.getByLabelText("Green score");
			
			await user.type(titleInput, "Test");
			await user.type(descriptionInput, "Test");
			await user.clear(greenScoreInput);
			await user.type(greenScoreInput, "85");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.practice.greenScore).toBe(85);
			expect(typeof callBody.practice.greenScore).toBe("number");
		});

		it("includes tactic field in submission", async () => {
			const user = userEvent.setup();
			const mockFetch = globalThis.fetch as any;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			render(<PracticeForm {...defaultProps} />);
			
			const titleInput = screen.getByLabelText("Practice title");
			const descriptionInput = screen.getByLabelText("Practice description");
			const tacticSelect = screen.getByLabelText("Tactic");
			
			await user.type(titleInput, "Test");
			await user.type(descriptionInput, "Test");
			await user.selectOptions(tacticSelect, "RED_PRACTICE");
			
			const submitButton = screen.getByRole("button", { name: /Save/i });
			await user.click(submitButton);
			
			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.practice.tactic).toBe("RED_PRACTICE");
		});
	});
});
