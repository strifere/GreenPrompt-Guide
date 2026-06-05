import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminCategoriesPage from "@/app/admin/categories/page";

const prismaFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: prismaFindManyMock,
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminCategoriesPage", () => {
  it("renders page header with title", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("All categories")).toBeInTheDocument();
    expect(screen.getByText(/manage the categories/i)).toBeInTheDocument();
  });

  it("renders add category button linking to /admin/categories/new", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminCategoriesPage();
    render(element);

    const addButton = screen.getByRole("link", { name: /add category/i });
    expect(addButton).toHaveAttribute("href", "/admin/categories/new");
  });

  it("renders empty state when no categories exist", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  it("renders category names", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: "Covers prompt design practices",
        tactic: "GREEN_PRACTICE",
        _count: { practices: 3 },
      },
      {
        name: "Inference Overhead",
        description: null,
        tactic: "RED_PRACTICE",
        _count: { practices: 1 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("Prompt Design")).toBeInTheDocument();
    expect(screen.getByText("Inference Overhead")).toBeInTheDocument();
  });

  it("renders tactic badge for GREEN_PRACTICE", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("Green")).toBeInTheDocument();
  });

  it("renders tactic badge for RED_PRACTICE", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Wasteful Patterns",
        description: null,
        tactic: "RED_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("Red")).toBeInTheDocument();
  });

  it("renders category description when present", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: "Covers prompt design practices",
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("Covers prompt design practices")).toBeInTheDocument();
  });

  it("renders 'No description' fallback when description is null", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("renders practice count for a single practice", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 1 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("1 practice")).toBeInTheDocument();
  });

  it("renders practice count with plural for multiple practices", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 5 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getByText("5 practices")).toBeInTheDocument();
  });

  it("renders modify link pointing to edit route", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    const modifyLink = screen.getByRole("link", { name: /modify/i });
    expect(modifyLink).toHaveAttribute(
      "href",
      `/admin/categories/edit/${encodeURIComponent("Prompt Design")}`,
    );
  });

  it("renders delete button for each category", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
      {
        name: "Wasteful Patterns",
        description: null,
        tactic: "RED_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  it("queries categories in ascending order by name", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    await AdminCategoriesPage();

    expect(prismaFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { _count: { select: { practices: true } } },
    });
  });

  it("encodes special characters in the modify link href", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Prompt & Design",
        description: null,
        tactic: "GREEN_PRACTICE",
        _count: { practices: 0 },
      },
    ]);

    const element = await AdminCategoriesPage();
    render(element);

    const modifyLink = screen.getByRole("link", { name: /modify/i });
    expect(modifyLink.getAttribute("href")).toBe(
      `/admin/categories/edit/${encodeURIComponent("Prompt & Design")}`,
    );
  });
});
