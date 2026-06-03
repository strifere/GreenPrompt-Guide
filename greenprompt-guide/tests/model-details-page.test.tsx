import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModelDetailsPage from "@/app/catalog/models/[modelName]/page";
import { getModelByName } from "@/domain/model-repository";
import { notFound } from "next/navigation";

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

vi.mock("@/domain/model-repository", () => ({
  getModelByName: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildModel() {
  return {
    id: 1,
    name: "GPT-4o-mini",
    description: "A smaller, faster variant of GPT-4 optimized for efficiency.",
    parameters: "8B parameters",
    size: "4.5 GB",
    dataFormatType: ["JSON", "Text"],
    practices: [
      {
        modelId: 1,
        practiceId: 1,
        practice: { id: 1, name: "Few-shot Prompting" },
      },
    ],
    references: [
      {
        modelId: 1,
        referenceId: 1,
        reference: {
          title: "GPT-4 Technical Report",
          year: 2024,
        },
      },
    ],
  };
}

describe("Model details requirements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders model name and description", async () => {
    vi.mocked(getModelByName).mockResolvedValue(buildModel() as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(vi.mocked(getModelByName)).toHaveBeenCalledWith("GPT-4o-mini");
    expect(screen.getByRole("heading", { name: /gpt-4o-mini/i })).toBeInTheDocument();
    expect(screen.getByText(/a smaller, faster variant of gpt-4 optimized for efficiency/i)).toBeInTheDocument();
  });

  it("displays model metadata including parameters, size, and data format types", async () => {
    vi.mocked(getModelByName).mockResolvedValue(buildModel() as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/8b parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.5 gb/i)).toBeInTheDocument();
    expect(screen.getByText(/json/i)).toBeInTheDocument();
    expect(screen.getByText(/text/i)).toBeInTheDocument();
  });

  it("displays related practices as links", async () => {
    vi.mocked(getModelByName).mockResolvedValue(buildModel() as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    const practiceLink = screen.getByRole("link", { name: /few-shot prompting/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink).toHaveAttribute("href", expect.stringContaining("practices"));
  });

  it("displays related references with year", async () => {
    vi.mocked(getModelByName).mockResolvedValue(buildModel() as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /gpt-4 technical report \(2024\)/i });
    expect(refLink).toBeInTheDocument();
    expect(refLink).toHaveAttribute("href", expect.stringContaining("references"));
  });

  it("handles missing description gracefully", async () => {
    const modelWithoutDescription = { ...buildModel(), description: null };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutDescription as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByRole("heading", { name: /gpt-4o-mini/i })).toBeInTheDocument();
  });

  it("handles missing parameters field by showing placeholder", async () => {
    const modelWithoutParameters = { ...buildModel(), parameters: null };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutParameters as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/no parameters specified/i)).toBeInTheDocument();
  });

  it("handles missing size field by showing placeholder", async () => {
    const modelWithoutSize = { ...buildModel(), size: null };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutSize as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/no size specified/i)).toBeInTheDocument();
  });

  it("handles empty data format types list", async () => {
    const modelWithoutFormats = { ...buildModel(), dataFormatType: [] };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutFormats as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/no data format types specified/i)).toBeInTheDocument();
  });

  it("handles empty related practices list", async () => {
    const modelWithoutPractices = { ...buildModel(), practices: [] };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutPractices as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/no practices mapped yet/i)).toBeInTheDocument();
  });

  it("handles empty related references list", async () => {
    const modelWithoutReferences = { ...buildModel(), references: [] };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutReferences as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByText(/no references mapped yet/i)).toBeInTheDocument();
  });

  it("handles missing reference year", async () => {
    const modelWithoutYear = {
      ...buildModel(),
      references: [
        {
          modelId: 1,
          referenceId: 1,
          reference: {
            title: "Test Reference",
            year: null,
          },
        },
      ],
    };
    vi.mocked(getModelByName).mockResolvedValue(modelWithoutYear as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /test reference$/i });
    expect(refLink).toBeInTheDocument();
  });

  it("handles missing model by delegating to notFound", async () => {
    vi.mocked(getModelByName).mockResolvedValue(null);

    await expect(
      ModelDetailsPage({
        params: Promise.resolve({ modelName: "UNKNOWN" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it("decodes URL-encoded model name", async () => {
    vi.mocked(getModelByName).mockResolvedValue(buildModel() as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o%20mini" }),
      }),
    );

    expect(vi.mocked(getModelByName)).toHaveBeenCalledWith("GPT-4o mini");
  });

  it("renders multiple practices and references", async () => {
    const modelWithMultipleRelations = {
      ...buildModel(),
      practices: [
        {
          modelId: 1,
          practiceId: 1,
          practice: { id: 1, name: "Few-shot Prompting" },
        },
        {
          modelId: 1,
          practiceId: 2,
          practice: { id: 2, name: "Chain-of-Thought" },
        },
      ],
      references: [
        {
          modelId: 1,
          referenceId: 1,
          reference: {
            title: "GPT-4 Technical Report",
            year: 2024,
          },
        },
        {
          modelId: 1,
          referenceId: 2,
          reference: {
            title: "Scaling Laws for Neural Language Models",
            year: 2020,
          },
        },
      ],
    };
    vi.mocked(getModelByName).mockResolvedValue(modelWithMultipleRelations as never);

    render(
      await ModelDetailsPage({
        params: Promise.resolve({ modelName: "GPT-4o-mini" }),
      }),
    );

    expect(screen.getByRole("link", { name: /few-shot prompting/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chain-of-thought/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gpt-4 technical report \(2024\)/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /scaling laws for neural language models \(2020\)/i })).toBeInTheDocument();
  });
});
