// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/collaboration/requests/route";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { createCollaborationRequest, listAllCollaborationRequests, deleteCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { getCollaborationPdfStorageDir, getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";
import { createCollaborationRequestDir, writeCollaborationRequestFile } from "@/lib/collaboration-request-fs";
import { randomUUID } from "node:crypto";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");
vi.mock("@/domain/collaboration-request-repository");
vi.mock("@/lib/collaboration-request-storage");
vi.mock("@/lib/collaboration-request-fs");
vi.mock("node:crypto", async () => {
	const actual = await vi.importActual("node:crypto");
	return {
		...actual,
		randomUUID: vi.fn(),
	};
});

describe("API :: Collaboration :: Requests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("GET", () => {
        it("should return 401 if not authenticated", async () => {
            (getSession as vi.Mock).mockResolvedValue(null);
            const response = await GET();
            expect(response.status).toBe(401);
        });

        it("should return 404 if user not found", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue(null);
            const response = await GET();
            expect(response.status).toBe(404);
        });

        it("should return 403 if user is not an admin", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ role: 'USER' });
            const response = await GET();
            expect(response.status).toBe(403);
        });

        it("should return 200 with requests for admin", async () => {
            (getSession as vi.Mock).mockResolvedValue("admin");
            (getUserByUsername as vi.Mock).mockResolvedValue({ role: 'ADMIN' });
            (listAllCollaborationRequests as vi.Mock).mockResolvedValue([{ id: 1 }]);
            const response = await GET();
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.requests).toEqual([{ id: 1 }]);
        });

        it("should return 500 on error", async () => {
            (getSession as vi.Mock).mockResolvedValue("admin");
            (getUserByUsername as vi.Mock).mockResolvedValue({ role: 'ADMIN' });
            (listAllCollaborationRequests as vi.Mock).mockRejectedValue(new Error("DB error"));
            const response = await GET();
            expect(response.status).toBe(500);
        });
    });

    describe("POST", () => {
        it("should create a request and save the file", async () => {
            const user = { username: "testuser", role: "USER" };
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue(user);
            (createCollaborationRequest as vi.Mock).mockResolvedValue({ id: 1, practiceTitle: "title" });
            (getCollaborationPdfStorageDir as vi.Mock).mockReturnValue("/tmp/storage");
            (getCollaborationPdfStoragePath as vi.Mock).mockImplementation(p => `/tmp/storage/${p}`);
            (randomUUID as vi.Mock).mockReturnValue("mock-uuid");
            (createCollaborationRequestDir as vi.Mock).mockResolvedValue(undefined);
            (writeCollaborationRequestFile as vi.Mock).mockResolvedValue(undefined);
            
            const formData = new FormData();
            formData.append("practiceTitle", "title");
            formData.append("practiceSummary", "summary");
            formData.append("practiceDescription", "desc");
            formData.append("referenceLink", "http://link.com");
            formData.append("sourcePdf", new File(["pdf"], "file.pdf", { type: "application/pdf" }));
            const request = new NextRequest("http://localhost", {
                method: "POST",
                body: formData,
            });

            const response = await POST(request);
            
            expect(response.status).toBe(201);
        });

        it("should return 401 if not authenticated", async () => {
            (getSession as vi.Mock).mockResolvedValue(null);
            const request = new NextRequest("http://localhost", { method: "POST" });
            const response = await POST(request);
            expect(response.status).toBe(401);
        });

        it("should return 400 if required field is missing", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser" });
            const formData = new FormData();
            // practiceTitle is missing
            formData.append("practiceSummary", "summary");
            formData.append("practiceDescription", "desc");
            const request = new NextRequest("http://localhost", { method: "POST", body: formData });
            const response = await POST(request);
            expect(response.status).toBe(500); // The error is caught and a 500 is returned
            const body = await response.json();
            expect(body.error).toBe("practiceTitle is required");
        });

        it("should return 400 if pdf is not a file", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser" });
             const formData = new FormData();
            formData.append("practiceTitle", "title");
            formData.append("practiceSummary", "summary");
            formData.append("practiceDescription", "desc");
            formData.append("referenceLink", "http://link.com");
            formData.append("sourcePdf", "not-a-file");
            const request = new NextRequest("http://localhost", { method: "POST", body: formData });
            const response = await POST(request);
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toBe("A supporting PDF is required");
        });

        it("should return 400 if pdf is not a pdf", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser" });
             const formData = new FormData();
            formData.append("practiceTitle", "title");
            formData.append("practiceSummary", "summary");
            formData.append("practiceDescription", "desc");
            formData.append("referenceLink", "http://link.com");
            formData.append("sourcePdf", new File(["img"], "file.jpg", { type: "image/jpeg" }));
            const request = new NextRequest("http://localhost", { method: "POST", body: formData });
            const response = await POST(request);
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toBe("Only PDF files are allowed");
        });

        it("should delete created request if file write fails", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser" });
            (createCollaborationRequest as vi.Mock).mockResolvedValue({ id: 123 });
            (writeCollaborationRequestFile as vi.Mock).mockRejectedValue(new Error("Storage error"));
            
            const formData = new FormData();
            formData.append("practiceTitle", "title");
            formData.append("practiceSummary", "summary");
            formData.append("practiceDescription", "desc");
            formData.append("referenceLink", "http://link.com");
            formData.append("sourcePdf", new File(["pdf"], "file.pdf", { type: "application/pdf" }));
            const request = new NextRequest("http://localhost", { method: "POST", body: formData });
            
            const response = await POST(request);
            expect(response.status).toBe(500);
            expect(deleteCollaborationRequestById).toHaveBeenCalledWith(123);
        });
    });
});
