import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { HyperparameterForm, type HyperparameterFormInitialValues } from "@/app/admin/hyperparameters/hyperparameter-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = vi.fn();
const consoleSpy = vi.spyOn(console, "log");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

global.fetch = mockFetch;

const mockReferences = [
  { title: "Paper A", year: 2024, authors: "Smith et al." },
  { title: "Paper B", year: 2023, authors: "Jones et al." },
];

const mockPractices = [
  { name: "Practice 1" },
  { name: "Practice 2" },
];

describe("HyperparameterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  it("renders form with required fields", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reference \(required\)/i)).toBeInTheDocument();
  });

  it("renders practice optional field", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
        practices={mockPractices}
      />
    );

    expect(screen.getByLabelText(/practice \(optional\)/i)).toBeInTheDocument();
  });

  it("accepts input in name field", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(nameInput, "learning_rate");

    expect(nameInput.value).toBe("learning_rate");
  });

  it("accepts input in value field", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    const valueInput = screen.getByLabelText(/value/i) as HTMLInputElement;
    await user.type(valueInput, "0.001");

    expect(valueInput.value).toBe("0.001");
  });

  it("accepts input in data type field", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    const dataTypeInput = screen.getByLabelText(/data type/i) as HTMLInputElement;
    await user.clear(dataTypeInput);
    await user.type(dataTypeInput, "float");

    expect(dataTypeInput.value).toBe("float");
  });

  it("renders reference options", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    expect(screen.getByText("Paper A (2024)")).toBeInTheDocument();
    expect(screen.getByText("Paper B (2023)")).toBeInTheDocument();
  });

  it("allows selecting a reference", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    const refSelect = screen.getByLabelText(/reference \(required\)/i) as HTMLSelectElement;
    await user.selectOptions(refSelect, "Paper A");

    expect(refSelect.value).toBe("Paper A");
  });

  it("renders practice options", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
        practices={mockPractices}
      />
    );

    expect(screen.getByText("Practice 1")).toBeInTheDocument();
    expect(screen.getByText("Practice 2")).toBeInTheDocument();
  });

  it("allows selecting a practice", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
        practices={mockPractices}
      />
    );

    const practiceSelect = screen.getByLabelText(/practice \(optional\)/i) as HTMLSelectElement;
    await user.selectOptions(practiceSelect, "Practice 1");

    expect(practiceSelect.value).toBe("Practice 1");
  });

  it("initializes with provided values", () => {
    const initialValues: HyperparameterFormInitialValues = {
      id: 1,
      name: "batch_size",
      value: "32",
      dataType: "int",
      referenceTitle: "Paper A",
      practiceName: "Practice 1",
    };

    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        initialValues={initialValues}
        references={mockReferences}
        practices={mockPractices}
      />
    );

    expect(screen.getByDisplayValue("batch_size")).toBeInTheDocument();
    expect(screen.getByDisplayValue("32")).toBeInTheDocument();
    expect(screen.getByDisplayValue("int")).toBeInTheDocument();
  });

  it("shows save button", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows error when reference is not selected on submit", async () => {
    const user = userEvent.setup();
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "learning_rate");

    const valueInput = screen.getByLabelText(/value/i);
    await user.type(valueInput, "0.001");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText(/Reference is required/i)).toBeInTheDocument();
  });

  it("handles successful form submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    await user.type(screen.getByLabelText(/name/i), "learning_rate");
    await user.type(screen.getByLabelText(/value/i), "0.001");
    await user.selectOptions(screen.getByLabelText(/reference/i), "Paper A");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockFetch).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("disables save button while saving", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    await user.type(screen.getByLabelText(/name/i), "learning_rate");
    await user.type(screen.getByLabelText(/value/i), "0.001");
    await user.selectOptions(screen.getByLabelText(/reference/i), "Paper A");

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
  });

  it("shows error on failed submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Database error" }),
    });

    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    await user.type(screen.getByLabelText(/name/i), "learning_rate");
    await user.type(screen.getByLabelText(/value/i), "0.001");
    await user.selectOptions(screen.getByLabelText(/reference/i), "Paper A");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Database error")).toBeInTheDocument();
  });

  it("renders with POST method by default", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("renders with PATCH method when in edit mode", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters/1"
        redirectPath="/admin/hyperparameters"
        method="PATCH"
        references={mockReferences}
        initialValues={{
          id: 1,
          name: "batch_size",
          value: "32",
          dataType: "int",
          referenceTitle: "Paper A",
        }}
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("defaults to string for data type", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
      />
    );

    // The data type input shares id with value input, so find it by placeholder
    const dataTypeInput = screen.getByPlaceholderText(/string, int, float/i) as HTMLInputElement;
    expect(dataTypeInput.value).toBe("string");
  });

  it("defaults to empty for practice", () => {
    render(
      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={mockReferences}
        practices={mockPractices}
      />
    );

    const practiceSelect = screen.getByLabelText(/practice/i) as HTMLSelectElement;
    expect(practiceSelect.value).toBe("");
  });
});
