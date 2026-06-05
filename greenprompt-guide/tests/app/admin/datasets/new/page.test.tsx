import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewDatasetPage from "@/app/admin/datasets/new/page";

const listReferencesMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/reference-repository", () => ({
  listReferences: listReferencesMock,
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

describe("NewDatasetPage", () => {
  it("renders page header", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    expect(screen.getByText("Add dataset")).toBeInTheDocument();
    expect(screen.getByText(/register a new evaluation or training dataset/i)).toBeInTheDocument();
  });

  it("renders back to datasets link", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    const backLink = screen.getByRole("link", { name: /back to datasets/i });
    expect(backLink).toHaveAttribute("href", "/admin/datasets");
  });

  it("renders DatasetForm component", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    expect(screen.getByTestId("dataset-form")).toBeInTheDocument();
  });

  it("passes correct submit URL to form", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.submitUrl).toBe("/api/admin/datasets");
  });

  it("passes correct redirect path to form", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.redirectPath).toBe("/admin/datasets");
  });

  it("passes references to form", async () => {
    listReferencesMock.mockResolvedValueOnce([
      {
        title: "Paper 1",
        year: 2024,
        authors: "Smith et al.",
      },
      {
        title: "Paper 2",
        year: 2023,
        authors: "Jones et al.",
      },
    ]);

    const element = await NewDatasetPage();
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.references).toHaveLength(2);
    expect(props.references[0]).toEqual({
      title: "Paper 1",
      year: 2024,
      authors: "Smith et al.",
    });
  });

  it("queries references on page load", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    await NewDatasetPage();

    expect(listReferencesMock).toHaveBeenCalled();
  });

  it("handles empty references list", async () => {
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await NewDatasetPage();
    render(element);

    const form = screen.getByTestId("dataset-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.references).toEqual([]);
  });
});
