import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CategoryForm, type CategoryFormInitialValues } from "@/app/admin/categories/category-form";

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

describe("CategoryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders name, description, and tactic fields", () => {
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/green practice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red practice/i)).toBeInTheDocument();
  });

  it("shows save button", () => {
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("defaults tactic to GREEN_PRACTICE", () => {
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    const greenRadio = screen.getByLabelText(/green practice/i) as HTMLInputElement;
    const redRadio = screen.getByLabelText(/red practice/i) as HTMLInputElement;

    expect(greenRadio.checked).toBe(true);
    expect(redRadio.checked).toBe(false);
  });

  it("allows switching tactic to RED_PRACTICE", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    const redRadio = screen.getByLabelText(/red practice/i) as HTMLInputElement;
    await user.click(redRadio);

    expect(redRadio.checked).toBe(true);
    expect((screen.getByLabelText(/green practice/i) as HTMLInputElement).checked).toBe(false);
  });

  it("accepts input in the name field", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(nameInput, "Prompt Design");

    expect(nameInput.value).toBe("Prompt Design");
  });

  it("accepts input in the description field", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    await user.type(descInput, "A set of prompt design techniques");

    expect(descInput.value).toBe("A set of prompt design techniques");
  });

  it("initialises fields from initialValues", () => {
    const initialValues: CategoryFormInitialValues = {
      name: "Inference Efficiency",
      description: "Reduce inference overhead",
      tactic: "RED_PRACTICE",
    };

    render(
      <CategoryForm
        submitUrl="/api/admin/categories/Inference+Efficiency"
        redirectPath="/admin/categories"
        initialValues={initialValues}
      />,
    );

    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe(
      "Inference Efficiency",
    );
    expect((screen.getByLabelText(/description/i) as HTMLTextAreaElement).value).toBe(
      "Reduce inference overhead",
    );
    expect((screen.getByLabelText(/red practice/i) as HTMLInputElement).checked).toBe(true);
  });

  it("makes the name field read-only in edit mode", () => {
    render(
      <CategoryForm
        mode="edit"
        method="PATCH"
        submitUrl="/api/admin/categories/SomeName"
        redirectPath="/admin/categories"
        initialValues={{ name: "SomeName", tactic: "GREEN_PRACTICE" }}
      />,
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.readOnly).toBe(true);
  });

  it("name field is writable in create mode", () => {
    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.readOnly).toBe(false);
  });

  it("submits correct payload on create", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Prompt Design");
    await user.type(screen.getByLabelText(/description/i), "Prompt tips");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/categories",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Prompt Design",
          description: "Prompt tips",
          tactic: "GREEN_PRACTICE",
        }),
      }),
    );
  });

  it("uses PATCH method when in edit mode", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <CategoryForm
        mode="edit"
        method="PATCH"
        submitUrl="/api/admin/categories/Prompt+Design"
        redirectPath="/admin/categories"
        initialValues={{ name: "Prompt Design", tactic: "GREEN_PRACTICE" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/categories/Prompt+Design",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("redirects on successful submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Prompt Design");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockPush).toHaveBeenCalledWith("/admin/categories");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows error message on failed submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "A category with that name already exists" }),
    });

    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Prompt Design");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(
      screen.getByText("A category with that name already exists"),
    ).toBeInTheDocument();
  });

  it("disables save button while saving", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100),
        ),
    );

    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Prompt Design");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("sends null description when left empty", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />,
    );

    await user.type(screen.getByLabelText(/name/i), "Prompt Design");
    // deliberately leave description empty
    await user.click(screen.getByRole("button", { name: /save/i }));

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.description).toBeNull();
  });
});
