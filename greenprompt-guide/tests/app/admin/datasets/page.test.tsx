import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminDatasetsPage from "@/app/admin/datasets/page";

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
    dataset: {
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

describe("AdminDatasetsPage", () => {
  it("renders page header with title", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("All datasets")).toBeInTheDocument();
    expect(screen.getByText(/manage the evaluation and training datasets/i)).toBeInTheDocument();
  });

  it("renders add dataset button", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminDatasetsPage();
    render(element);

    const addButton = screen.getByRole("link", { name: /add dataset/i });
    expect(addButton).toHaveAttribute("href", "/admin/datasets/new");
  });

  it("renders empty state when no datasets exist", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText(/no datasets yet/i)).toBeInTheDocument();
    expect(screen.getByText(/once datasets are added/i)).toBeInTheDocument();
  });

  it("renders list of datasets", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "Massive Multitask Language Understanding",
        size: "14,000 items",
        dataFormatType: ["TEXT_ONLY"],
        papers: [
          {
            reference: { title: "Hendrycks et al. 2021" },
          },
        ],
      },
      {
        name: "SQuAD",
        description: "Stanford Question Answering Dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY", "JSON"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("MMLU")).toBeInTheDocument();
    expect(screen.getByText("Massive Multitask Language Understanding")).toBeInTheDocument();
    expect(screen.getByText("SQuAD")).toBeInTheDocument();
  });

  it("renders dataset size in badge", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: "14,000 items",
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("14,000 items")).toBeInTheDocument();
  });

  it("omits size badge when null", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("renders data format types", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY", "CSV"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("TEXT_ONLY, CSV")).toBeInTheDocument();
  });

  it("renders reference count", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [
          { reference: { title: "Ref 1" } },
          { reference: { title: "Ref 2" } },
        ],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("2 references")).toBeInTheDocument();
  });

  it("shows singular reference text", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [{ reference: { title: "Ref 1" } }],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("1 reference")).toBeInTheDocument();
  });

  it("renders modify button for each dataset", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    const modifyLink = screen.getByRole("link", { name: /modify/i });
    expect(modifyLink).toHaveAttribute("href", "/admin/datasets/edit/MMLU");
  });

  it("encodes dataset name in modify link", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "Dataset & Model",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    const modifyLink = screen.getByRole("link", { name: /modify/i });
    expect(modifyLink).toHaveAttribute("href", "/admin/datasets/edit/Dataset%20%26%20Model");
  });

  it("renders delete button for each dataset", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("queries datasets in ascending order", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    await AdminDatasetsPage();

    expect(prismaFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { papers: true },
    });
  });

  it("renders catalog links for datasets", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "A dataset",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        papers: [],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    const catalogLink = screen.getByText("MMLU");
    expect(catalogLink.closest("a")).toHaveAttribute("href", expect.stringContaining("MMLU"));
  });

  it("renders multiple datasets with all data", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        name: "MMLU",
        description: "Multitask benchmark",
        size: "14K",
        dataFormatType: ["TEXT_ONLY"],
        papers: [{ reference: { title: "Hendrycks 2021" } }],
      },
      {
        name: "TruthfulQA",
        description: "Truthfulness benchmark",
        size: "1.8K",
        dataFormatType: ["TEXT_ONLY", "JSON"],
        papers: [
          { reference: { title: "Lin 2021" } },
          { reference: { title: "Weights 2023" } },
        ],
      },
    ]);

    const element = await AdminDatasetsPage();
    render(element);

    expect(screen.getByText("MMLU")).toBeInTheDocument();
    expect(screen.getByText("TruthfulQA")).toBeInTheDocument();
    expect(screen.getByText("Multitask benchmark")).toBeInTheDocument();
    expect(screen.getByText("Truthfulness benchmark")).toBeInTheDocument();
  });
});
