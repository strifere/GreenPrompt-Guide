import { prisma } from "@/lib/prisma";
import {
  listPractices,
  getPracticeByName,
  deletePractice,
  listSidebarData,
} from "@/domain/practice-repository";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    practice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    model: {
      findMany: vi.fn(),
    },
    promptTechnique: {
      findMany: vi.fn(),
    },
    hyperparameter: {
      findMany: vi.fn(),
    },
    dataset: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("practice-repository", () => {
  describe("listPractices", () => {
    it("should return a list of practices", async () => {
      const mockPractices = [
        { id: 1, name: "Practice 1", description: "Description 1" },
      ];
      const prismaMock = prisma.practice.findMany as jest.Mock;
      prismaMock.mockResolvedValue(mockPractices);
      const practices = await listPractices();
      expect(prisma.practice.findMany).toHaveBeenCalled();
      expect(practices).toEqual(mockPractices);
    });
  });

  describe("getPracticeByName", () => {
    it("should return practice details when a valid name is provided", async () => {
      const mockPractice = {
        id: 1,
        name: "Test Practice",
        description: "Test Description",
      };
      const prismaMock = prisma.practice.findUnique as jest.Mock;
      prismaMock.mockResolvedValue(mockPractice);
      const practice = await getPracticeByName("Test Practice");
      expect(prisma.practice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: "Test Practice" },
        })
      );
      expect(practice).toEqual(mockPractice);
    });

    it("should return null when an invalid name is provided", async () => {
      const prismaMock = prisma.practice.findUnique as jest.Mock;
      prismaMock.mockResolvedValue(null);
      const practice = await getPracticeByName("Invalid Practice");
      expect(prisma.practice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: "Invalid Practice" },
        })
      );
      expect(practice).toBeNull();
    });
  });

  describe("deletePractice", () => {
    it("should call prisma.practice.delete with the correct name", async () => {
      const prismaMock = prisma.practice.delete as jest.Mock;
      prismaMock.mockResolvedValue(undefined);
      await deletePractice("Test Practice");
      expect(prisma.practice.delete).toHaveBeenCalledWith({
        where: { name: "Test Practice" },
      });
    });
  });

  describe("listSidebarData", () => {
    it("should return sidebar data", async () => {
      const mockData = [
        [{ name: "Category 1" }],
        [{ name: "Model 1" }],
        [{ name: "Prompt Technique 1" }],
        [{ name: "Hyperparameter 1" }],
        [{ name: "Dataset 1" }],
      ];
      const prismaMock = prisma.$transaction as jest.Mock;
      prismaMock.mockResolvedValue(mockData);

      const sidebarData = await listSidebarData();

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(sidebarData).toEqual({
        categories: ["Category 1"],
        models: ["Model 1"],
        promptTechniques: ["Prompt Technique 1"],
        hyperparameters: ["Hyperparameter 1"],
        datasets: ["Dataset 1"],
      });
    });
  });
});
