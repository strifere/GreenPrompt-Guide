import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EditModelPage from "@/app/admin/models/edit/[modelName]/page";
import * as modelRepository from "@/domain/model-repository";
import * as referenceRepository from "@/domain/reference-repository";
import { notFound } from "next/navigation";

vi.mock("@/domain/model-repository", () => ({
  getModelByName: vi.fn(),
}));

vi.mock("@/domain/reference-repository", () => ({
  listReferences: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <div>Arrow</div>,
}));

vi.mock("@/app/admin/models/model-form", () => ({
  ModelForm: ({
    mode,
    method,
    submitUrl,
    redirectPath,
    initialValues,
    references,
  }: {
    mode: string;
    method: string;
    submitUrl: string;
    redirectPath: string;
    initialValues: any;
    references: any[];
  }) => (
    <div>
      ModelForm - mode: {mode} - method: {method} - {submitUrl}
    </div>
  ),
}));

describe("Edit Model Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: "175B",
      size: "large",
      dataFormatType: ["TEXT_ONLY"],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/Modify model/i)).toBeInTheDocument();
  });

  it("decodes URL-encoded model name", async () => {
    const mockModel = {
      name: "GPT-4 Advanced",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4%20Advanced" }),
      })
    );

    expect(modelRepository.getModelByName).toHaveBeenCalledWith("GPT-4 Advanced");
  });

  it("calls notFound when model does not exist", async () => {
    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(null);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    try {
      await EditModelPage({
        params: Promise.resolve({ modelName: "NonExistent" }),
      });
    } catch (e) {
      // Expected error
    }

    expect(notFound).toHaveBeenCalled();
  });

  it("fetches model and references in parallel", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(modelRepository.getModelByName).toHaveBeenCalled();
    expect(referenceRepository.listReferences).toHaveBeenCalled();
  });

  it("passes edit mode to form", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/mode: edit/)).toBeInTheDocument();
  });

  it("passes PATCH method to form", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/method: PATCH/)).toBeInTheDocument();
  });

  it("constructs correct API submit URL", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/\/api\/admin\/models\/GPT-4/)).toBeInTheDocument();
  });

  it("passes correct redirect path", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/\/admin\/models/)).toBeInTheDocument();
  });

  it("maps model references for form", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [
        {
          modelId: "gpt-4",
          referenceId: 1,
          reference: { title: "Paper 1" },
        },
      ],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/ModelForm/)).toBeInTheDocument();
  });

  it("displays back to models link", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    const backLink = screen.getByRole("link", { name: /Back to models/i });
    expect(backLink).toHaveAttribute("href", "/admin/models");
  });

  it("displays description text", async () => {
    const mockModel = {
      name: "GPT-4",
      description: "Model",
      parameters: null,
      size: null,
      dataFormatType: [],
      references: [],
    };

    vi.mocked(modelRepository.getModelByName).mockResolvedValueOnce(mockModel as any);
    vi.mocked(referenceRepository.listReferences).mockResolvedValueOnce([]);

    render(
      await EditModelPage({
        params: Promise.resolve({ modelName: "GPT-4" }),
      })
    );

    expect(screen.getByText(/Update the model details/i)).toBeInTheDocument();
  });
});