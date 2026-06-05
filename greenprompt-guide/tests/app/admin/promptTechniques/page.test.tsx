import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminPromptTechniquesPage from "@/app/admin/promptTechniques/page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptTechnique: {
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

vi.mock("@/app/admin/promptTechniques/admin-prompt-technique-delete-action", () => ({
  AdminPromptTechniqueDeleteAction: ({ techniqueName }: { techniqueName: string }) => (
    <div data-testid={`delete-technique-${techniqueName}`}>Delete Action</div>
  ),
}));

describe("Admin Prompt Techniques Page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header", async () => {
    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce([]);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText(/All prompt techniques/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage the prompt techniques/i)).toBeInTheDocument();
  });

  it("displays empty state when no techniques exist", async () => {
    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce([]);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText(/No prompt techniques yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Once prompt techniques are added/i)).toBeInTheDocument();
  });

  it("renders add technique button", async () => {
    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce([]);

    render(await AdminPromptTechniquesPage());

    const addButton = screen.getByText(/Add technique/i);
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute("href", "/admin/promptTechniques/new");
  });

  it("displays list of techniques when techniques exist", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Breaking down reasoning",
        example: "Let me think step by step",
        practices: [],
        references: [],
      },
      {
        name: "Few-shot Prompting",
        description: "Using examples",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText("Chain of Thought")).toBeInTheDocument();
    expect(screen.getByText("Few-shot Prompting")).toBeInTheDocument();
  });

  it("displays technique description", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Breaking down complex reasoning into steps",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText("Breaking down complex reasoning into steps")).toBeInTheDocument();
  });

  it("displays example when provided", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: "Let me think through this...",
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText(/Example: Let me think through this/i)).toBeInTheDocument();
  });

  it("omits example when not provided", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    // Should not find the example text
    expect(screen.queryByText(/Example:/)).not.toBeInTheDocument();
  });

  it("displays practices count", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [{ id: 1, name: "Practice 1" }],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText("1 practice")).toBeInTheDocument();
  });

  it("displays plural practices count", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [
          { id: 1, name: "Practice 1" },
          { id: 2, name: "Practice 2" },
        ],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText("2 practices")).toBeInTheDocument();
  });

  it("displays references count", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [],
        references: [
          { referenceId: 1, reference: { title: "Paper 1" } },
          { referenceId: 2, reference: { title: "Paper 2" } },
        ],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByText("2 references")).toBeInTheDocument();
  });

  it("links to catalog technique page", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    const link = screen.getByRole("link", { name: /Chain of Thought/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("catalog/promptTechniques"));
  });

  it("provides modify button for each technique", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    const modifyButton = screen.getByText(/Modify/i);
    expect(modifyButton).toHaveAttribute(
      "href",
      expect.stringContaining("/admin/promptTechniques/edit")
    );
  });

  it("provides delete action for each technique", async () => {
    const mockTechniques = [
      {
        name: "Chain of Thought",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(screen.getByTestId("delete-technique-Chain of Thought")).toBeInTheDocument();
  });

  it("orders techniques alphabetically", async () => {
    const mockTechniques = [
      {
        name: "Zebra Technique",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
      {
        name: "Alpha Technique",
        description: "Description",
        example: null,
        practices: [],
        references: [],
      },
    ];

    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce(mockTechniques as any);

    render(await AdminPromptTechniquesPage());

    expect(prisma.promptTechnique.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: {
        practices: true,
        references: true,
      },
    });
  });

  it("fetches techniques with relationships", async () => {
    vi.mocked(prisma.promptTechnique.findMany).mockResolvedValueOnce([]);

    render(await AdminPromptTechniquesPage());

    expect(prisma.promptTechnique.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          practices: true,
          references: true,
        },
      })
    );
  });
});