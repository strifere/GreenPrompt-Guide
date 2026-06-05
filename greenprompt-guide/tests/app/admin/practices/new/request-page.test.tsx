import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminRequestPracticePage from "@/app/admin/practices/new/[requestId]/page";

const getCollaborationRequestDetailsById = vi.hoisted(() => vi.fn());
const prismaCategoryFindManyMock = vi.hoisted(() => vi.fn());
const listReferencesMock = vi.hoisted(() => vi.fn());
const listPromptTechniquesMock = vi.hoisted(() => vi.fn());
const listModelsMock = vi.hoisted(() => vi.fn());
const listHyperparametersMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  })
);

vi.mock("@/domain/collaboration-request-repository", () => ({
  getCollaborationRequestDetailsById: getCollaborationRequestDetailsById,
}));

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

vi.mock("@/domain/prompt-technique-repository", () => ({
  listPromptTechniques: listPromptTechniquesMock,
}));

vi.mock("@/domain/model-repository", () => ({
  listModels: listModelsMock,
}));

vi.mock("@/domain/hyperparameter-repository", () => ({
  listHyperparameters: listHyperparametersMock,
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

vi.mock("@/app/admin/practices/new/[requestId]/request-practice-form", () => ({
  RequestPracticeForm: (props: any) => (
    <div data-testid="request-practice-form" data-props={JSON.stringify(props)}>
      Form
    </div>
  ),
}));

describe("AdminRequestPracticePage", () => {
  it("calls notFound when request does not exist", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce(null);
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    try {
      await AdminRequestPracticePage({
        params: Promise.resolve({ requestId: "999" }),
      });
    } catch (e) {
      // notFound throws, so we catch it
    }

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders page header", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Test Practice",
      summary: "Test summary",
      referenceTitle: "Paper A",
      referenceAuthors: "Smith et al.",
      referenceAbstract: "Abstract",
      referenceYear: 2024,
      examplesText: "Examples",
      requestDetails: "Details",
    });
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    const element = await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    expect(screen.getByText("Create practice from request")).toBeInTheDocument();
  });

  it("renders back link", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Practice",
      summary: "Summary",
      referenceTitle: "Paper",
      referenceAuthors: "Authors",
      referenceAbstract: "Abstract",
      referenceYear: 2024,
      examplesText: "Examples",
      requestDetails: "Details",
    });
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    const element = await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    const backLink = screen.getByRole("link", { name: /back to request/i });
    expect(backLink).toHaveAttribute("href", "/admin/requests/1");
  });

  it("renders request practice form", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceName: "Practice",
      summary: "Summary",
      referenceTitle: "Paper",
      referenceAuthors: "Authors",
      referenceAbstract: "Abstract",
      referenceYear: 2024,
      examplesText: "Examples",
      requestDetails: "Details",
    });
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    const element = await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    expect(screen.getByTestId("request-practice-form")).toBeInTheDocument();
  });

  it("passes request ID to form", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 42,
      practiceName: "Practice",
      summary: "Summary",
      referenceTitle: "Paper",
      referenceAuthors: "Authors",
      referenceAbstract: "Abstract",
      referenceYear: 2024,
      examplesText: "Examples",
      requestDetails: "Details",
    });
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    const element = await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "42" }),
    });
    render(element);

    const form = screen.getByTestId("request-practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.requestId).toBe(42);
  });

  it("passes request data to form", async () => {
    const requestData = {
      id: 1,
      practiceTitle: "Test Practice",
      practiceSummary: "Test summary",
      practiceDescription: "Description",
      referenceLink: "https://example.com",
      practiceExamples: "Examples",
      createdPractice: null,
    };
    getCollaborationRequestDetailsById.mockResolvedValueOnce(requestData);
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    const element = await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "1" }),
    });
    render(element);

    const form = screen.getByTestId("request-practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.requestId).toBe(1);
  });

  it("queries categories ordered by name", async () => {
    getCollaborationRequestDetailsById.mockResolvedValueOnce({
      id: 1,
      practiceTitle: "Practice",
      practiceSummary: "Summary",
      practiceDescription: "Description",
      referenceLink: "https://example.com",
      practiceExamples: "Examples",
      createdPractice: null,
    });
    prismaCategoryFindManyMock.mockResolvedValueOnce([]);
    listReferencesMock.mockResolvedValueOnce([]);
    listPromptTechniquesMock.mockResolvedValueOnce([]);
    listModelsMock.mockResolvedValueOnce([]);
    listHyperparametersMock.mockResolvedValueOnce([]);

    await AdminRequestPracticePage({
      params: Promise.resolve({ requestId: "1" }),
    });

    expect(prismaCategoryFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: {
        name: true,
        description: true,
        tactic: true,
      },
    });
  });
});
