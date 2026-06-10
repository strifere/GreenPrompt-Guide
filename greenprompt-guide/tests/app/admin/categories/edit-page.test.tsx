import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditCategoryPage from "@/app/admin/categories/edit/[categoryName]/page";

const prismaFindUniqueMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: prismaFindUniqueMock,
    },
  },
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

vi.mock("@/app/admin/categories/category-form", () => ({
  CategoryForm: (props: any) => (
    <div data-testid="category-form" data-props={JSON.stringify(props)}>
      Form
    </div>
  ),
}));

describe("EditCategoryPage", () => {
  it("calls notFound when category does not exist", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce(null);

    try {
      await EditCategoryPage({ params: Promise.resolve({ categoryName: "NonExistent" }) });
    } catch {
      // notFound throws
    }

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders page header", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Prompt Design",
      description: null,
      tactic: "GREEN_PRACTICE",
    });

    const element = await EditCategoryPage({
      params: Promise.resolve({ categoryName: "Prompt+Design" }),
    });
    render(element);

    expect(screen.getByText("Modify category")).toBeInTheDocument();
    expect(screen.getByText(/update the category description/i)).toBeInTheDocument();
  });

  it("renders back link to categories list", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Prompt Design",
      description: null,
      tactic: "GREEN_PRACTICE",
    });

    const element = await EditCategoryPage({
      params: Promise.resolve({ categoryName: "Prompt+Design" }),
    });
    render(element);

    const backLink = screen.getByRole("link", { name: /back to categories/i });
    expect(backLink).toHaveAttribute("href", "/admin/categories");
  });

  it("passes edit mode and PATCH method to form", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Prompt Design",
      description: null,
      tactic: "GREEN_PRACTICE",
    });

    const element = await EditCategoryPage({
      params: Promise.resolve({ categoryName: "Prompt+Design" }),
    });
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");

    expect(props.mode).toBe("edit");
    expect(props.method).toBe("PATCH");
  });

  it("passes initial values from database to form", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Inference Efficiency",
      description: "Reduce overhead",
      tactic: "RED_PRACTICE",
    });

    const element = await EditCategoryPage({
      params: Promise.resolve({ categoryName: "Inference+Efficiency" }),
    });
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");

    expect(props.initialValues).toEqual({
      name: "Inference Efficiency",
      description: "Reduce overhead",
      tactic: "RED_PRACTICE",
    });
  });

  it("includes encoded category name in submit URL", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Prompt Design",
      description: null,
      tactic: "GREEN_PRACTICE",
    });

    const element = await EditCategoryPage({
      params: Promise.resolve({ categoryName: "Prompt+Design" }),
    });
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");

    expect(props.submitUrl).toContain("/api/admin/categories/");
    expect(props.submitUrl).toContain(encodeURIComponent("Prompt Design"));
  });

  it("decodes the URL param when looking up the category", async () => {
    prismaFindUniqueMock.mockResolvedValueOnce({
      name: "Prompt & Design",
      description: null,
      tactic: "GREEN_PRACTICE",
    });

    await EditCategoryPage({
      params: Promise.resolve({ categoryName: encodeURIComponent("Prompt & Design") }),
    });

    expect(prismaFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: "Prompt & Design" } }),
    );
  });
});
