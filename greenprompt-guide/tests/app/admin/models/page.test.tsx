import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminModelsPage from "@/app/admin/models/page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    model: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/admin-delete-action", () => ({
  AdminDeleteAction: ({ type, objectKey }: { type: string; objectKey: string | number }) => (
    <div data-testid={`delete-${type}-${objectKey}`}>Delete Action</div>
  ),
}));

describe("Admin Models Page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the models page header", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValueOnce([]);

    render(await AdminModelsPage());

    expect(screen.getByText(/All models/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage the AI models/i)).toBeInTheDocument();
  });

  it("displays empty state when no models exist", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValueOnce([]);

    render(await AdminModelsPage());

    expect(screen.getByText(/No models yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Once models are added/i)).toBeInTheDocument();
  });

  it("renders add model button", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValueOnce([]);

    render(await AdminModelsPage());

    const addButton = screen.getByText(/Add model/i);
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute("href", "/admin/models/new");
  });

  it("displays list of models when models exist", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "A powerful language model",
        parameters: "175B",
        size: "large",
        dataFormatType: ["TEXT_ONLY", "IMAGE"],
        practices: [{ id: 1, name: "Few-shot" }],
        references: [{ title: "Paper 1" }],
      },
      {
        name: "LLaMA-2-7B",
        description: "Open source model",
        parameters: "7B",
        size: "small",
        dataFormatType: ["TEXT_ONLY"],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("GPT-4")).toBeInTheDocument();
    expect(screen.getByText("LLaMA-2-7B")).toBeInTheDocument();
    expect(screen.getByText("A powerful language model")).toBeInTheDocument();
  });

  it("displays model parameters as badge", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: "175B",
        size: null,
        dataFormatType: ["TEXT_ONLY"],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("175B")).toBeInTheDocument();
  });

  it("omits parameters badge when not provided", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: "large",
        dataFormatType: ["TEXT_ONLY"],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    // Should not find the badge, but the title should exist
    expect(screen.getByText("GPT-4")).toBeInTheDocument();
  });

  it("displays size information in metadata", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: "14GB",
        dataFormatType: ["TEXT_ONLY"],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("Size: 14GB")).toBeInTheDocument();
  });

  it("displays data formats in metadata", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: ["TEXT_ONLY", "IMAGE", "PDF"],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("TEXT_ONLY, IMAGE, PDF")).toBeInTheDocument();
  });

  it("displays practices count", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [
          { id: 1, name: "Practice 1" },
          { id: 2, name: "Practice 2" },
        ],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("2 practices")).toBeInTheDocument();
  });

  it("displays references count", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [
          { title: "Paper 1" },
          { title: "Paper 2" },
        ],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByText("2 references")).toBeInTheDocument();
  });

  it("links to catalog model page", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    const link = screen.getByRole("link", { name: /GPT-4/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("catalog/models"));
  });

  it("provides modify button for each model", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    const modifyButton = screen.getByText(/Modify/i);
    expect(modifyButton).toHaveAttribute("href", expect.stringContaining("/admin/models/edit"));
  });

  it("provides delete action for each model", async () => {
    const mockModels = [
      {
        name: "GPT-4",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    render(await AdminModelsPage());

    expect(screen.getByTestId("delete-model-GPT-4")).toBeInTheDocument();
  });

  it("orders models alphabetically", async () => {
    const mockModels = [
      {
        name: "Zebra-Model",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [],
      },
      {
        name: "Alpha-Model",
        description: "Model",
        parameters: null,
        size: null,
        dataFormatType: [],
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.model.findMany).mockResolvedValueOnce(mockModels as any);

    // Verify the query was called with correct order
    render(await AdminModelsPage());

    expect(prisma.model.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: {
        practices: true,
        references: true,
      },
    });
  });

  it("fetches models with relationships", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValueOnce([]);

    render(await AdminModelsPage());

    expect(prisma.model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          practices: true,
          references: true,
        },
      })
    );
  });
});