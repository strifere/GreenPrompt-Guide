import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PracticeDetailsPage from "@/app/catalog/practices/[practiceId]/page";
import { getPracticeById } from "@/domain/practice-repository";
import { notFound } from "next/navigation";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/practice-repository", () => ({
  getPracticeById: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildPractice() {
  return {
    id: 7,
    name: "Constraint-first Prompting",
    description: "Define output constraints to reduce hallucinations and retries.",
    greenScore: 82,
    categories: [{ category: { name: "Prompt Compression" } }],
    practiceExamples: [
      {
        id: 1,
        scenario: "Summarization pipeline",
        originalPrompts: "Summarize this long report.",
        improvedPrompts: "Summarize in 5 bullet points, max 80 words.",
        observations: "Lower token usage and stable quality.",
      },
    ],
    metrics: [{ id: 10, title: "Energy use", value: "-18%" }],
    prompts: [{ promptTechnique: { name: "Few-shot" } }],
    models: [{ model: { name: "GPT-4o-mini" } }],
    hyperparameters: [{ id: 20, name: "temperature", value: "0.1", dataType: "float" }],
    papers: [
      {
        referenceId: 30,
        reference: {
          title: "Low-energy Prompt Engineering",
          year: 2025,
          datasets: [{ dataset: { id: 40, name: "MMLU" } }],
        },
      },
    ],
  };
}

describe("Practice details requirements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("US2/FR3/FR5: renders full practice details, metrics, examples and source", async () => {
    vi.mocked(getPracticeById).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceId: "7" }),
      }),
    );

    expect(vi.mocked(getPracticeById)).toHaveBeenCalledWith(7);
    expect(screen.getByRole("heading", { name: /constraint-first prompting/i })).toBeInTheDocument();
    expect(screen.getByText(/define output constraints to reduce hallucinations/i)).toBeInTheDocument();
    expect(screen.getByText(/prompt compression/i)).toBeInTheDocument();
    expect(screen.getByText(/summarization pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/summarize in 5 bullet points/i)).toBeInTheDocument();
    expect(screen.getByText(/energy use/i)).toBeInTheDocument();
    expect(screen.getByText(/few-shot/i)).toBeInTheDocument();
    expect(screen.getByText(/gpt-4o-mini/i)).toBeInTheDocument();
    expect(screen.getByText(/temperature: 0.1 \(float\)/i)).toBeInTheDocument();
    expect(screen.getByText(/mmlu/i)).toBeInTheDocument();
    expect(screen.getByText(/low-energy prompt engineering \(2025\)/i)).toBeInTheDocument();
  });

  it("US2: falls back to green score card when explicit metrics are missing", async () => {
    const practiceWithoutMetrics = { ...buildPractice(), metrics: [] };
    vi.mocked(getPracticeById).mockResolvedValue(practiceWithoutMetrics as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceId: "7" }),
      }),
    );

    expect(screen.getByText(/green score/i)).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("handles missing practice by delegating to notFound", async () => {
    vi.mocked(getPracticeById).mockResolvedValue(null);

    await expect(
      PracticeDetailsPage({
        params: Promise.resolve({ practiceId: "999" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });
});
