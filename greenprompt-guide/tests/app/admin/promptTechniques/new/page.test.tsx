import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import NewPromptTechniquePage from "@/app/admin/promptTechniques/new/page";
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

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <div>Arrow</div>,
}));

vi.mock("@/app/admin/promptTechniques/prompt-technique-form", () => ({
  PromptTechniqueForm: ({
    submitUrl,
    redirectPath,
    references,
  }: {
    submitUrl: string;
    redirectPath: string;
    references: any[];
  }) => (
    <div>
      PromptTechniqueForm - {submitUrl} - {redirectPath} - {references.length} refs
    </div>
  ),
}));

describe("New Prompt Technique Page", () => {
  it("renders the page header", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/Add prompt technique/i)).toBeInTheDocument();
    expect(screen.getByText(/Register a new prompt technique/i)).toBeInTheDocument();
  });

  it("displays back to prompt techniques link", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    const backLink = screen.getByRole("link", { name: /Back to prompt techniques/i });
    expect(backLink).toHaveAttribute("href", "/admin/promptTechniques");
  });

  it("renders prompt technique form component", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/PromptTechniqueForm/i)).toBeInTheDocument();
  });

  it("passes correct submit URL to form", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/\/api\/admin\/promptTechniques/)).toBeInTheDocument();
  });

  it("passes correct redirect path to form", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/\/admin\/promptTechniques/)).toBeInTheDocument();
  });

  it("fetches references from repository", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(referenceRepository.listReferences).toHaveBeenCalled();
  });

  it("passes references to form", async () => {
    const mockReferences = [
      { title: "Paper 1", year: 2020, authors: "Author A", id: 1 } as any,
      { title: "Paper 2", year: 2021, authors: "Author B", id: 2 } as any,
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/2 refs/)).toBeInTheDocument();
  });

  it("handles empty references list", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/0 refs/)).toBeInTheDocument();
  });

  it("displays kicker text", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewPromptTechniquePage());

    expect(screen.getByText(/Prompt Techniques/)).toBeInTheDocument();
  });
});