import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReferenceDetailsPage from "@/app/catalog/references/[referenceTitle]/page";
import { getReferenceByTitle } from "@/domain/reference-repository";
import { notFound } from "next/navigation";


vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/reference-repository", () => ({
  getReferenceByTitle: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildReference() {
  return {
    id: 1,
    title: "Low-energy Prompt Engineering",
    authors: "Smith, J. & Doe, A.",
    abstract: "This paper explores energy-efficient prompt engineering techniques.",
    task: "Energy consumption optimization in LLM inference.",
    toolAvailability: "Available at https://github.com/example/tool",
    keywords: "prompt, energy, efficiency, optimization",
    year: 2025,
    studyType: "Empirical Study",
    domain: "Natural Language Processing",
    venue: "ACL 2025",
    link: "https://example.com/paper",
    createdAt: new Date(),
    updatedAt: new Date(),
    promptTechniques: [{ promptTechnique: { id: 1, name: "Few-shot", description: "", example: null, createdAt: new Date(), updatedAt: new Date() } }],
    models: [{ model: { id: 1, name: "GPT-4o-mini", description: "", parameters: "", size: "", dataFormatType: [], createdAt: new Date(), updatedAt: new Date() } }],
    datasets: [{ dataset: { id: 40, name: "MMLU", description: "", size: "", dataFormatType: [], createdAt: new Date(), updatedAt: new Date() } }],
    hyperparameters: [],
    practices: [],
  };
}

describe("Reference details requirements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders full reference details with all metadata sections", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(buildReference() as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(vi.mocked(getReferenceByTitle)).toHaveBeenCalledWith("Low-energy Prompt Engineering");
    expect(screen.getByRole("heading", { name: /low-energy prompt engineering/i })).toBeInTheDocument();
    expect(screen.getByText(/smith, j\. & doe, a\./i)).toBeInTheDocument();
    expect(screen.getByText(/this paper explores energy-efficient prompt engineering techniques/i)).toBeInTheDocument();
    expect(screen.getByText(/energy consumption optimization in llm inference/i)).toBeInTheDocument();
    expect(screen.getByText(/available at https:\/\/github\.com\/example\/tool/i)).toBeInTheDocument();
  });

  it("displays reference metadata including keywords, year, study type, domain, and venue", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(buildReference() as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    const keywords = screen.getAllByText(/energy|efficiency|optimization/i);
    expect(keywords.length).toBeGreaterThan(0);
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText(/empirical study/i)).toBeInTheDocument();
    expect(screen.getByText(/natural language processing/i)).toBeInTheDocument();
    expect(screen.getByText(/acl 2025/i)).toBeInTheDocument();
  });

  it("displays related prompt techniques and models as links", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(buildReference() as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    const fewShotLink = screen.getByRole("link", { name: /few-shot/i });
    expect(fewShotLink).toBeInTheDocument();
    expect(fewShotLink).toHaveAttribute("href", expect.stringContaining("promptTechniques"));

    const modelLink = screen.getByRole("link", { name: /gpt-4o-mini/i });
    expect(modelLink).toBeInTheDocument();
    expect(modelLink).toHaveAttribute("href", expect.stringContaining("models"));
  });

  it("displays related datasets", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(buildReference() as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    const datasetLink = screen.getByRole("link", { name: /mmlu/i });
    expect(datasetLink).toBeInTheDocument();
    expect(datasetLink).toHaveAttribute("href", expect.stringContaining("datasets"));
  });

  it("handles missing keywords by showing placeholder message", async () => {
    const refWithoutKeywords = { ...buildReference(), keywords: null };
    vi.mocked(getReferenceByTitle).mockResolvedValue(refWithoutKeywords as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/no keywords registered yet/i)).toBeInTheDocument();
  });

  it("handles missing optional metadata fields gracefully", async () => {
    const refWithoutOptional = {
      ...buildReference(),
      year: null,
      studyType: null,
      domain: null,
      venue: null,
      toolAvailability: null,
    };
    vi.mocked(getReferenceByTitle).mockResolvedValue(refWithoutOptional as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/year not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/study type not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/domain not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/venue not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/no tool was developed in this study/i)).toBeInTheDocument();
  });

  it("handles empty related items gracefully", async () => {
    const refWithoutRelations = {
      ...buildReference(),
      promptTechniques: [],
      models: [],
      datasets: [],
    };
    vi.mocked(getReferenceByTitle).mockResolvedValue(refWithoutRelations as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/no prompt techniques mapped yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no models mapped yet/i)).toBeInTheDocument();
  });

  it("handles missing reference by delegating to notFound", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(null);

    await expect(
      ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "999" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it("decodes URL-encoded reference title", async () => {
    vi.mocked(getReferenceByTitle).mockResolvedValue(buildReference() as never);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy%20Prompt%20Engineering" }),
      }),
    );

    expect(vi.mocked(getReferenceByTitle)).toHaveBeenCalledWith("Low-energy Prompt Engineering");
  });
});
