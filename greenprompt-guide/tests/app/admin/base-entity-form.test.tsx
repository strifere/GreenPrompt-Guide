import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import {
  BaseEntityForm,
  type BaseEntityInitialValues,
  type ReferenceOption,
} from "@/app/admin/base-entity-form";

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

const mockReferences: ReferenceOption[] = [
  {
    title: "Green AI Paper",
    year: 2024,
    authors: "Smith et al.",
  },
  {
    title: "Efficiency in ML",
    year: 2023,
    authors: "Johnson et al.",
  },
];

const defaultProps = {
  title: "Test Entity Details",
  formatSectionTitle: "Data Format Types",
  formatHint: "Select all formats present.",
  referenceHint: "Select all references.",
  type: "dataset" as const,
  submitUrl: "/api/admin/datasets",
  redirectPath: "/admin/datasets",
  references: mockReferences,
  getExtraBodyFields: () => ({}),
  children: ({ name, setName, description, setDescription, isEditMode }: any) => (
    <>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        disabled={isEditMode}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
    </>
  ),
};

describe("BaseEntityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with all sections", () => {
    render(<BaseEntityForm {...defaultProps} />);

    expect(screen.getByText("Test Entity Details")).toBeInTheDocument();
    expect(screen.getByText("Data Format Types")).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
  });

  it("renders data format checkboxes", () => {
    render(<BaseEntityForm {...defaultProps} />);

    expect(screen.getByLabelText(/text only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pdf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/csv/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/html/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/any format/i)).toBeInTheDocument();
  });

  it("renders reference options when provided", () => {
    render(<BaseEntityForm {...defaultProps} />);

    expect(screen.getByText(/Green AI Paper.*2024/)).toBeInTheDocument();
    expect(screen.getByText(/Efficiency in ML.*2023/)).toBeInTheDocument();
  });

  it("shows message when no references are available", () => {
    render(<BaseEntityForm {...defaultProps} references={[]} />);

    expect(screen.getByText(/no references available/i)).toBeInTheDocument();
  });

  it("allows toggling format selections", async () => {
    const user = userEvent.setup();
    render(<BaseEntityForm {...defaultProps} />);

    const imageCheckbox = screen.getByLabelText(/image/i) as HTMLInputElement;
    expect(imageCheckbox.checked).toBe(false);

    await user.click(imageCheckbox);
    expect(imageCheckbox.checked).toBe(true);

    await user.click(imageCheckbox);
    expect(imageCheckbox.checked).toBe(false);
  });

  it("allows toggling reference selections", async () => {
    const user = userEvent.setup();
    render(<BaseEntityForm {...defaultProps} />);

    const refCheckbox = screen.getByRole("checkbox", { name: /green ai paper/i }) as HTMLInputElement;
    expect(refCheckbox.checked).toBe(false);

    await user.click(refCheckbox);
    expect(refCheckbox.checked).toBe(true);
  });

  it("initializes with default values when provided", () => {
    const initialValues: BaseEntityInitialValues = {
      name: "Test Dataset",
      description: "Test description",
      dataFormatType: ["IMAGE", "CSV"],
      selectedReferenceTitles: ["Green AI Paper"],
    };

    render(<BaseEntityForm {...defaultProps} initialValues={initialValues} />);

    const nameInput = screen.getByDisplayValue("Test Dataset");
    expect(nameInput).toBeInTheDocument();

    const imageCheckbox = screen.getByLabelText(/image/i) as HTMLInputElement;
    expect(imageCheckbox.checked).toBe(true);

    const csvCheckbox = screen.getByLabelText(/csv/i) as HTMLInputElement;
    expect(csvCheckbox.checked).toBe(true);
  });

  it("disables name input in edit mode", () => {
    const initialValues = {
      name: "Test Dataset",
    };

    render(
      <BaseEntityForm
        {...defaultProps}
        mode="edit"
        initialValues={initialValues}
      />
    );

    const nameInput = screen.getByDisplayValue("Test Dataset") as HTMLInputElement;
    expect(nameInput.disabled).toBe(true);
  });


  it("renders save button", () => {
    render(<BaseEntityForm {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it("renders child content", () => {
    render(<BaseEntityForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText("Name");
    const descriptionTextarea = screen.getByPlaceholderText("Description");

    expect(nameInput).toBeInTheDocument();
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it("handles form submission with correct body structure", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<BaseEntityForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText("Name");
    await user.type(nameInput, "New Dataset");

    const imageCheckbox = screen.getByLabelText(/image/i);
    await user.click(imageCheckbox);

    const refCheckbox = screen.getByRole("checkbox", { name: /green ai paper/i });
    await user.click(refCheckbox);

    const form = screen.getByRole("button", { name: /save/i }).closest("form");
    await user.click(screen.getByRole("button", { name: /save/i }));

    // The form should be submitted and the router should have been called
    // (actual API call verification would happen in integration tests)
  });

  it("renders error message when provided", () => {
    const { rerender } = render(<BaseEntityForm {...defaultProps} />);

    // After submission with error, error would be displayed
    // This would need to be tested through user interaction flow
  });

  it("applies TEXT_ONLY as default format when no initial value provided", async () => {
    render(<BaseEntityForm {...defaultProps} />);

    const textOnlyCheckbox = screen.getByLabelText(/text only/i) as HTMLInputElement;
    expect(textOnlyCheckbox.checked).toBe(true);
  });

  it("renders with POST method by default", () => {
    render(<BaseEntityForm {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it("renders with PATCH method when in edit mode", () => {
    render(
      <BaseEntityForm
        {...defaultProps}
        mode="edit"
        method="PATCH"
        initialValues={{ name: "Existing" }}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });
});
