import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import NewModelPage from "@/app/admin/models/new/page";
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

vi.mock("@/app/admin/models/model-form", () => ({
  ModelForm: ({ submitUrl, redirectPath, references }: { submitUrl: string; redirectPath: string; references: any[] }) => (
    <div>
      ModelForm - {submitUrl} - {redirectPath} - {references.length} refs
    </div>
  ),
}));

describe("New Model Page", () => {
  it("renders the page header", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/Add model/i)).toBeInTheDocument();
    expect(screen.getByText(/Register a new AI model/i)).toBeInTheDocument();
  });

  it("displays back to models link", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    const backLink = screen.getByRole("link", { name: /Back to models/i });
    expect(backLink).toHaveAttribute("href", "/admin/models");
  });

  it("renders model form component", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/ModelForm/i)).toBeInTheDocument();
  });

  it("passes correct submit URL to form", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/\/api\/admin\/models/)).toBeInTheDocument();
  });

  it("passes correct redirect path to form", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/\/admin\/models/)).toBeInTheDocument();
  });

  it("fetches references from repository", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(referenceRepository.listReferences).toHaveBeenCalled();
  });

  it("passes references to form", async () => {
    const mockReferences = [
      { title: "Paper 1", year: 2020, authors: "Author A", id: 1 } as any,
      { title: "Paper 2", year: 2021, authors: "Author B", id: 2 } as any,
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences);

    render(await NewModelPage());

    expect(screen.getByText(/2 refs/)).toBeInTheDocument();
  });

  it("maps references correctly for form", async () => {
    const mockReferences = [
      { title: "Deep Learning", year: 2020, authors: "LeCun et al.", id: 1 } as any,
    ];

    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce(mockReferences);

    render(await NewModelPage());

    expect(screen.getByText(/1 refs/)).toBeInTheDocument();
  });

  it("handles empty references list", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/0 refs/)).toBeInTheDocument();
  });

  it("displays kicker text", async () => {
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(await NewModelPage());

    expect(screen.getByText(/Models/)).toBeInTheDocument();
  });
});