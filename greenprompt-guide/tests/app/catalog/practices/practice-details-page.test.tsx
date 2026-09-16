import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PracticeDetailsPage from "@/app/catalog/practices/[practiceName]/page";
import { getPracticeByName, listPracticeGreenScores } from "@/domain/practice-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
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
  listPracticeGreenScores: vi.fn(),
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const DEFAULT_ALL_SCORES = [
  { name: "Constraint-first Prompting", greenScore: 82 },
  { name: "Another Practice", greenScore: 60 },
  { name: "Third Practice", greenScore: 45 },
];

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
    metrics: [{ id: 10, title: "Energy use", value: "-18%", confidence: 0.92, description: null, energyMetrics: [], accuracyMetrics: [] }],
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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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
    expect(screen.getByRole("link", { name: /back to catalog/i })).toHaveAttribute("href", "/catalog");

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

  it("always shows the green score regardless of whether explicit metrics exist", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/green score/i)).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("US2: shows the green score even when explicit metrics are present", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    // Both the green score card and the metric card should appear
    expect(screen.getByText(/green score/i)).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText(/energy use/i)).toBeInTheDocument();
  });

  it("US2: shows the green score when there are no explicit metrics", async () => {
    const practiceWithoutMetrics = { ...buildPractice(), metrics: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutMetrics as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/green score/i)).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    // No metric cards should be present when there are no metrics
    expect(screen.queryByText(/energy use/i)).not.toBeInTheDocument();
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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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

  it("renders the green score comparison chart section", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/green score across practices/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/green score comparison chart/i)).toBeInTheDocument();
  });

  it("calls listPracticeGreenScores to populate the chart", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(vi.mocked(listPracticeGreenScores)).toHaveBeenCalled();
  });

  it("displays practice categories", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/prompt compression/i)).toBeInTheDocument();
  });

  it("displays practice examples with scenario, original, improved prompts and observations", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/temperature: 0\.1 \(float\)/i)).toBeInTheDocument();
  });

  it("handles empty related prompt techniques", async () => {
    const practiceWithoutTechniques = { ...buildPractice(), prompts: [] };
    vi.mocked(getPracticeByName).mockResolvedValue(practiceWithoutTechniques as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

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
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByText(/no datasets linked through references yet/i)).toBeInTheDocument();
  });

  it("decodes URL-encoded practice name", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first%20Prompting" }),
      }),
    );

    expect(vi.mocked(getPracticeByName)).toHaveBeenCalledWith("Constraint-first Prompting");
  });

  it("displays back link to practices catalog", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    const backLink = screen.getByRole("link", { name: /back to catalog/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/catalog");
  });

  it("shows an edit practice link to admin users", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);
    vi.mocked(getSession).mockResolvedValue("victor");
    vi.mocked(getUserByUsername).mockResolvedValue({ username: "victor", role: "ADMIN" } as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.getByRole("link", { name: /edit practice/i })).toHaveAttribute(
      "href",
      "/admin/practices/edit/Constraint-first%20Prompting",
    );
  });

  it("does not show an edit practice link to regular users", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(buildPractice() as never);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);
    vi.mocked(getSession).mockResolvedValue("maria");
    vi.mocked(getUserByUsername).mockResolvedValue({ username: "maria", role: "USER" } as never);

    render(
      await PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "Constraint-first Prompting" }),
      }),
    );

    expect(screen.queryByRole("link", { name: /edit practice/i })).not.toBeInTheDocument();
  });

  it("handles missing practice by delegating to notFound", async () => {
    vi.mocked(getPracticeByName).mockResolvedValue(null);
    vi.mocked(listPracticeGreenScores).mockResolvedValue(DEFAULT_ALL_SCORES);

    await expect(
      PracticeDetailsPage({
        params: Promise.resolve({ practiceName: "999" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });
});
