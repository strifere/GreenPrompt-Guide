import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/references/route";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reference: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("API :: Admin :: References", () => {
    let request: NextRequest;
    const referencePayload = {
        title: "New Reference",
        authors: "John Doe",
        year: 2024,
        studyType: "CASE_STUDY",
        abstract: "An abstract",
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
      request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(referencePayload) });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 if required fields are missing", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify({ ...referencePayload, title: '' }) });

        const response = await POST(request);
        const json = await response.json();
        
        expect(response.status).toBe(400);
        expect(json.error).toBe("Title, authors, year, and study type are required");
    });

    it("should return 409 if reference title already exists", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.reference.findUnique as vi.Mock).mockResolvedValue({ title: 'New Reference' });
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(referencePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(409);
        expect(json.error).toBe("A reference with that title already exists");
    });

    it("should create the reference successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.reference.findUnique as vi.Mock).mockResolvedValue(null);
        (prisma.reference.create as vi.Mock).mockResolvedValue({ ...referencePayload });
        
        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(referencePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(201);
        expect(json.reference.title).toBe(referencePayload.title);
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.reference.findUnique as vi.Mock).mockResolvedValue(null);
        (prisma.reference.create as vi.Mock).mockRejectedValue(new Error("DB error"));

        request = new NextRequest("http://localhost", { method: 'POST', body: JSON.stringify(referencePayload) });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while creating the reference");
    });
  });
});
