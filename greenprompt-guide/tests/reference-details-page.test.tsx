import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";

const getReferenceByTitleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(null), // By default, simulate an unauthenticated user
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/reference-repository", () => ({
  getReferenceByTitle: getReferenceByTitleMock,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

async function loadReferenceDetailsPage() {
  return import("../app/catalog/references/[referenceTitle]/page");
}

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
    venue: "ACL",
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
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(buildReference());

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(getReferenceByTitleMock).toHaveBeenCalledWith("Low-energy Prompt Engineering");
    expect(screen.getByRole("heading", { name: /low-energy prompt engineering/i })).toBeInTheDocument();
    expect(screen.getByText(/smith, j\. & doe, a\./i)).toBeInTheDocument();
    expect(screen.getByText(/this paper explores energy-efficient prompt engineering techniques/i)).toBeInTheDocument();
    expect(screen.getByText(/energy consumption optimization in llm inference/i)).toBeInTheDocument();
    expect(screen.getByText(/available at https:\/\/github\.com\/example\/tool/i)).toBeInTheDocument();
    expect(screen.getByText(/\[1\] J\. Smith, A\. Doe, "Low-energy Prompt Engineering," ACL, 2025\./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /full reference link/i })).toHaveAttribute("href", "https://example.com/paper");
  });

  it("displays reference metadata including keywords, year, study type, domain, and venue", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(buildReference());

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

    const venueHeading = screen.getByRole("heading", { name: /venue/i, level: 2 });
    const venueSection = venueHeading.closest("article");
    expect(venueSection).not.toBeNull();
    expect(within(venueSection as HTMLElement).getByText(/^ACL$/)).toBeInTheDocument();
  });

  it("displays related prompt techniques and models as links", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(buildReference());

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
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(buildReference());

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
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    const refWithoutKeywords = { ...buildReference(), keywords: null };
    getReferenceByTitleMock.mockResolvedValue(refWithoutKeywords);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/no keywords registered yet/i)).toBeInTheDocument();
  });

  it("handles missing optional metadata fields gracefully", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    const refWithoutOptional = {
      ...buildReference(),
      domain: null,
      venue: null,
      toolAvailability: null,
    };
    getReferenceByTitleMock.mockResolvedValue(refWithoutOptional);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/domain not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/venue not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/no tool was developed in this study/i)).toBeInTheDocument();
  });

  it("renders a citation without venue when venue is missing", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    const refWithoutVenue = {
      ...buildReference(),
      venue: null,
    };
    getReferenceByTitleMock.mockResolvedValue(refWithoutVenue);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/\[1\] J\. Smith, A\. Doe, "Low-energy Prompt Engineering," 2025\./i)).toBeInTheDocument();
  });

  it("splits mixed author separators without relying on a regex split", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    const refWithMixedSeparators = {
      ...buildReference(),
      authors: "Smith, J.; Doe, A. and Lee, C. & Zhang, Q.",
    };
    getReferenceByTitleMock.mockResolvedValue(refWithMixedSeparators);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(
      screen.getByText(/\[1\] J\. Smith, A\. Doe, C\. Lee, Q\. Zhang, "Low-energy Prompt Engineering," ACL, 2025\./i),
    ).toBeInTheDocument();
  });

  it("handles empty related items gracefully", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    const refWithoutRelations = {
      ...buildReference(),
      promptTechniques: [],
      models: [],
      datasets: [],
    };
    getReferenceByTitleMock.mockResolvedValue(refWithoutRelations);

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy Prompt Engineering" }),
      }),
    );

    expect(screen.getByText(/no prompt techniques mapped yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no models mapped yet/i)).toBeInTheDocument();
  });

  it("handles missing reference by delegating to notFound", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(null);

    await expect(
      ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "999" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it("decodes URL-encoded reference title", async () => {
    const { default: ReferenceDetailsPage } = await loadReferenceDetailsPage();
    getReferenceByTitleMock.mockResolvedValue(buildReference());

    render(
      await ReferenceDetailsPage({
        params: Promise.resolve({ referenceTitle: "Low-energy%20Prompt%20Engineering" }),
      }),
    );

    expect(getReferenceByTitleMock).toHaveBeenCalledWith("Low-energy Prompt Engineering");
  });
});
