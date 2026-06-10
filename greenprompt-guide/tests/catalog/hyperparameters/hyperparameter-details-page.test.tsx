import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HyperparameterDetailsPage from "@/app/catalog/hyperparameters/[hyperparameterId]/page";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { getHyperparameterById } from "@/domain/hyperparameter-repository";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: vi.fn(),
}));

vi.mock("@/domain/hyperparameter-repository", () => ({
  getHyperparameterById: vi.fn(),
}));

describe("HyperparameterDetailsPage", () => {
  const mockParams = { params: Promise.resolve({ hyperparameterId: "1" }) };

  it("should render hyperparameter details for a non-admin user", async () => {
    const mockHyperparameter = {
      id: 1,
      name: "Learning Rate",
      value: "0.01",
      dataType: "float",
      practiceName: "Test Practice",
      referenceTitle: "Test Reference",
    };

    const getHyperparameterByIdMock = getHyperparameterById as jest.Mock;
    getHyperparameterByIdMock.mockResolvedValue(mockHyperparameter);
    const getSessionMock = getSession as jest.Mock;
    getSessionMock.mockResolvedValue("testuser");
    const getUserByUsernameMock = getUserByUsername as jest.Mock;
    getUserByUsernameMock.mockResolvedValue({ username: "testuser", role: "USER" });

    const Page = await HyperparameterDetailsPage(mockParams);
    render(Page);

    expect(screen.getByText("Learning Rate")).toBeInTheDocument();
    expect(screen.getByText(/0.01/i)).toBeInTheDocument();
    expect(screen.getByText("float")).toBeInTheDocument();
    expect(screen.getByText("Test Practice")).toBeInTheDocument();
    expect(screen.getByText("Test Reference")).toBeInTheDocument();
    expect(screen.queryByText("Edit hyperparameter")).not.toBeInTheDocument();
  });

  it("should render edit button for an admin user", async () => {
    const mockHyperparameter = {
        id: 1,
        name: "Learning Rate",
        value: "0.01",
        dataType: "float",
        practiceName: "Test Practice",
        referenceTitle: "Test Reference",
    };

    const getHyperparameterByIdMock = getHyperparameterById as jest.Mock;
    getHyperparameterByIdMock.mockResolvedValue(mockHyperparameter);
    const getSessionMock = getSession as jest.Mock;
    getSessionMock.mockResolvedValue("adminuser");
    const getUserByUsernameMock = getUserByUsername as jest.Mock;
    getUserByUsernameMock.mockResolvedValue({ username: "adminuser", role: "ADMIN" });

    const Page = await HyperparameterDetailsPage(mockParams);
    render(Page);

    expect(screen.getByText("Edit hyperparameter")).toBeInTheDocument();
  });

  it("should call notFound if hyperparameter is not found", async () => {
    const getHyperparameterByIdMock = getHyperparameterById as jest.Mock;
    getHyperparameterByIdMock.mockResolvedValue(null);
    const getSessionMock = getSession as jest.Mock;
    getSessionMock.mockResolvedValue(null);

    const notFoundMock = notFound as jest.Mock;
    notFoundMock.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
    });
    
    await expect(HyperparameterDetailsPage(mockParams)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("should not render practice link if practiceName is null", async () => {
    const mockHyperparameter = {
        id: 1,
        name: "Learning Rate",
        value: "0.01",
        dataType: "float",
        practiceName: null,
        referenceTitle: "Test Reference",
    };

    const getHyperparameterByIdMock = getHyperparameterById as jest.Mock;
    getHyperparameterByIdMock.mockResolvedValue(mockHyperparameter);
    const getSessionMock = getSession as jest.Mock;
    getSessionMock.mockResolvedValue(null);

    const Page = await HyperparameterDetailsPage(mockParams);
    render(Page);

    expect(screen.queryByText("Used in:")).not.toBeInTheDocument();
  });
});
