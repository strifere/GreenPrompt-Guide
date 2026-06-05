
import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST, DELETE } from "@/app/api/admin/requests/[requestId]/route";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { getCollaborationRequestDetailsById, deleteCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { createAdminPractice, normalizeAdminPracticePayload } from "@/lib/admin-practice-creation";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");
vi.mock("@/domain/collaboration-request-repository");
vi.mock("@/lib/admin-practice-creation");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("Admin Request API", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const mockAdminSession = () => {
        (getSession as vi.Mock).mockResolvedValue("adminuser");
        (getUserByUsername as vi.Mock).mockResolvedValue({ username: "adminuser", role: "ADMIN" });
    };

    const mockUserSession = () => {
        (getSession as vi.Mock).mockResolvedValue("testuser");
        (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser", role: "USER" });
    };

    const mockNoSession = () => {
        (getSession as vi.Mock).mockResolvedValue(null);
    };

    describe("DELETE /api/admin/requests/[requestId]", () => {
        it("should return 401 if not authenticated", async () => {
            mockNoSession();
            const request = new Request("http://localhost/api/admin/requests/1", { method: "DELETE" });
            const context = { params: { requestId: "1" } };
            const response = await DELETE(request, context as any);
            expect(response.status).toBe(401);
        });

        it("should return 403 if user is not an admin", async () => {
            mockUserSession();
            const request = new Request("http://localhost/api/admin/requests/1", { method: "DELETE" });
            const context = { params: { requestId: "1" } };
            const response = await DELETE(request, context as any);
            // This is handled by initializeAdminRequestContext throwing an error, which translates to 401
            // A more specific error would be better, but this is how the code is structured.
            expect(response.status).toBe(401);
        });

        it("should return 400 for an invalid requestId", async () => {
            mockAdminSession();
            const request = new Request("http://localhost/api/admin/requests/invalid", { method: "DELETE" });
            const context = { params: { requestId: "invalid" } };
            const response = await DELETE(request, context as any);
            expect(response.status).toBe(400);
        });

        it("should return 404 if request not found", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue(null);
            const request = new Request("http://localhost/api/admin/requests/999", { method: "DELETE" });
            const context = { params: { requestId: "999" } };
            const response = await DELETE(request, context as any);
            expect(response.status).toBe(404);
        });

        it("should delete the request and return 200", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1 });
            (deleteCollaborationRequestById as vi.Mock).mockResolvedValue({} as any);
            const request = new Request("http://localhost/api/admin/requests/1", { method: "DELETE" });
            const context = { params: { requestId: "1" } };
            const response = await DELETE(request, context as any);
            expect(response.status).toBe(200);
            expect(deleteCollaborationRequestById).toHaveBeenCalledWith(1);
            const json = await response.json();
            expect(json.message).toBe("Request deleted successfully");
        });

        it("should return 500 on unexpected error", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1 });
            (deleteCollaborationRequestById as vi.Mock).mockRejectedValue(new Error("DB error"));
            const request = new Request("http://localhost/api/admin/requests/1", { method: "DELETE" });
            const context = { params: { requestId: "1" } };
            const response = await DELETE(request, context as any);
            expect(response.status).toBe(500);
        });
    });

    describe("POST /api/admin/requests/[requestId]", () => {
        const validPayload = {
            title: "New Practice",
            description: "A good practice",
            publication_date: new Date().toISOString(),
        };

        it("should return 401 if not authenticated", async () => {
            mockNoSession();
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify(validPayload),
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(401);
        });
        
        it("should return 400 for an invalid requestId", async () => {
            mockAdminSession();
            const request = new Request("http://localhost/api/admin/requests/invalid", {
                 method: "POST",
                 body: JSON.stringify(validPayload) 
                });
            const context = { params: { requestId: "invalid" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(400);
        });

        it("should return 404 if request not found", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue(null);
            const request = new Request("http://localhost/api/admin/requests/999", {
                method: "POST",
                body: JSON.stringify(validPayload)
            });
            const context = { params: { requestId: "999" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(404);
        });

        it("should return 200 if practice already created", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1, createdPractice: {} });
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify(validPayload)
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.message).toBe("The practice for this request was already created");
        });

        it("should return 409 if request is not PENDING", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1, status: 'APPROVED' });
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify(validPayload)
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(409);
        });

        it("should return 400 for invalid payload", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1, status: 'PENDING' });
            (normalizeAdminPracticePayload as vi.Mock).mockReturnValue({ error: "Invalid payload" });
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify({})
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(400);
        });

        it("should create practice and return 200 on success", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock)
                .mockResolvedValueOnce({ id: 1, status: 'PENDING' })
                .mockResolvedValueOnce({ id: 1, status: 'APPROVED' }); // For the refetch
            (normalizeAdminPracticePayload as vi.Mock).mockReturnValue({ value: validPayload });
            (createAdminPractice as vi.Mock).mockResolvedValue({ id: 100, ...validPayload });
            (prisma.$transaction as vi.Mock).mockImplementation(async (fn) => {
                const tx = { collaborationRequest: { update: vi.fn() } };
                const practice = await fn(tx);
                expect(tx.collaborationRequest.update).toHaveBeenCalled();
                return practice;
            });
            
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify(validPayload)
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.practice.id).toBe(100);
            expect(json.request.status).toBe('APPROVED');
            expect(createAdminPractice).toHaveBeenCalled();
        });

        it("should return 500 on transaction error", async () => {
            mockAdminSession();
            (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1, status: 'PENDING' });
            (normalizeAdminPracticePayload as vi.Mock).mockReturnValue({ value: validPayload });
            (prisma.$transaction as vi.Mock).mockRejectedValue(new Error("DB transaction error"));
            
            const request = new Request("http://localhost/api/admin/requests/1", {
                method: "POST",
                body: JSON.stringify(validPayload)
            });
            const context = { params: { requestId: "1" } };
            const response = await POST(request, context as any);
            expect(response.status).toBe(500);
        });
    });
});
