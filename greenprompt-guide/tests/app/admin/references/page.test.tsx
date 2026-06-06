import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminReferencesPage from "@/app/admin/references/page";
import * as referenceRepository from "@/domain/reference-repository";

vi.mock("@/domain/reference-repository", () => ({
  listReferences: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/admin-delete-action", () => ({
  AdminDeleteAction: ({ type, objectKey }: { type: string; objectKey: string | number }) => (
    <div data-testid={`delete-${type}-${objectKey}`}>Delete Action</div>
  ),
}));

describe("Admin References Page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the references page header", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await AdminReferencesPage());

    expect(screen.getByText(/All references/i)).toBeInTheDocument();
    expect(screen.getByText(/Review the references/i)).toBeInTheDocument();
  });

  it("displays empty state when no references exist", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await AdminReferencesPage());

    expect(screen.getByText(/No references yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Once references are imported/i)).toBeInTheDocument();
  });

  it("renders add reference button", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await AdminReferencesPage());

    const addButton = screen.getByText(/Add reference/i);
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute("href", "/admin/references/new");
  });

  it("displays list of references when references exist", async () => {
    const mockReferences = [
      {
        title: "Attention is All You Need",
        year: 2017,
        authors: "Vaswani, A. et al.",
        abstract: "The dominant sequence transduction models...",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
      {
        title: "BERT: Pre-training",
        year: 2019,
        authors: "Devlin, J. et al.",
        abstract: "We introduce BERT...",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("Attention is All You Need")).toBeInTheDocument();
    expect(screen.getByText("BERT: Pre-training")).toBeInTheDocument();
  });

  it("displays reference year as badge", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author Name",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("displays reference abstract", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author Name",
        abstract: "This is a comprehensive study of deep learning",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("This is a comprehensive study of deep learning")).toBeInTheDocument();
  });

  it("displays default abstract message when abstract is missing", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author Name",
        abstract: null,
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText(/No abstract available/i)).toBeInTheDocument();
  });

  it("displays authors in metadata", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Smith, J.; Doe, J.",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("Smith, J.; Doe, J.")).toBeInTheDocument();
  });

  it("displays practices count", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [
          { id: 1, name: "Practice 1" },
          { id: 2, name: "Practice 2" },
        ],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("2 extracted practices")).toBeInTheDocument();
  });

  it("displays models count", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [
          { name: "Model 1" },
          { name: "Model 2" },
          { name: "Model 3" },
        ],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("3 models")).toBeInTheDocument();
  });

  it("displays prompt techniques count", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [{ name: "Technique 1" }],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("1 prompt technique")).toBeInTheDocument();
  });

  it("displays datasets count", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [{ name: "Dataset 1" }],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByText("1 dataset")).toBeInTheDocument();
  });

  it("links to catalog reference page", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    const link = screen.getByRole("link", { name: /Paper Title/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("catalog/references"));
  });

  it("provides modify button for each reference", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    const modifyButton = screen.getByText(/Modify/i);
    expect(modifyButton).toHaveAttribute("href", expect.stringContaining("/admin/references/edit"));
  });

  it("provides delete action for each reference", async () => {
    const mockReferences = [
      {
        title: "Paper Title",
        year: 2020,
        authors: "Author",
        abstract: "Abstract",
        practices: [],
        models: [],
        promptTechniques: [],
        datasets: [],
      },
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences as any);

    render(await AdminReferencesPage());

    expect(screen.getByTestId("delete-reference-Paper Title")).toBeInTheDocument();
  });
});