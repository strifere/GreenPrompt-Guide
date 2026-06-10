import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "@/app/api/admin/promptTechniques/[promptTechniqueName]/route";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptTechnique: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    reference: {
      findMany: vi.fn(),
    },
    paperPromptTechnique: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (args) => {
        // Mock the transaction function to return the result of the first operation
        const [updateResult] = await Promise.all(args);
        return [updateResult];
    }),
  },
}));

describe("API :: Admin :: PromptTechniques :: [promptTechniqueName]", () => {
    let request: NextRequest;
    const context = { params: { promptTechniqueName: "test-technique" } };
    const techniquePayload = {
        description: 'Updated description',
        example: 'Updated example',
        referenceTitles: ['ref1', 'ref2'],
    };

  beforeEach(() => {
    vi.resetAllMocks();
    request = new NextRequest("http://localhost");
  });

  describe("PATCH", () => {
    it("should return 401 if user is not an admin", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify(techniquePayload) });
      const response = await PATCH(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 if prompt technique is not found", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue(null);
        request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify(techniquePayload) });

        const response = await PATCH(request, context);
        const json = await response.json();

        expect(response.status).toBe(404);
        expect(json.error).toBe("Prompt technique not found");
    });

    it("should return 400 if description is missing", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify({ ...techniquePayload, description: '' }) });

        const response = await PATCH(request, context);
        const json = await response.json();
        
        expect(response.status).toBe(400);
        expect(json.error).toBe("Description is required");
    });

    it("should return 400 if references are not found", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }]);
        request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify(techniquePayload) });

        const response = await PATCH(request, context);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error).toBe("References not found: ref2");
    });

    it("should update the prompt technique successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }, { title: 'ref2' }]);
        (prisma.promptTechnique.update as vi.Mock).mockResolvedValue({ name: 'test-technique', ...techniquePayload});
        
        request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify(techniquePayload) });

        const response = await PATCH(request, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.technique.description).toBe(techniquePayload.description);
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }, { title: 'ref2' }]);
        (prisma.promptTechnique.update as vi.Mock).mockRejectedValue(new Error("DB error"));

        request = new NextRequest("http://localhost", { method: 'PATCH', body: JSON.stringify(techniquePayload) });

        const response = await PATCH(request, context);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while updating the prompt technique");
    });
  });

  describe("DELETE", () => {
    it("should return 401 if user is not an admin", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({
            ok: false,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        });
        const response = await DELETE(request, context);
        const json = await response.json();
        expect(response.status).toBe(401);
        expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 if prompt technique is not found", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue(null);
        const response = await DELETE(request, context);
        const json = await response.json();
        expect(response.status).toBe(404);
        expect(json.error).toBe("Prompt technique not found");
    });

    it("should delete the prompt technique successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        (prisma.promptTechnique.delete as vi.Mock).mockResolvedValue({});
        const response = await DELETE(request, context);
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.message).toBe("Prompt technique deleted successfully");
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'test-technique' });
        (prisma.promptTechnique.delete as vi.Mock).mockRejectedValue(new Error("DB error"));
        const response = await DELETE(request, context);
        const json = await response.json();
        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while deleting the prompt technique");
    });
  });
});
