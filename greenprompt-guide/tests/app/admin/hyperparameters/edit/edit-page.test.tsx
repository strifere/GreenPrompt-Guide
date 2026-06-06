import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditHyperparameterPage from "@/app/admin/hyperparameters/edit/[hyperparameterId]/page";

const getHyperparameterByIdMock = vi.hoisted(() => vi.fn());
const listReferencesMock = vi.hoisted(() => vi.fn());
const listPracticesMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound");
  })
);

vi.mock("@/domain/hyperparameter-repository", () => ({
  getHyperparameterById: getHyperparameterByIdMock,
}));

vi.mock("@/domain/reference-repository", () => ({
  listReferences: listReferencesMock,
}));

vi.mock("@/domain/practice-repository", () => ({
  listPractices: listPracticesMock,
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

vi.mock("@/app/admin/hyperparameters/hyperparameter-form", () => ({
  HyperparameterForm: (props: any) => (
    <div data-testid="hyperparameter-form" data-props={JSON.stringify(props)}>
      Form
    </div>
  ),
}));

describe("EditHyperparameterPage", () => {
  it("calls notFound when hyperparameter does not exist", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce(null);
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    try {
      await EditHyperparameterPage({
        params: Promise.resolve({ hyperparameterId: "99" }),
      });
    } catch (e) {
      if (e instanceof Error && e.message === "notFound") {
        // Expected error, do nothing
      } else {
        throw e; // Unexpected error, rethrow
      }
    }

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders page header", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 1,
      name: "learning_rate",
      value: "0.001",
      dataType: "float",
      referenceTitle: "Paper A",
      practiceName: null,
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "1" }),
    });
    render(element);

    expect(screen.getByText("Modify hyperparameter")).toBeInTheDocument();
    expect(screen.getByText(/update the hyperparameter details/i)).toBeInTheDocument();
  });

  it("passes edit mode to form", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 1,
      name: "learning_rate",
      value: "0.001",
      dataType: "float",
      referenceTitle: "Paper A",
      practiceName: null,
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "1" }),
    });
    render(element);
  });

  it("passes PATCH method to form", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 1,
      name: "learning_rate",
      value: "0.001",
      dataType: "float",
      referenceTitle: "Paper A",
      practiceName: null,
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "1" }),
    });
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.method).toBe("PATCH");
  });

  it("passes initial values to form", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 42,
      name: "batch_size",
      value: "32",
      dataType: "int",
      referenceTitle: "Paper B",
      practiceName: "Practice 1",
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "42" }),
    });
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.dataset.props || "{}");

    expect(props.initialValues).toEqual({
      id: 42,
      name: "batch_size",
      value: "32",
      dataType: "int",
      referenceTitle: "Paper B",
      practiceName: "Practice 1",
    });
  });

  it("passes encoded ID in submitUrl", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 1,
      name: "learning_rate",
      value: "0.001",
      dataType: "float",
      referenceTitle: "Paper A",
      practiceName: null,
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    const element = await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "1" }),
    });
    render(element);

    const form = screen.getByTestId("hyperparameter-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.submitUrl).toContain("/api/admin/hyperparameters/1");
  });

  it("parses hyperparameter ID from URL", async () => {
    getHyperparameterByIdMock.mockResolvedValueOnce({
      id: 123,
      name: "temp",
      value: "0.7",
      dataType: "float",
      referenceTitle: "Paper",
      practiceName: null,
    });
    listReferencesMock.mockResolvedValueOnce([]);
    listPracticesMock.mockResolvedValueOnce([]);

    await EditHyperparameterPage({
      params: Promise.resolve({ hyperparameterId: "123" }),
    });

    expect(getHyperparameterByIdMock).toHaveBeenCalledWith(123);
  });
});
