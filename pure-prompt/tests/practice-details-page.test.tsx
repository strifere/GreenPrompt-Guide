import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PracticeDetailsPage from "@/app/catalog/practices/[practiceName]/page";
import { getPracticeByName } from "@/domain/practice-repository";
import { notFound } from "next/navigation";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/practice-repository", () => ({
  getPracticeByName: vi.fn(),
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
    metrics: [{ id: 10, title: "Energy use", value: "-18%", confidence: 0.92 }],
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
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(vi.mocked(getPracticeByName)).toHaveBeenCalledWith("Constraint-first Prompting");
    expect(screen.getByRole("heading", { name: /constraint-first prompting/i })).toBeInTheDocument();
    expect(screen.getByText(/define output constraints to reduce hallucinations/i)).toBeInTheDocument();
    expect(screen.getByText(/prompt compression/i)).toBeInTheDocument();
    expect(screen.getByText(/summarization pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/summarize in 5 bullet points/i)).toBeInTheDocument();
    expect(screen.getByText(/energy use/i)).toBeInTheDocument();
    expect(screen.getByText(/temperature: 0.1 \(float\)/i)).toBeInTheDocument();
    expect(screen.getByText(/low-energy prompt engineering \(2025\)/i)).toBeInTheDocument();

    // Verify links to related resources
    const fewShotLink = screen.getByRole("link", { name: /few-shot/i });
    expect(fewShotLink).toBeInTheDocument();
    expect(fewShotLink).toHaveAttribute("href", expect.stringContaining("promptTechniques"));

    const modelLink = screen.getByRole("link", { name: /gpt-4o-mini/i });
    expect(modelLink).toBeInTheDocument();
    expect(modelLink).toHaveAttribute("href", expect.stringContaining("models"));

    const datasetLink = screen.getByRole("link", { name: /mmlu/i });
    expect(datasetLink).toBeInTheDocument();
    expect(datasetLink).toHaveAttribute("href", expect.stringContaining("datasets"));

    const referenceLink = screen.getByRole("link", { name: /low-energy prompt engineering \(2025\)/i });
    expect(referenceLink).toBeInTheDocument();
    expect(referenceLink).toHaveAttribute("href", expect.stringContaining("references"));
  });

  it("US2: falls back to green score card when explicit metrics are missing", async () => {
    const practiceWithoutMetrics = { ...buildPractice(), metrics: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutMetrics as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/green score/i)).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("renders energy and accuracy metric subtype details", async () => {
    const practiceWithSubtypeMetrics = {
      ...buildPractice(),
      metrics: [
        {
          id: 11,
          title: "Energy use",
          value: "-18%",
          confidence: 0.9,
          description: "Lower token usage for the task.",
          energyMetrics: [
            {
              metricId: 11,
              type: "REDUCTION",
              minValue: 10,
              maxValue: 20,
              bestGuessValue: 18,
              unit: "PERCENTAGE",
            },
          ],
          accuracyMetrics: [],
        },
        {
          id: 12,
          title: "Accuracy gain",
          value: "+3%",
          confidence: 0.75,
          description: null,
          energyMetrics: [],
          accuracyMetrics: [
            {
              metricId: 12,
              level: "SAME_OR_BETTER",
              score: 0.84,
            },
          ],
        },
      ],
    };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithSubtypeMetrics as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getAllByText(/confidence:/i)).toHaveLength(2);
    expect(screen.getByText(/^90%$/)).toBeInTheDocument();
    expect(screen.getByText(/^75%$/)).toBeInTheDocument();
    expect(screen.getByText(/lower token usage for the task/i)).toBeInTheDocument();
    expect(screen.getByText(/min value:/i)).toBeInTheDocument();
    expect(screen.getByText(/max value:/i)).toBeInTheDocument();
    expect(screen.getByText(/best guess value:/i)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
    expect(screen.getByText(/18%/)).toBeInTheDocument();
    expect(screen.queryByText(/^-18%$/)).not.toBeInTheDocument();
    expect(screen.getByText(/same or better accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/score:/i)).toBeInTheDocument();
  });

  it("displays practice categories", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/prompt compression/i)).toBeInTheDocument();
  });

  it("displays practice examples with scenario, original, improved prompts and observations", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/scenario:/i)).toBeInTheDocument();
    expect(screen.getByText(/summarization pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/original prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/improved prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/observations:/i)).toBeInTheDocument();
    expect(screen.getByText(/lower token usage and stable quality/i)).toBeInTheDocument();
  });

  it("displays hyperparameters with name, value, and data type", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/temperature: 0\.1 \(float\)/i)).toBeInTheDocument();
  });

  it("handles missing practice examples gracefully", async () => {
    const practiceWithoutExamples = { ...buildPractice(), practiceExamples: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutExamples as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no scenario available for this practice yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no original prompt registered/i)).toBeInTheDocument();
  });

  it("handles empty related prompt techniques", async () => {
    const practiceWithoutTechniques = { ...buildPractice(), prompts: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutTechniques as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no prompt techniques mapped yet/i)).toBeInTheDocument();
  });

  it("handles empty related models", async () => {
    const practiceWithoutModels = { ...buildPractice(), models: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutModels as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no models mapped yet/i)).toBeInTheDocument();
  });

  it("handles empty hyperparameters", async () => {
    const practiceWithoutHyperparameters = { ...buildPractice(), hyperparameters: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutHyperparameters as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no hyperparameters mapped yet/i)).toBeInTheDocument();
  });

  it("handles empty datasets", async () => {
    const practiceWithoutDatasets = {
      ...buildPractice(),
      papers: [
        {
          referenceId: 30,
          reference: {
            title: "Low-energy Prompt Engineering",
            year: 2025,
            datasets: [],
          },
        },
      ],
    };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutDatasets as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no datasets linked through references yet/i)).toBeInTheDocument();
  });

  it("decodes URL-encoded practice name", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first%20Prompting" }),
      }),
    );

    expect(vi.mocked(getPracticeByName)).toHaveBeenCalledWith("Constraint-first Prompting");
  });

  it("displays back link to practices catalog", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    const backLink = screen.getByRole("link", { name: /back to practices/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/catalog");
  });

  it("handles missing practice by delegating to notFound", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(null);

    await expect(
      PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "999" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });
});
