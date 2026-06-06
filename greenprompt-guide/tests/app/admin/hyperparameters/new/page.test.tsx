import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewHyperparameterPage from "@/app/admin/hyperparameters/new/page";

const listReferencesMock = vi.hoisted(() => vi.fn());
const listPracticesMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/reference-repository", () => ({
  listReferences: listReferencesMock,
}));

vi.mock("@/domain/practice-repository", () => ({
  listPractices: listPracticesMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/hyperparameters/hyperparameter-form", () => ({
  HyperparameterForm: (props: any) => (
    <div data-testid="hyperparameter-form" data-props={JSON.stringify(props)}>
      Form
    </div>
  ),
}));

describe("NewHyperparameterPage", () => {
  it("renders page header", async () => {
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await NewHyperparameterPage();
    render(element);

    expect(screen.getByText("Add hyperparameter")).toBeInTheDocument();
    expect(screen.getByText(/register a new hyperparameter/i)).toBeInTheDocument();
  });

  it("renders back link", async () => {
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await NewHyperparameterPage();
    render(element);

    const backLink = screen.getByRole("link", { name: /back to hyperparameters/i });
    expect(backLink).toHaveAttribute("href", "/admin/hyperparameters");
  });

  it("renders form component", async () => {
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await NewHyperparameterPage();
    render(element);

    expect(screen.getByTestId("hyperparameter-form")).toBeInTheDocument();
  });

  it("passes correct submit URL", async () => {
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await NewHyperparameterPage();
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.submitUrl).toBe("/api/admin/hyperparameters");
  });

  it("passes references to form", async () => {
    listReferencesMock.mockResolvedValueOnce([
      { title: "Paper A", year: 2024, authors: "Smith" },
      { title: "Paper B", year: 2023, authors: "Jones" },
    ]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await NewHyperparameterPage();
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.references).toHaveLength(2);
  });

  it("passes practices to form", async () => {
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([
      { name: "Practice 1" },
      { name: "Practice 2" },
    ]);

    const element = await NewHyperparameterPage();
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.practices).toHaveLength(2);
  });
});
