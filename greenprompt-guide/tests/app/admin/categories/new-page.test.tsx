import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewCategoryPage from "@/app/admin/categories/new/page";

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

describe("NewCategoryPage", () => {
  it("renders page header", async () => {
    const element = await NewCategoryPage();
    render(element);

    expect(screen.getByText("Add category")).toBeInTheDocument();
    expect(screen.getByText(/register a new category/i)).toBeInTheDocument();
  });

  it("renders back link to categories list", async () => {
    const element = await NewCategoryPage();
    render(element);

    const backLink = screen.getByRole("link", { name: /back to categories/i });
    expect(backLink).toHaveAttribute("href", "/admin/categories");
  });

  it("renders the form component", async () => {
    const element = await NewCategoryPage();
    render(element);

    expect(screen.getByTestId("category-form")).toBeInTheDocument();
  });

  it("passes correct submit URL to form", async () => {
    const element = await NewCategoryPage();
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.submitUrl).toBe("/api/admin/categories");
  });

  it("passes correct redirect path to form", async () => {
    const element = await NewCategoryPage();
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.redirectPath).toBe("/admin/categories");
  });

  it("does not pass initialValues to the form", async () => {
    const element = await NewCategoryPage();
    render(element);

    const form = screen.getByTestId("category-form");
    const props = JSON.parse(form.getAttribute("data-props") || "{}");
    expect(props.initialValues).toBeUndefined();
  });
});
