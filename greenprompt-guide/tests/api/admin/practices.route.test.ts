import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const requireAdminMock = vi.hoisted(() => vi.fn());
const getPracticeByNameMock = vi.hoisted(() => vi.fn());
const deletePracticeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/domain/practice-repository", () => ({
  getPracticeByName: getPracticeByNameMock,
  deletePractice: deletePracticeMock,
}));

import { DELETE } from "@/app/api/admin/practices/[practiceName]/route";

describe("DELETE /api/admin/practices/:practiceName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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