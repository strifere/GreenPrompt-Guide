import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const requireAdminMock = vi.hoisted(() => vi.fn());
const getPracticeByNameMock = vi.hoisted(() => vi.fn());
const deletePracticeMock = vi.hoisted(() => vi.fn());
const normalizeAdminPracticeUpdatePayloadMock = vi.hoisted(() => vi.fn());
const updateAdminPracticeMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/domain/practice-repository", () => ({
  getPracticeByName: getPracticeByNameMock,
  deletePractice: deletePracticeMock,
}));

vi.mock("@/lib/admin-practice-creation", () => ({
  normalizeAdminPracticeUpdatePayload: normalizeAdminPracticeUpdatePayloadMock,
  updateAdminPractice: updateAdminPracticeMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { DELETE, PATCH } from "@/app/api/admin/practices/[practiceName]/route";

describe("DELETE /api/admin/practices/:practiceName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation((callback) => callback("tx"));
  });

  it("deletes a practice for an admin user", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getPracticeByNameMock.mockResolvedValueOnce({ name: "Constraint-first prompting" });
    deletePracticeMock.mockResolvedValueOnce(undefined);

    const response = await DELETE(
      createJsonRequest("/api/admin/practices/Constraint-first%20prompting", {}),
      { params: { practiceName: "Constraint-first prompting" } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Practice deleted successfully" });
    expect(deletePracticeMock).toHaveBeenCalledWith("Constraint-first prompting");
  });

  it("returns 404 when the practice does not exist", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getPracticeByNameMock.mockResolvedValueOnce(null);

    const response = await DELETE(
      createJsonRequest("/api/admin/practices/missing", {}),
      { params: { practiceName: "missing" } },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Practice not found" });
    expect(deletePracticeMock).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/practices/:practiceName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation((callback) => callback("tx"));
  });

  it("updates a practice for an admin user", async () => {
    const normalizedPayload = {
      practice: {
        name: "Constraint-first prompting",
        description: "Updated description",
        greenScore: 90,
        tactic: "GREEN_PRACTICE",
      },
      categoryNames: ["Evaluation"],
      promptTechniqueNames: ["Few-shot"],
      modelNames: ["GPT-4o mini"],
      referenceTitles: ["Example reference"],
      hyperparameterIds: [1, 2],
      examples: [
        {
          scenario: "Summarization",
          originalPrompts: "Summarize this.",
          improvedPrompts: "Summarize in 5 bullets.",
          observations: "Lower token usage.",
        },
      ],
      metrics: [
        {
          subtype: "ENERGY",
          title: "Energy reduction",
          value: "-20%",
          description: null,
          confidence: 0.8,
          energy: {
            type: "REDUCTION",
            minValue: 10,
            maxValue: 25,
            bestGuessValue: 20,
            unit: "PERCENTAGE",
          },
          accuracy: null,
        },
      ],
    };

    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    normalizeAdminPracticeUpdatePayloadMock.mockReturnValueOnce({ value: normalizedPayload });
    updateAdminPracticeMock.mockResolvedValueOnce({ name: "Constraint-first prompting" });

    const response = await PATCH(
      createJsonRequest("/api/admin/practices/Constraint-first%20prompting", {
        practice: { name: "Constraint-first prompting" },
      }, { method: "PATCH" }),
      { params: { practiceName: "Constraint-first%20prompting" } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ practice: { name: "Constraint-first prompting" } });
    expect(updateAdminPracticeMock).toHaveBeenCalledWith("tx", "Constraint-first prompting", normalizedPayload);
  });

  it("returns validation errors before updating a practice", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    normalizeAdminPracticeUpdatePayloadMock.mockReturnValueOnce({ error: "At least one category is required" });

    const response = await PATCH(
      createJsonRequest("/api/admin/practices/example", {}, { method: "PATCH" }),
      { params: { practiceName: "example" } },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "At least one category is required" });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("requires an admin user before updating a practice", async () => {
    const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
    requireAdminMock.mockResolvedValueOnce({ ok: false, response: authResponse });

    const response = await PATCH(
      createJsonRequest("/api/admin/practices/example", {}, { method: "PATCH" }),
      { params: { practiceName: "example" } },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(normalizeAdminPracticeUpdatePayloadMock).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the practice does not exist", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    normalizeAdminPracticeUpdatePayloadMock.mockReturnValueOnce({ value: { practice: { name: "missing" } } });
    updateAdminPracticeMock.mockRejectedValueOnce(new Error("PRACTICE_NOT_FOUND"));

    const response = await PATCH(
      createJsonRequest("/api/admin/practices/missing", {}, { method: "PATCH" }),
      { params: { practiceName: "missing" } },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Practice not found" });
  });

  it("returns 409 when a renamed title already exists", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    normalizeAdminPracticeUpdatePayloadMock.mockReturnValueOnce({ value: { practice: { name: "Duplicate" } } });
    updateAdminPracticeMock.mockRejectedValueOnce(new Error("PRACTICE_NAME_EXISTS"));

    const response = await PATCH(
      createJsonRequest("/api/admin/practices/example", {}, { method: "PATCH" }),
      { params: { practiceName: "example" } },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "A practice with that title already exists" });
  });
});
