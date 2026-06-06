// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { deleteObjectAPI, updateObjectAPI, insertObjectAPI } from "@/lib/admin-actions-server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/admin-auth");
vi.mock("@/lib/prisma", () => ({
    prisma: {
        model: {
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        dataset: {
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        reference: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        hyperparameter: {
            findUnique: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
        modelReference: {
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        paperDataset: {
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(async (p) => (Array.isArray(p) ? [p[0]] : p)),
    },
}));

describe("lib/admin-actions-server", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("deleteObjectAPI", () => {
        it("should return 401 if not admin", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({
                ok: false,
                response: { status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) },
            });
            const response = await deleteObjectAPI("model", "test-model");
            expect(response.status).toBe(401);
        });

        it("should return 404 if object not found", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue(null);
            const response = await deleteObjectAPI("model", "test-model");
            expect(response.status).toBe(404);
            const body = await response.json();
            expect(body.error).toBe("model not found");
        });

        it("should delete a model successfully", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue({ name: "test-model" });
            const response = await deleteObjectAPI("model", "test-model");
            expect(prisma.model.delete).toHaveBeenCalledWith({ where: { name: "test-model" } });
            expect(response.status).toBe(200);
        });

        it("should delete a dataset successfully", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            (prisma.dataset.findUnique as vi.Mock).mockResolvedValue({ name: "test-dataset" });
            const response = await deleteObjectAPI("dataset", "test-dataset");
            expect(prisma.dataset.delete).toHaveBeenCalledWith({ where: { name: "test-dataset" } });
            expect(response.status).toBe(200);
        });

        it("should return 500 on unexpected error", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue({ name: "test-model" });
            (prisma.model.delete as vi.Mock).mockRejectedValue(new Error("DB error"));
            const response = await deleteObjectAPI("model", "test-model");
            expect(response.status).toBe(500);
        });

        it("should delete a reference successfully", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            (prisma.reference.findUnique as vi.Mock).mockResolvedValue({ title: "test-ref" });
            (prisma.reference.delete as vi.Mock).mockResolvedValue({} as any);
            const response = await deleteObjectAPI("reference", "test-ref");
            expect(prisma.reference.delete).toHaveBeenCalledWith({ where: { title: "test-ref" } });
            expect(response.status).toBe(200);
        });
    });

    describe("insertObjectAPI", () => {
        it("should insert a new model", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ name: "new-model", description: "d" }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue(null);
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);

            const response = await insertObjectAPI("model", req);
            expect(response.status).toBe(201);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("should return 409 if model exists", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ name: "existing-model" }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue({ name: "existing-model" });
            
            const response = await insertObjectAPI("model", req);
            expect(response.status).toBe(409);
        });

        it("should return 400 if name is missing", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ description: "d" }),
            });
            const response = await insertObjectAPI("model", req);
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toBe("Name is required");
        });

        it("should return 400 for invalid reference titles", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ name: "new-model", referenceTitles: ["non-existent-ref"] }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue(null);
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);
            const response = await insertObjectAPI("model", req);
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain("References not found");
        });

        it("should insert a new dataset", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "POST",
                body: JSON.stringify({ name: "new-dataset" }),
            });
            (prisma.dataset.findUnique as vi.Mock).mockResolvedValue(null);
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);
            
            const response = await insertObjectAPI("dataset", req);
            expect(response.status).toBe(201);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
    
    describe("updateObjectAPI", () => {
        it("should update a model", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
             const req = new NextRequest("http://localhost", {
                method: "PATCH",
                body: JSON.stringify({ description: "new description" }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue({ name: "test-model" });
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);

            const response = await updateObjectAPI("model", req, "test-model");
            expect(response.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("should return 404 if object to update is not found", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "PATCH",
                body: JSON.stringify({ description: "new description" }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue(null);
            const response = await updateObjectAPI("model", req, "non-existent-model");
            expect(response.status).toBe(404);
        });

        it("should handle reference update", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "PATCH",
                body: JSON.stringify({ authors: "new authors" }),
            });
            (prisma.reference.findUnique as vi.Mock).mockResolvedValue({ title: "test-ref" });
            (prisma.reference.update as vi.Mock).mockResolvedValue({ title: "test-ref", authors: "new authors" });

            const response = await updateObjectAPI("reference", req, "test-ref");
            expect(response.status).toBe(200);
            expect(prisma.reference.update).toHaveBeenCalled();
            const body = await response.json();
            expect(body.reference.authors).toBe("new authors");
        });

        it("should return 400 if reference validation fails", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "PATCH",
                body: JSON.stringify({ referenceTitles: ["missing-ref"] }),
            });
            (prisma.model.findUnique as vi.Mock).mockResolvedValue({ name: "test-model" });
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);

            const response = await updateObjectAPI("model", req, "test-model");
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain("References not found");
        });

        it("should update a dataset successfully", async () => {
            (requireAdmin as vi.Mock).mockResolvedValue({ ok: true });
            const req = new NextRequest("http://localhost", {
                method: "PATCH",
                body: JSON.stringify({ description: "new description" }),
            });
            (prisma.dataset.findUnique as vi.Mock).mockResolvedValue({ name: "test-dataset" });
            (prisma.reference.findMany as vi.Mock).mockResolvedValue([]);

            const response = await updateObjectAPI("dataset", req, "test-dataset");
            expect(response.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
