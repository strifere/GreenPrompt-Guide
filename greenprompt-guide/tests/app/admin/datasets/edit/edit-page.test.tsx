import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditDatasetPage from "@/app/admin/datasets/edit/[datasetName]/page";

const getDatasetByNameMock = vi.hoisted(() => vi.fn());
const listReferencesMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  })
);

vi.mock("@/domain/dataset-repository", () => ({
  getDatasetByName: getDatasetByNameMock,
}));

vi.mock("@/domain/reference-repository", () => ({
  listReferences: listReferencesMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/datasets/dataset-form", () => ({
  DatasetForm: (props: any) => (
    <div data-testid="dataset-form" data-props={JSON.stringify(props)}>
      Dataset Form
    </div>
  ),
}));

describe("EditDatasetPage", () => {
  it("calls notFound when dataset does not exist", async () => {
    getDatasetByNameMock.mockResolvedValueOnce(null);
    listReferencesMock.mockResolvedValueOnce([]);

    try {
      const page = EditDatasetPage({
        params: Promise.resolve({ datasetName: "nonexistent" }),
      });
      await page;
    } catch (e) {
      // notFound throws, so we catch it
    }

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders page header", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    expect(screen.getByText("Modify dataset")).toBeInTheDocument();
    expect(screen.getByText(/update the dataset details/i)).toBeInTheDocument();
  });

  it("renders back to datasets link", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const backLink = screen.getByRole("link", { name: /back to datasets/i });
    expect(backLink).toHaveAttribute("href", "/admin/datasets");
  });

  it("passes correct form mode", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.mode).toBe("edit");
  });

  it("passes PATCH method to form", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.method).toBe("PATCH");
  });

  it("passes encoded dataset name in submitUrl", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "Dataset & Test",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "Dataset%20%26%20Test" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.submitUrl).toContain("Dataset%20%26%20Test");
  });

  it("passes initial values to form", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "Multitask benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY", "JSON"],
      papers: [
        { reference: { title: "Hendrycks 2021" } },
        { reference: { title: "Extended Study" } },
      ],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");

    expect(props.initialValues).toEqual({
      name: "MMLU",
      description: "Multitask benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY", "JSON"],
      selectedReferenceTitles: ["Hendrycks 2021", "Extended Study"],
    });
  });

  it("deduplicates reference titles from papers", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [
        { reference: { title: "Paper 1" } },
        { reference: { title: "Paper 1" } },
        { reference: { title: "Paper 2" } },
      ],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.initialValues.selectedReferenceTitles).toEqual(["Paper 1", "Paper 2"]);
  });

  it("passes redirect path", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.redirectPath).toBe("/admin/datasets");
  });

  it("passes references to form", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([
      {
        title: "Paper A",
        year: 2024,
        authors: "Smith et al.",
      },
      {
        title: "Paper B",
        year: 2023,
        authors: "Jones et al.",
      },
    ]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.references).toHaveLength(2);
  });

  it("decodes dataset name from URL parameter", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "Dataset & Model",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    await EditDatasetPage({
      params: Promise.resolve({ datasetName: "Dataset%20%26%20Model" }),
    });

    expect(getDatasetByNameMock).toHaveBeenCalledWith("Dataset & Model");
  });

  it("handles dataset with no papers", async () => {
    getDatasetByNameMock.mockResolvedValueOnce({
      name: "MMLU",
      description: "A benchmark",
      size: "14K",
      dataFormatType: ["TEXT_ONLY"],
      papers: [],
    });
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await EditDatasetPage({
      params: Promise.resolve({ datasetName: "MMLU" }),
    });
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.initialValues.selectedReferenceTitles).toEqual([]);
  });
});
