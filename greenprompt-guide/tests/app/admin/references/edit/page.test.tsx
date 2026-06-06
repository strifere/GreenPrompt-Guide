import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EditReferencePage from "@/app/admin/references/edit/[referenceTitle]/page";
import * as referenceRepository from "@/domain/reference-repository";
import { notFound } from "next/navigation";

vi.mock("@/domain/reference-repository", () => ({
  getReferenceByTitle: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
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

vi.mock("@/app/admin/references/reference-form", () => ({
  ReferenceForm: ({
    mode,
    method,
    submitUrl,
  }: {
    mode: string;
    method: string;
    submitUrl: string;
  }) => (
    <div>
      ReferenceForm - mode: {mode} - method: {method} - {submitUrl}
    </div>
  ),
}));

describe("Edit Reference Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author Name",
      abstract: "Abstract",
      keywords: "keywords",
      year: 2020,
      studyType: "Empirical",
      domain: "NLP",
      task: "Classification",
      venue: "Journal",
      toolAvailability: "Available",
      link: "https://example.com",
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/Modify reference/i)).toBeInTheDocument();
  });

  it("decodes URL-encoded reference title", async () => {
    const mockReference = {
      title: "Paper With Special Characters",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper%20With%20Special%20Characters" }),
      })
    );

    expect(referenceRepository.getReferenceByTitle).toHaveBeenCalledWith(
      "Paper With Special Characters"
    );
  });

  it("calls notFound when reference does not exist", async () => {
    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(null);

    try {
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "NonExistent" }),
      });
    } catch (e) {
      if (e instanceof Error && e.message === "NEXT_NOT_FOUND") {
        // Expected error, do nothing
      } else {
        throw e; // Unexpected error, rethrow
      }
    }

    expect(notFound).toHaveBeenCalled();
  });

  it("passes edit mode to form", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/mode: edit/)).toBeInTheDocument();
  });

  it("passes PATCH method to form", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/method: PATCH/)).toBeInTheDocument();
  });

  it("constructs correct API submit URL", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/\/api\/admin\/references\/Paper%20Title/)).toBeInTheDocument();
  });

  it("passes correct redirect path", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/\/admin\/references/)).toBeInTheDocument();
  });

  it("passes initial values to form", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author Name",
      abstract: "Abstract text",
      keywords: "keyword1, keyword2",
      year: 2020,
      studyType: "Empirical",
      domain: "NLP",
      task: "Classification",
      venue: "Journal of ML",
      toolAvailability: "Available",
      link: "https://example.com",
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/ReferenceForm/)).toBeInTheDocument();
  });

  it("displays back to references link", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    const backLink = screen.getByRole("link", { name: /Back to references/i });
    expect(backLink).toHaveAttribute("href", "/admin/references");
  });

  it("displays description text", async () => {
    const mockReference = {
      title: "Paper Title",
      authors: "Author",
      abstract: "Abstract",
      keywords: null,
      year: 2020,
      studyType: "Type",
      domain: null,
      task: null,
      venue: null,
      toolAvailability: null,
      link: null,
    };

    vi.mocked(referenceRepository.getReferenceByTitle).mockResolvedValueOnce(mockReference as any);

    render(
      await EditReferencePage({
        params: Promise.resolve({ referenceTitle: "Paper Title" }),
      })
    );

    expect(screen.getByText(/Update the reference metadata/i)).toBeInTheDocument();
  });
});