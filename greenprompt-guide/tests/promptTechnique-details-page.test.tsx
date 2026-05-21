import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PromptTechniqueDetailsPage from "@/app/catalog/promptTechniques/[promptTechniqueName]/page";
import { getPromptTechniqueByName } from "@/domain/prompt-technique-repository";
import { notFound } from "next/navigation";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/prompt-technique-repository", () => ({
  getPromptTechniqueByName: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildPromptTechnique() {
  return {
    id: 1,
    name: "Few-shot Prompting",
    description: "Provide a few examples to guide the model's responses.",
    example: "Example: Q: What is 2+2? A: 4. Q: What is 3+3? A: 6. Q: What is 5+5? A:",
    practices: [
      {
        promptTechniqueId: 1,
        practiceId: 1,
        practice: { id: 1, name: "Constraint-first Prompting" },
      },
    ],
    references: [
      {
        promptTechniqueId: 1,
        referenceId: 1,
        reference: {
          title: "Language Models are Few-Shot Learners",
          year: 2020,
        },
      },
    ],
  };
}

describe("Prompt technique details requirements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders prompt technique name and description", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(buildPromptTechnique() as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(vi.mocked(getPromptTechniqueByName)).toHaveBeenCalledWith("Few-shot Prompting");
    expect(screen.getByRole("heading", { name: /few-shot prompting/i })).toBeInTheDocument();
    expect(screen.getByText(/provide a few examples to guide the model/i)).toBeInTheDocument();
  });

  it("displays example section when example is present", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(buildPromptTechnique() as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(screen.getByRole("heading", { name: /example:/i })).toBeInTheDocument();
    expect(screen.getByText(/example: q: what is 2\+2\?/i)).toBeInTheDocument();
  });

  it("displays related practices as links", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(buildPromptTechnique() as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    const practiceLink = screen.getByRole("link", { name: /constraint-first prompting/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink).toHaveAttribute("href", expect.stringContaining("practices"));
  });

  it("displays related references with year", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(buildPromptTechnique() as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /language models are few-shot learners \(2020\)/i });
    expect(refLink).toBeInTheDocument();
    expect(refLink).toHaveAttribute("href", expect.stringContaining("references"));
  });

  it("handles missing description gracefully", async () => {
    const techniqueWithoutDescription = { ...buildPromptTechnique(), description: null };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithoutDescription as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(screen.getByRole("heading", { name: /few-shot prompting/i })).toBeInTheDocument();
  });

  it("skips example section when example is missing", async () => {
    const techniqueWithoutExample = { ...buildPromptTechnique(), example: null };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithoutExample as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    const exampleHeadings = screen.queryAllByRole("heading", { name: /example:/i });
    expect(exampleHeadings).toHaveLength(0);
  });

  it("handles empty related practices list", async () => {
    const techniqueWithoutPractices = { ...buildPromptTechnique(), practices: [] };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithoutPractices as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(screen.getByText(/no practices mapped yet/i)).toBeInTheDocument();
  });

  it("handles empty related references list", async () => {
    const techniqueWithoutReferences = { ...buildPromptTechnique(), references: [] };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithoutReferences as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(screen.getByText(/no references mapped yet/i)).toBeInTheDocument();
  });

  it("handles missing reference year", async () => {
    const techniqueWithoutYear = {
      ...buildPromptTechnique(),
      references: [
        {
          promptTechniqueId: 1,
          referenceId: 1,
          reference: {
            title: "Test Reference",
            year: null,
          },
        },
      ],
    };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithoutYear as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /test reference$/i });
    expect(refLink).toBeInTheDocument();
  });

  it("handles missing prompt technique by delegating to notFound", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(null);

    await expect(
      PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "UNKNOWN" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it("decodes URL-encoded prompt technique name", async () => {
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(buildPromptTechnique() as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot%20Prompting" }),
      }),
    );

    expect(vi.mocked(getPromptTechniqueByName)).toHaveBeenCalledWith("Few-shot Prompting");
  });

  it("renders multiple practices and references", async () => {
    const techniqueWithMultipleRelations = {
      ...buildPromptTechnique(),
      practices: [
        {
          promptTechniqueId: 1,
          practiceId: 1,
          practice: { id: 1, name: "Constraint-first Prompting" },
        },
        {
          promptTechniqueId: 1,
          practiceId: 2,
          practice: { id: 2, name: "Iterative Refinement" },
        },
      ],
      references: [
        {
          promptTechniqueId: 1,
          referenceId: 1,
          reference: {
            title: "Language Models are Few-Shot Learners",
            year: 2020,
          },
        },
        {
          promptTechniqueId: 1,
          referenceId: 2,
          reference: {
            title: "In-context Learning and Induction Heads",
            year: 2023,
          },
        },
      ],
    };
    vi.mocked(getPromptTechniqueByName).mockResolvedValue(techniqueWithMultipleRelations as never);

    render(
      await PromptTechniqueDetailsPage({
        params: Promise.resolve({ promptTechniqueName: "Few-shot Prompting" }),
      }),
    );

    expect(screen.getByRole("link", { name: /constraint-first prompting/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iterative refinement/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /language models are few-shot learners \(2020\)/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /in-context learning and induction heads \(2023\)/i })).toBeInTheDocument();
  });
});
