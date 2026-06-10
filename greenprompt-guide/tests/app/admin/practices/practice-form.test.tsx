import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PracticeForm } from "@/app/admin/practices/practice-form";
import { describe, it, expect, vi } from "vitest";

const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

global.fetch = vi.fn();

const mockCategories = [
  { name: "Category 1", description: "Desc 1", tactic: "GREEN_PRACTICE" },
  { name: "Category 2", description: "Desc 2", tactic: "RED_PRACTICE" },
];

const mockPromptTechniques = [
    { name: "Technique 1" },
    { name: "Technique 2" },
];

const mockModels = [
    { name: "Model 1" },
    { name: "Model 2" },
];

const mockReferences = [
    { title: "Reference 1", year: 2023, authors: "Author A" },
    { title: "Reference 2", year: 2024, authors: "Author B" },
];

const mockHyperparameters = [
    { id: 1, name: "HP 1", value: "0.1", dataType: "float", referenceTitle: "Reference 1" },
    { id: 2, name: "HP 2", value: "10", dataType: "integer", referenceTitle: "Reference 1" },
];


describe("PracticeForm", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch.mockClear();
    });

  it("should render in create mode", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/practices"
        redirectPath="/admin/practices"
        references={[]}
      />
    );
    expect(screen.getByLabelText("Practice title")).toBeInTheDocument();
    // In create mode with no existing references, it defaults to the new reference form
    expect(screen.getByLabelText("Authors")).toBeInTheDocument();
  });

  it("should render in edit mode", () => {
    render(
      <PracticeForm
        categories={mockCategories}
        promptTechniques={mockPromptTechniques}
        models={mockModels}
        references={mockReferences}
        hyperparameters={mockHyperparameters}
        submitUrl="/api/practices/1"
        redirectPath="/admin/practices"
        mode="edit"
        initialValues={{ practiceTitle: "Existing Practice" }}
      />
    );
    expect(screen.getByLabelText("Practice title")).toHaveValue("Existing Practice");
    expect(screen.queryByText("Create a new reference")).not.toBeInTheDocument();
    expect(screen.getByText("Prompt techniques")).toBeInTheDocument();
    expect(screen.getByText("Models")).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(screen.getByText("Hyperparameters")).toBeInTheDocument();
  });

  it("should handle successful submission in create mode", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <PracticeForm
        categories={[]}
        submitUrl="/api/practices"
        redirectPath="/admin/practices"
      />
    );

    fireEvent.change(screen.getByLabelText("Practice title"), { target: { value: "New Practice" } });
    fireEvent.change(screen.getByLabelText("Practice description"), { target: { value: "A description" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New Reference" } });
    fireEvent.change(screen.getByLabelText("Authors"), { target: { value: "Author C" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "2025" } });
    fireEvent.change(screen.getByLabelText("Study type"), { target: { value: "Case Study" } });
    fireEvent.change(screen.getByLabelText("Link"), { target: { value: "http://example.com/ref" } });
    
    fireEvent.submit(screen.getByText("Save"));

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/practices", expect.any(Object));
        expect(mockRouter.push).toHaveBeenCalledWith("/admin/practices");
        expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("should handle successful submission in edit mode", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <PracticeForm
        categories={mockCategories}
        submitUrl="/api/practices/1"
        redirectPath="/admin/practices"
        mode="edit"
        initialValues={{ practiceTitle: "Old Title" }}
      />
    );
    
    fireEvent.change(screen.getByLabelText("Practice title"), { target: { value: "New Title" } });
    fireEvent.submit(screen.getByText("Save"));

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/practices/1", expect.any(Object));
        const fetchBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(fetchBody.practice.name).toBe("New Title");
        expect(mockRouter.push).toHaveBeenCalledWith("/admin/practices");
    });
  });

  it("should handle failed submission", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid data" }),
    });

    render(
      <PracticeForm
        categories={[]}
        submitUrl="/api/practices"
        redirectPath="/admin/practices"
      />
    );

    fireEvent.change(screen.getByLabelText("Practice title"), { target: { value: "Test" } });
    fireEvent.submit(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Invalid data")).toBeInTheDocument();
    });
  });

  it("should allow adding and removing examples", () => {
    render(
        <PracticeForm
          categories={[]}
          submitUrl="/api/practices"
          redirectPath="/admin/practices"
        />
      );

    expect(screen.getAllByRole("article").length).toBe(1);
    
    fireEvent.click(screen.getByText("Add example"));
    expect(screen.getAllByRole("article").length).toBe(2);

    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(screen.getAllByRole("article").length).toBe(1);
  });

  it("should allow adding and removing metrics in edit mode", () => {
    render(
        <PracticeForm
          categories={[]}
          submitUrl="/api/practices"
          redirectPath="/admin/practices"
          mode="edit"
        />
      );

    expect(screen.getAllByText(/Metric \d+/).length).toBe(1);
    
    fireEvent.click(screen.getByText("Add metric"));
    expect(screen.getAllByText(/Metric \d+/).length).toBe(2);

    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(screen.getAllByText(/Metric \d+/).length).toBe(1);
  });

  it("should toggle new category form", () => {
    render(
        <PracticeForm
          categories={[]}
          submitUrl="/api/practices"
          redirectPath="/admin/practices"
        />
    );

    expect(screen.queryByLabelText("Category name")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Create a new category too"));
    expect(screen.getByLabelText("Category name")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Create a new category too"));
    expect(screen.queryByLabelText("Category name")).not.toBeInTheDocument();
  });
});
