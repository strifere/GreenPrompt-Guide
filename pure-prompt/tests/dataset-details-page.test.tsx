import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DatasetDetailsPage from "@/app/catalog/datasets/[datasetName]/page";
import { getDatasetByName } from "@/domain/dataset-repository";
import { notFound } from "next/navigation";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/domain/dataset-repository", () => ({
  getDatasetByName: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function buildDataset() {
  return {
    id: 40,
    name: "MMLU",
    description: "Massive Multitask Language Understanding benchmark.",
    size: "14,000 tasks",
    dataFormatType: ["JSON", "CSV"],
    papers: [
      {
        referenceId: 1,
        reference: {
          title: "Measuring Massive Multitask Language Understanding",
          year: 2020,
          practices: [
            {
              practiceId: 1,
              practice: { id: 1, name: "Few-shot Prompting" },
            },
          ],
          datasets: [{ dataset: { id: 40, name: "MMLU" } }],
        },
      },
    ],
  };
}

describe("Dataset details requirements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders dataset name and description", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(buildDataset() as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(vi.mocked(getDatasetByName)).toHaveBeenCalledWith("MMLU");
    expect(screen.getByRole("heading", { name: /mmlu/i })).toBeInTheDocument();
    expect(screen.getByText(/massive multitask language understanding benchmark/i)).toBeInTheDocument();
  });

  it("displays dataset metadata including size and data format types", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(buildDataset() as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByText(/14,000 tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/json/i)).toBeInTheDocument();
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
  });

  it("displays related practices as links derived from references", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(buildDataset() as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    const practiceLink = screen.getByRole("link", { name: /few-shot prompting/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink).toHaveAttribute("href", expect.stringContaining("practices"));
  });

  it("displays references dataset is extracted from with year", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(buildDataset() as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /measuring massive multitask language understanding \(2020\)/i });
    expect(refLink).toBeInTheDocument();
    expect(refLink).toHaveAttribute("href", expect.stringContaining("references"));
  });

  it("handles missing description gracefully", async () => {
    const datasetWithoutDescription = { ...buildDataset(), description: null };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutDescription as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByRole("heading", { name: /mmlu/i })).toBeInTheDocument();
  });

  it("handles missing size field by showing placeholder", async () => {
    const datasetWithoutSize = { ...buildDataset(), size: null };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutSize as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByText(/no size specified/i)).toBeInTheDocument();
  });

  it("handles empty data format types list", async () => {
    const datasetWithoutFormats = { ...buildDataset(), dataFormatType: [] };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutFormats as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByText(/no data format types specified/i)).toBeInTheDocument();
  });

  it("handles empty related practices list", async () => {
    const datasetWithoutPractices = {
      ...buildDataset(),
      papers: [
        {
          referenceId: 1,
          reference: {
            title: "Test Reference",
            year: 2020,
            practices: [],
            datasets: [{ dataset: { id: 40, name: "MMLU" } }],
          },
        },
      ],
    };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutPractices as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByText(/no practices linked yet/i)).toBeInTheDocument();
  });

  it("handles empty references list", async () => {
    const datasetWithoutReferences = { ...buildDataset(), papers: [] };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutReferences as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    expect(screen.getByText(/no references linked yet/i)).toBeInTheDocument();
  });

  it("deduplicates related practices from multiple references", async () => {
    const datasetWithDuplicatePractices = {
      ...buildDataset(),
      papers: [
        {
          referenceId: 1,
          reference: {
            title: "Reference 1",
            year: 2020,
            practices: [
              { practiceId: 1, practice: { id: 1, name: "Few-shot Prompting" } },
            ],
            datasets: [{ dataset: { id: 40, name: "MMLU" } }],
          },
        },
        {
          referenceId: 2,
          reference: {
            title: "Reference 2",
            year: 2021,
            practices: [
              { practiceId: 1, practice: { id: 1, name: "Few-shot Prompting" } },
            ],
            datasets: [{ dataset: { id: 40, name: "MMLU" } }],
          },
        },
      ],
    };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithDuplicatePractices as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    const practiceLinks = screen.getAllByRole("link", { name: /few-shot prompting/i });
    expect(practiceLinks).toHaveLength(1);
  });

  it("handles missing reference year in related references", async () => {
    const datasetWithoutYear = {
      ...buildDataset(),
      papers: [
        {
          referenceId: 1,
          reference: {
            title: "Test Reference",
            year: null,
            practices: [],
            datasets: [{ dataset: { id: 40, name: "MMLU" } }],
          },
        },
      ],
    };
    vi.mocked(getDatasetByName).mockResolvedValue(datasetWithoutYear as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU" }),
      }),
    );

    const refLink = screen.getByRole("link", { name: /test reference$/i });
    expect(refLink).toBeInTheDocument();
  });

  it("handles missing dataset by delegating to notFound", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(null);

    await expect(
      DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "UNKNOWN" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it("decodes URL-encoded dataset name", async () => {
    vi.mocked(getDatasetByName).mockResolvedValue(buildDataset() as never);

    render(
      await DatasetDetailsPage({
        params: Promise.resolve({ datasetName: "MMLU%20Benchmark" }),
      }),
    );

    expect(vi.mocked(getDatasetByName)).toHaveBeenCalledWith("MMLU Benchmark");
  });
});
