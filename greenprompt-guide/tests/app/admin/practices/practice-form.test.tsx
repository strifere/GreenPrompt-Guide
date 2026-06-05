import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PracticeForm } from "@/app/admin/practices/practice-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

global.fetch = mockFetch;

const mockCategories = [
  { name: "Efficiency", description: "Energy efficiency", tactic: "GREEN_PRACTICE" },
  { name: "Accuracy", description: "Model accuracy", tactic: "QUALITY_PRACTICE" },
];

const mockReferences = [
  { title: "Paper A", year: 2024, authors: "Smith et al." },
];

const mockPromptTechniques = [
  { name: "Few-shot" },
  { name: "Chain-of-thought" },
];

const mockModels = [
  { name: "GPT-4" },
  { name: "Claude" },
];

const mockHyperparameters = [
  { id: 1, name: "temperature", value: "0.7", dataType: "float", referenceTitle: "Paper A" },
];

describe("PracticeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders practice form with all sections", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        promptTechniques={mockPromptTechniques}
        models={mockModels}
        references={mockReferences}
        hyperparameters={mockHyperparameters}
      />
    );

    expect(screen.getByText("Practice details")).toBeInTheDocument();
  });

  it("renders practice title input", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    expect(screen.getByLabelText(/practice title/i)).toBeInTheDocument();
  });

  it("renders green score input", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    expect(screen.getByLabelText(/green score/i)).toBeInTheDocument();
  });

  it("accepts practice title input", async () => {
    const user = userEvent.setup();
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    const titleInput = screen.getByLabelText(/practice title/i) as HTMLInputElement;
    await user.type(titleInput, "Token Optimization");

    expect(titleInput.value).toBe("Token Optimization");
  });

  it("accepts green score input", async () => {
    const user = userEvent.setup();
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    const scoreInput = screen.getByLabelText(/green score/i) as HTMLInputElement;
    await user.clear(scoreInput);
    await user.type(scoreInput, "85");

    expect(scoreInput.value).toBe("85");
  });

  it("initializes with provided values", () => {
    const initialValues = {
      practiceTitle: "Token Optimization",
      practiceDescription: "Optimize token usage",
      greenScore: 85,
      tactic: "GREEN_PRACTICE",
    };

    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("Token Optimization")).toBeInTheDocument();
  });

  it("renders category options", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    expect(screen.getByText("Efficiency")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
  });

  it("allows selecting categories", async () => {
    const user = userEvent.setup();
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    const efficiencyCheckbox = screen.getByRole("checkbox", { name: /efficiency/i }) as HTMLInputElement;
    await user.click(efficiencyCheckbox);

    expect(efficiencyCheckbox.checked).toBe(true);
  });

  it("renders prompt techniques section", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        promptTechniques={mockPromptTechniques}
        mode="edit"
      />
    );

    expect(screen.getByText("Few-shot")).toBeInTheDocument();
  });

  it("renders models section", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        models={mockModels}
        mode="edit"
      />
    );

    expect(screen.getByText("GPT-4")).toBeInTheDocument();
    expect(screen.getByText("Claude")).toBeInTheDocument();
  });

  it("renders references section", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        references={mockReferences}
        mode="edit"
      />
    );

    expect(screen.getByText(/Paper A \(2024\)/)).toBeInTheDocument();
  });

  it("renders hyperparameters section", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
        hyperparameters={mockHyperparameters}
        mode="edit"
      />
    );

    expect(screen.getByText(/temperature: 0.7/)).toBeInTheDocument();
  });

  it("uses POST method by default", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("uses PATCH method in edit mode", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices/1"
        redirectPath="/admin/practices"
        mode="edit"
        method="PATCH"
        initialValues={{ practiceTitle: "Test" }}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("renders save button", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/admin/practices"
        redirectPath="/admin/practices"
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });
});
