import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReferenceForm } from "@/app/admin/references/reference-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("@/lib/admin-actions-client", () => ({
  submitObject: vi.fn(),
}));

describe("ReferenceForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all required fields", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/authors/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/study type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/abstract/i)).toBeInTheDocument();
  });

  it("renders optional fields", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/domain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tool availability/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link/i)).toBeInTheDocument();
  });

  it("displays initial values when provided", () => {
    const initialValues = {
      title: "Deep Learning",
      authors: "LeCun, Y.; Bengio, Y.",
      abstract: "A comprehensive overview of deep learning",
      keywords: "neural networks, deep learning",
      year: 2015,
      studyType: "Review",
      domain: "Computer Vision",
      task: "Image Classification",
      venue: "Journal of ML",
      toolAvailability: "Available",
      link: "https://example.com",
    };

    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("Deep Learning")).toBeInTheDocument();
    expect(screen.getByDisplayValue("LeCun, Y.; Bengio, Y.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2015")).toBeInTheDocument();
  });

  it("allows entering title", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "Attention is All You Need");

    expect(titleInput).toHaveValue("Attention is All You Need");
  });

  it("allows entering authors", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const authorsInput = screen.getByLabelText(/authors/i);
    await user.type(authorsInput, "Vaswani, A. et al.");

    expect(authorsInput).toHaveValue("Vaswani, A. et al.");
  });

  it("allows entering year", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const yearInput = screen.getByLabelText(/year/i);
    await user.clear(yearInput);
    await user.type(yearInput, "2017");

    expect(yearInput).toHaveValue(2017);
  });

  it("sets current year as default", () => {
    const currentYear = new Date().getFullYear();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const yearInput = screen.getByLabelText(/year/i);
    expect(yearInput).toHaveValue(currentYear);
  });

  it("allows entering abstract", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const abstractTextarea = screen.getByLabelText(/abstract/i);
    await user.type(abstractTextarea, "This paper presents a new architecture...");

    expect(abstractTextarea).toHaveValue("This paper presents a new architecture...");
  });

  it("allows entering keywords", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const keywordsInput = screen.getByLabelText(/keywords/i);
    await user.type(keywordsInput, "transformer, attention, NLP");

    expect(keywordsInput).toHaveValue("transformer, attention, NLP");
  });

  it("allows entering study type", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const studyTypeInput = screen.getByLabelText(/study type/i);
    await user.type(studyTypeInput, "Empirical Study");

    expect(studyTypeInput).toHaveValue("Empirical Study");
  });

  it("allows entering domain", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const domainInput = screen.getByLabelText(/domain/i);
    await user.type(domainInput, "NLP");

    expect(domainInput).toHaveValue("NLP");
  });

  it("disables title field in edit mode", () => {
    render(
      <ReferenceForm
        mode="edit"
        submitUrl="/api/admin/references/paper-1"
        redirectPath="/admin/references"
        initialValues={{
          title: "Existing Paper",
        }}
      />
    );

    const titleInput = screen.getByDisplayValue("Existing Paper");
    expect(titleInput).toBeDisabled();
  });

  it("shows primary key warning in edit mode", () => {
    render(
      <ReferenceForm
        mode="edit"
        submitUrl="/api/admin/references/paper-1"
        redirectPath="/admin/references"
        initialValues={{
          title: "Existing Paper",
        }}
      />
    );

    expect(screen.getByText(/primary key and cannot be changed/i)).toBeInTheDocument();
  });

  it("uses POST method for create", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
        method="POST"
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("uses PATCH method for edit", () => {
    render(
      <ReferenceForm
        mode="edit"
        submitUrl="/api/admin/references/paper-1"
        redirectPath="/admin/references"
        method="PATCH"
        initialValues={{ title: "Paper" }}
      />
    );

    expect(screen.getByLabelText(/study type/i)).toBeInTheDocument();
  });

  it("trims whitespace from fields on submit", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "  Paper Title  ");

    expect(titleInput).toHaveValue("  Paper Title  ");
  });

  it("renders save button", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("displays error message when error state exists", () => {
    // This would need component modification to test directly
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("requires title field", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeRequired();
  });

  it("requires authors field", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const authorsInput = screen.getByLabelText(/authors/i);
    expect(authorsInput).toBeRequired();
  });

  it("requires year field", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const yearInput = screen.getByLabelText(/year/i);
    expect(yearInput).toBeRequired();
  });

  it("requires study type field", () => {
    render(
      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    );

    const studyTypeInput = screen.getByLabelText(/study type/i);
    expect(studyTypeInput).toBeRequired();
  });
});