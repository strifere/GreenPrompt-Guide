import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminHyperparametersPage from "@/app/admin/hyperparameters/page";

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
    hyperparameter: {
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

describe("AdminHyperparametersPage", () => {
  it("renders page header with title", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByText("All hyperparameters")).toBeInTheDocument();
    expect(screen.getByText(/manage the different hyperparameters/i)).toBeInTheDocument();
  });

  it("renders add hyperparameter button", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminHyperparametersPage();
    render(element);

    const addButton = screen.getByRole("link", { name: /add hyperparameter/i });
    expect(addButton).toHaveAttribute("href", "/admin/hyperparameters/new");
  });

  it("renders empty state when no hyperparameters exist", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByText(/no hyperparameters yet/i)).toBeInTheDocument();
  });

  it("renders list of hyperparameters", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        name: "learning_rate",
        referenceTitle: "Paper A",
        practiceName: null,
      },
      {
        id: 2,
        name: "batch_size",
        referenceTitle: "Paper B",
        practiceName: "My Practice",
      },
    ]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByText("learning_rate")).toBeInTheDocument();
    expect(screen.getByText("batch_size")).toBeInTheDocument();
  });

  it("renders hyperparameter details", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        name: "learning_rate",
        referenceTitle: "Paper A",
        practiceName: null,
      },
    ]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByText(/Extracted from: Paper A/i)).toBeInTheDocument();
  });

  it("renders modify button for each hyperparameter", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 42,
        name: "learning_rate",
        referenceTitle: "Paper A",
        practiceName: null,
      },
    ]);

    const element = await AdminHyperparametersPage();
    render(element);

    const modifyLink = screen.getByRole("link", { name: /modify/i });
    expect(modifyLink).toHaveAttribute("href", "/admin/hyperparameters/edit/42");
  });

  it("renders delete button for each hyperparameter", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        name: "learning_rate",
        referenceTitle: "Paper A",
        practiceName: null,
      },
    ]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("queries hyperparameters in ascending order by name", async () => {
    prismaFindManyMock.mockResolvedValueOnce([]);

    await AdminHyperparametersPage();

    expect(prismaFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
  });

  it("renders multiple hyperparameters", async () => {
    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 1,
        name: "batch_size",
        referenceTitle: "Paper A",
        practiceName: null,
      },
      {
        id: 2,
        name: "learning_rate",
        referenceTitle: "Paper B",
        practiceName: "Practice 1",
      },
      {
        id: 3,
        name: "temperature",
        referenceTitle: "Paper C",
        practiceName: null,
      },
    ]);

    const element = await AdminHyperparametersPage();
    render(element);

    expect(screen.getByText("batch_size")).toBeInTheDocument();
    expect(screen.getByText("learning_rate")).toBeInTheDocument();
    expect(screen.getByText("temperature")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(3);
  });
});
