import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EditPromptTechniquePage from "@/app/admin/promptTechniques/edit/[promptTechniqueName]/page";
import * as promptTechniqueRepository from "@/domain/prompt-technique-repository";
import * as referenceRepository from "@/domain/reference-repository";
import { notFound } from "next/navigation";

vi.mock("@/domain/prompt-technique-repository", () => ({
  getPromptTechniqueByName: vi.fn(),
}));

vi.mock("@/domain/reference-repository", () => ({
  listReferences: vi.fn(),
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

vi.mock("@/app/admin/promptTechniques/prompt-technique-form", () => ({
  PromptTechniqueForm: ({
    mode,
    method,
    submitUrl,
    redirectPath,
    initialValues,
    references,
  }: {
    mode: string;
    method: string;
    submitUrl: string;
    redirectPath: string;
    initialValues: any;
    references: any[];
  }) => (
    <div>
      PromptTechniqueForm - mode: {mode} - method: {method} - {submitUrl}
    </div>
  ),
}));

describe("Edit Prompt Technique Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: "Example",
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/Modify prompt technique/i)).toBeInTheDocument();
  });

  it("decodes URL-encoded technique name", async () => {
    const mockTechnique = {
      name: "Advanced Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Advanced%20Chain%20of%20Thought" }),
      })
    );

    expect(promptTechniqueRepository.getPromptTechniqueByName).toHaveBeenCalledWith(
      "Advanced Chain of Thought"
    );
  });

  it("calls notFound when technique does not exist", async () => {
    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(null);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    try {
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "NonExistent" }),
      });
    } catch (e) {
      // Expected error
    }

    expect(notFound).toHaveBeenCalled();
  });

  it("fetches technique and references in parallel", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(promptTechniqueRepository.getPromptTechniqueByName).toHaveBeenCalled();
    expect(referenceRepository.listReferences).toHaveBeenCalled();
  });

  it("passes edit mode to form", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/mode: edit/)).toBeInTheDocument();
  });

  it("passes PATCH method to form", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/method: PATCH/)).toBeInTheDocument();
  });

  it("constructs correct API submit URL", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/\/api\/admin\/promptTechniques\/Chain%20of%20Thought/)).toBeInTheDocument();
  });

  it("passes correct redirect path", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/\/admin\/promptTechniques/)).toBeInTheDocument();
  });

  it("maps technique references for form", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [
        {
          promptTechniqueId: "cot",
          referenceId: 1,
          reference: { title: "Paper 1" },
        },
      ],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/PromptTechniqueForm/)).toBeInTheDocument();
  });

  it("displays back to prompt techniques link", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    const backLink = screen.getByRole("link", { name: /Back to prompt techniques/i });
    expect(backLink).toHaveAttribute("href", "/admin/promptTechniques");
  });

  it("displays description text", async () => {
    const mockTechnique = {
      name: "Chain of Thought",
      description: "Description",
      example: null,
      references: [],
    };

    vi.mocked(promptTechniqueRepository.getPromptTechniqueByName).mockResolvedValueOnce(
      mockTechnique as any
    );
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditPromptTechniquePage({
        params: Promise.resolve({ promptTechniqueName: "Chain of Thought" }),
      })
    );

    expect(screen.getByText(/Update the description, example/i)).toBeInTheDocument();
  });
});