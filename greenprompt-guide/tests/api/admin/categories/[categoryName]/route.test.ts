import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "@/app/api/admin/categories/[categoryName]/route";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("API :: Admin :: Categories :: [categoryName]", () => {
  let request: NextRequest;
  const context = { params: { categoryName: "test-category" } };

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

      const response = await PATCH(request, context);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 if category is not found", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
      (prisma.category.findUnique as vi.Mock).mockResolvedValue(null);

      const response = await PATCH(request, context);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe("Category not found");
    });

    it("should return 400 for invalid tactic", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: 'test-category' });
      
        const invalidRequest = new NextRequest("http://localhost", {
            method: 'PATCH',
            body: JSON.stringify({ tactic: 'INVALID_TACTIC' }),
        });

        const response = await PATCH(invalidRequest, context);
        const json = await response.json();
      
        expect(response.status).toBe(400);
        expect(json.error).toBe("Tactic must be GREEN_PRACTICE or RED_PRACTICE");
    });

    it("should update the category successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: 'test-category' });
        (prisma.category.update as vi.Mock).mockResolvedValue({ name: 'test-category', description: 'new description', tactic: 'GREEN_PRACTICE' });

        const updateRequest = new NextRequest("http://localhost", {
            method: 'PATCH',
            body: JSON.stringify({ description: 'new description', tactic: 'GREEN_PRACTICE' }),
        });

        const response = await PATCH(updateRequest, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.category.description).toBe('new description');
        expect(json.category.tactic).toBe('GREEN_PRACTICE');
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: 'test-category' });
        (prisma.category.update as vi.Mock).mockRejectedValue(new Error("DB error"));
        
        const updateRequest = new NextRequest("http://localhost", {
            method: 'PATCH',
            body: JSON.stringify({ description: 'new description', tactic: 'GREEN_PRACTICE' }),
        });

        const response = await PATCH(updateRequest, context);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while updating the category");
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

    it("should return 404 if category is not found", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue(null);

        const response = await DELETE(request, context);
        const json = await response.json();

        expect(response.status).toBe(404);
        expect(json.error).toBe("Category not found");
    });

    it("should delete the category successfully", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: 'test-category' });
        (prisma.category.delete as vi.Mock).mockResolvedValue({});

        const response = await DELETE(request, context);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.message).toBe("Category deleted successfully");
    });

    it("should return 500 on server error", async () => {
        (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
        (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: 'test-category' });
        (prisma.category.delete as vi.Mock).mockRejectedValue(new Error("DB error"));
        
        const response = await DELETE(request, context);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toBe("An error occurred while deleting the category");
    });
  });
});
