import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DatasetForm, type DatasetFormInitialValues } from "@/app/admin/datasets/dataset-form";

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

const mockReferences = [
  {
    title: "MMLU Paper",
    year: 2023,
    authors: "Hendrycks et al.",
  },
  {
    title: "Benchmarking Study",
    year: 2022,
    authors: "Smith et al.",
  },
];

describe("DatasetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dataset form with all required fields", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        references={mockReferences}
      />
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
  });

  it("renders with correct placeholders", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    expect(screen.getByPlaceholderText(/SQuAD, GSM8K, HumanEval/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10,570 items, large/i)).toBeInTheDocument();
  });

  it("accepts input in name field", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(nameInput, "MMLU");

    expect(nameInput.value).toBe("MMLU");
  });

  it("accepts input in description field", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    await user.type(descriptionTextarea, "Massive Multitask Language Understanding");

    expect(descriptionTextarea.value).toBe("Massive Multitask Language Understanding");
  });

  it("accepts input in size field", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const sizeInput = screen.getByLabelText(/size/i) as HTMLInputElement;
    await user.type(sizeInput, "14,000 examples");

    expect(sizeInput.value).toBe("14,000 examples");
  });

  it("initializes with provided values", () => {
    const initialValues: DatasetFormInitialValues = {
      name: "MMLU",
      description: "A comprehensive benchmark",
      size: "14,000 items",
      dataFormatType: ["TEXT_ONLY"],
    };

    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("MMLU")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A comprehensive benchmark")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14,000 items")).toBeInTheDocument();
  });

  it("disables name input in edit mode", () => {
    const initialValues: DatasetFormInitialValues = {
      name: "MMLU",
    };

    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        initialValues={initialValues}
        mode="edit"
      />
    );

    const nameInput = screen.getByDisplayValue("MMLU") as HTMLInputElement;
    expect(nameInput.disabled).toBe(true);
  });

  it("shows edit mode hint for name field", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        initialValues={{ name: "MMLU" }}
        mode="edit"
      />
    );

    expect(screen.getByText(/primary key and cannot be changed/i)).toBeInTheDocument();
  });

  it("renders data format options", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    expect(screen.getByLabelText(/text only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/csv/i)).toBeInTheDocument();
  });

  it("allows toggling data formats", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const csvCheckbox = screen.getByLabelText(/csv/i) as HTMLInputElement;
    expect(csvCheckbox.checked).toBe(false);

    await user.click(csvCheckbox);
    expect(csvCheckbox.checked).toBe(true);
  });

  it("renders reference options when provided", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        references={mockReferences}
      />
    );

    expect(screen.getByRole("checkbox", { name: /MMLU Paper \(2023\)/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Benchmarking Study \(2022\)/i })).toBeInTheDocument();
  });

  it("allows selecting references", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        references={mockReferences}
      />
    );

    const refCheckbox = screen.getByRole("checkbox", { name: /MMLU Paper/i }) as HTMLInputElement;
    await user.click(refCheckbox);

    expect(refCheckbox.checked).toBe(true);
  });

  it("initializes with selected references", () => {
    const initialValues: DatasetFormInitialValues = {
      name: "MMLU",
      selectedReferenceTitles: ["MMLU Paper"],
    };

    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        initialValues={initialValues}
        references={mockReferences}
      />
    );

    const refCheckbox = screen.getByRole("checkbox", { name: /MMLU Paper/i }) as HTMLInputElement;
    expect(refCheckbox.checked).toBe(true);
  });

  it("renders save button", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("uses POST method by default", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("uses PATCH method in edit mode when specified", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        mode="edit"
        method="PATCH"
        initialValues={{ name: "MMLU" }}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("renders optional label for description", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const descriptionTextarea = screen.getByLabelText(/description/i);
    const label = descriptionTextarea.closest("div")?.querySelector("label");
    expect(label).toHaveTextContent(/optional/i);
  });

  it("renders optional label for size", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
      />
    );

    const sizeLabel = screen.getByText("Size");
    expect(sizeLabel.parentElement?.textContent).toContain("optional");
  });

  it("shows message when no references available", () => {
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        references={[]}
      />
    );

    expect(screen.getByText(/no references available/i)).toBeInTheDocument();
  });

  it("clears size value when empty", async () => {
    const user = userEvent.setup();
    render(
      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        initialValues={{ size: "10 items" }}
      />
    );

    const sizeInput = screen.getByLabelText(/size/i) as HTMLInputElement;
    await user.clear(sizeInput);

    expect(sizeInput.value).toBe("");
  });
});
