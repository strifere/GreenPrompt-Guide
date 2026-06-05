import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/promptTechniques/route";
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
      create: vi.fn(),
    },
    reference: {
      findMany: vi.fn(),
    },
    paperPromptTechnique: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (args) => {
        const [createResult] = await Promise.all(args);
        return [createResult];
    }),
  },
}));

describe("API :: Admin :: PromptTechniques", () => {
    let request: NextRequest;
    const techniquePayload = {
        name: 'New Technique',
        description: 'A description',
        example: 'An example',
        referenceTitles: ['ref1', 'ref2'],
    };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST", () => {
    it("should return 401 if user is not an admin", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(techniquePayload) });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 if name or description is missing", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify({ ...techniquePayload, name: '' }) });

        const response = await POST(request);
        const json = await response.json();
        
        expect(response.status).toBe(400);
        expect(json.error).toBe("Name and description are required");
    });

    it("should return 409 if prompt technique name already exists", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue({ name: 'New Technique' });
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(techniquePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(409);
        expect(json.error).toBe("A prompt technique with that name already exists");
    });

    it("should return 400 if references are not found", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue(null);
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }]);
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(techniquePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error).toBe("References not found: ref2");
    });

    it("should create the prompt technique successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue(null);
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }, { title: 'ref2' }]);
        (prisma.promptTechnique.create as vi.Mock).mockResolvedValue({ ...techniquePayload});
        
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(techniquePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(201);
        expect(json.technique.name).toBe(techniquePayload.name);
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.promptTechnique.findUnique as vi.Mock).mockResolvedValue(null);
        (prisma.reference.findMany as vi.Mock).mockResolvedValue([{ title: 'ref1' }, { title: 'ref2' }]);
        (prisma.promptTechnique.create as vi.Mock).mockRejectedValue(new Error("DB error"));

        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(techniquePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while creating the prompt technique");
    });
  });
});
