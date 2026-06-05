import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/admin/datasets/route";
import { NextRequest } from "next/server";
import { insertObjectAPI } from "@/lib/admin-actions-server";

vi.mock("@/lib/admin-actions-server", () => ({
  insertObjectAPI: vi.fn(),
}));

describe("API :: Admin :: Datasets", () => {
  it("POST should call insertObjectAPI with correct parameters", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "new dataset" }),
    });

    await POST(request);

    expect(insertObjectAPI).toHaveBeenCalledWith("dataset", request);
  });
});
