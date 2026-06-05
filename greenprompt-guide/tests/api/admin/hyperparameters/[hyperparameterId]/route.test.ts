import { describe, it, expect, vi } from "vitest";
import { PATCH, DELETE } from "@/app/api/admin/hyperparameters/[hyperparameterId]/route";
import { NextRequest } from "next/server";
import { updateObjectAPI, deleteObjectAPI } from "@/lib/admin-actions-server";

vi.mock("@/lib/admin-actions-server", () => ({
  updateObjectAPI: vi.fn(),
  deleteObjectAPI: vi.fn(),
}));

describe("API :: Admin :: Hyperparameters :: [hyperparameterId]", () => {
  const context = { params: { hyperparameterId: "123" } };

  it("PATCH should call updateObjectAPI with correct parameters", async () => {
    const request = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ description: "new description" }),
    });

    await PATCH(request, context);

    expect(updateObjectAPI).toHaveBeenCalledWith(
      "hyperparameter",
      request,
      "123"
    );
  });

  it("DELETE should call deleteObjectAPI with correct parameters", async () => {
    const request = new NextRequest("http://localhost");
    await DELETE(request, context);

    expect(deleteObjectAPI).toHaveBeenCalledWith("hyperparameter", "123");
  });
});
