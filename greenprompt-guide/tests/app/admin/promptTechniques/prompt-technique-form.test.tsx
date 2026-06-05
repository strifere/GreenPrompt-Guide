import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PromptTechniqueForm } from "@/app/admin/promptTechniques/prompt-technique-form";
import * as adminActionsClient from "@/lib/admin-actions-client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("@/lib/admin-actions-client", () => ({
  submitObject: vi.fn(),
}));

describe("PromptTechniqueForm", () => {
  const mockReferences = [
    { title: "Paper 1", year: 2020, authors: "Author A" },
    { title: "Paper 2", year: 2021, authors: "Author B" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all required fields", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/example/i)).toBeInTheDocument();
  });

  it("displays initial values when provided", () => {
    const initialValues = {
      name: "Few-shot Prompting",
      description: "A technique that uses examples",
      example: "Q: What is 2+2?\nA: 4",
      selectedReferenceTitles: ["Paper 1"],
    };

    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("Few-shot Prompting")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A technique that uses examples")).toBeInTheDocument();
  });

  it("allows entering technique name", async () => {
    const user = userEvent.setup();
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "Chain of Thought");

    expect(nameInput).toHaveValue("Chain of Thought");
  });

  it("allows entering description", async () => {
    const user = userEvent.setup();
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const descriptionTextarea = screen.getByLabelText(/description/i);
    await user.type(descriptionTextarea, "A technique that breaks down reasoning");

    expect(descriptionTextarea).toHaveValue("A technique that breaks down reasoning");
  });

  it("allows entering optional example", async () => {
    const user = userEvent.setup();
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const exampleTextarea = screen.getByLabelText(/example/i);
    await user.type(exampleTextarea, "Let me think through this step by step...");

    expect(exampleTextarea).toHaveValue("Let me think through this step by step...");
  });

  it("disables name field in edit mode", () => {
    render(
      <PromptTechniqueForm
        mode="edit"
        submitUrl="/api/admin/promptTechniques/technique-1"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        initialValues={{
          name: "Existing Technique",
        }}
      />
    );

    const nameInput = screen.getByDisplayValue("Existing Technique");
    expect(nameInput).toBeDisabled();
  });

  it("shows primary key warning in edit mode", () => {
    render(
      <PromptTechniqueForm
        mode="edit"
        submitUrl="/api/admin/promptTechniques/technique-1"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        initialValues={{
          name: "Existing Technique",
        }}
      />
    );

    expect(screen.getByText(/primary key and cannot be changed/i)).toBeInTheDocument();
  });

  it("renders references section", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    expect(screen.getByRole("heading", { name: /References/i })).toBeInTheDocument();
  });

  it("displays reference options as checkboxes", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    expect(screen.getByText(/Paper 1/)).toBeInTheDocument();
    expect(screen.getByText(/Paper 2/)).toBeInTheDocument();
  });

  it("allows selecting references", async () => {
    const user = userEvent.setup();
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const paper1Checkbox = screen.getByRole("checkbox", { name: /Paper 1/ });
    await user.click(paper1Checkbox);

    expect(paper1Checkbox).toBeChecked();
  });

  it("allows deselecting references", async () => {
    const user = userEvent.setup();
    const initialValues = {
      name: "Technique",
      description: "Description",
      selectedReferenceTitles: ["Paper 1"],
    };

    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        initialValues={initialValues}
      />
    );

    const paper1Checkbox = screen.getByRole("checkbox", { name: /Paper 1/ });
    expect(paper1Checkbox).toBeChecked();

    await user.click(paper1Checkbox);
    expect(paper1Checkbox).not.toBeChecked();
  });

  it("displays message when no references available", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={[]}
      />
    );

    expect(screen.getByText(/No references available/i)).toBeInTheDocument();
  });

  it("uses POST method for create", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        method="POST"
      />
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("uses PATCH method for edit", () => {
    render(
      <PromptTechniqueForm
        mode="edit"
        submitUrl="/api/admin/promptTechniques/technique"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
        method="PATCH"
        initialValues={{ name: "Technique" }}
      />
    );

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("renders save button", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("requires name field", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeRequired();
  });

  it("requires description field", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const descriptionTextarea = screen.getByLabelText(/description/i);
    expect(descriptionTextarea).toBeRequired();
  });

  it("includes example placeholder text", () => {
    render(
      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={mockReferences}
      />
    );

    const exampleTextarea = screen.getByLabelText(/example/i);
    expect(exampleTextarea).toHaveAttribute(
      "placeholder",
      expect.stringContaining("illustrative example")
    );
  });
});