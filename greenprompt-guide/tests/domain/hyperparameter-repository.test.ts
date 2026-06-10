import { prisma } from "@/lib/prisma";
import { getHyperparameterById } from "@/domain/hyperparameter-repository";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hyperparameter: {
      findUnique: vi.fn(),
    },
  },
}));

describe("getHyperparameterById", () => {
  it("should return hyperparameter details when a valid ID is provided", async () => {
    const mockHyperparameter = {
      id: 1,
      name: "Test Hyperparameter",
      description: "Test Description",
      value: "Test Value",
      value_type: "Test Value Type",
      source: "Test Source",
    };

    const prismaMock = prisma.hyperparameter.findUnique as jest.Mock;
    prismaMock.mockResolvedValue(mockHyperparameter);

    const hyperparameter = await getHyperparameterById(1);

    expect(prisma.hyperparameter.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(hyperparameter).toEqual(mockHyperparameter);
  });

  it("should return null when an invalid ID is provided", async () => {
    const prismaMock = prisma.hyperparameter.findUnique as jest.Mock;
    prismaMock.mockResolvedValue(null);

    const hyperparameter = await getHyperparameterById(99);

    expect(prisma.hyperparameter.findUnique).toHaveBeenCalledWith({
      where: { id: 99 },
    });
    expect(hyperparameter).toBeNull();
  });
});
