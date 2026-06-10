import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminPracticesNewPage from "@/app/admin/practices/new/page";

const prismaCategoryFindManyMock = vi.hoisted(() => vi.fn());
const listReferencesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: prismaCategoryFindManyMock,
    },
  },
}));

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

vi.mock("@/app/admin/practices/practice-form", () => ({
  PracticeForm: (props: any) => (
    <div data-testid="practice-form" data-props={JSON.stringify(props)}>
      Practice Form
    </div>
  ),
}));

describe("AdminPracticesNewPage", () => {
  it("renders page header", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await AdminPracticesNewPage();
    render(element);

    expect(screen.getByText("Create practice")).toBeInTheDocument();
  });

  it("renders back link", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await AdminPracticesNewPage();
    render(element);

    const backLink = screen.getByRole("link", { name: /back to practices/i });
    expect(backLink).toHaveAttribute("href", "/admin/practices");
  });

  it("renders PracticeForm component", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await AdminPracticesNewPage();
    render(element);

    expect(screen.getByTestId("practice-form")).toBeInTheDocument();
  });

  it("passes correct submit URL to form", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await AdminPracticesNewPage();
    render(element);

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.submitUrl).toBe("/api/admin/practices");
  });

  it("queries categories ordered by name", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);

    await AdminPracticesNewPage();

    expect(prismaCategoryFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: {
        name: true,
        description: true,
        tactic: true,
      },
    });
  });

  it("passes categories to form", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([
      { name: "Efficiency", description: "Energy efficiency", tactic: "GREEN_PRACTICE" },
      { name: "Accuracy", description: "Model accuracy", tactic: "QUALITY_PRACTICE" },
    ]);
    listReferencesMock.mockResolvedValueOnce([]);

    const element = await AdminPracticesNewPage();
    render(element);

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.categories).toHaveLength(2);
  });

  it("passes references to form", async () => {
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([
      { title: "Paper A", year: 2024, authors: "Smith" },
    ]);

    const element = await AdminPracticesNewPage();
    render(element);

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.references).toHaveLength(1);
  });
});
