import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/categories/route";
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
      create: vi.fn(),
    },
  },
}));

describe("API :: Admin :: Categories", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST", () => {
    it("should return 401 if user is not an admin", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "New Category", tactic: "GREEN_PRACTICE" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 400 if name is missing", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ tactic: "GREEN_PRACTICE" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Name is required");
    });

    it("should return 400 for invalid tactic", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "New Category", tactic: "INVALID_TACTIC" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("Tactic must be GREEN_PRACTICE or RED_PRACTICE");
    });

    it("should return 409 if category name already exists", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
      (prisma.category.findUnique as vi.Mock).mockResolvedValue({ name: "Existing Category" });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "Existing Category", tactic: "GREEN_PRACTICE" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe("A category with that name already exists");
    });

    it("should create the category successfully", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
      (prisma.category.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.category.create as vi.Mock).mockResolvedValue({
        name: "New Category",
        description: "A description",
        tactic: "GREEN_PRACTICE",
      });

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "New Category", description: "A description", tactic: "GREEN_PRACTICE" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.category.name).toBe("New Category");
    });

    it("should return 500 on server error", async () => {
      (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
      (prisma.category.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.category.create as vi.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "New Category", tactic: "GREEN_PRACTICE" }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("An error occurred while creating the category");
    });
  });
});
