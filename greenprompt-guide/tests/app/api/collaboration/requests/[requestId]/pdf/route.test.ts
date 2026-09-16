// @vitest-environment node
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GET } from "@/app/api/collaboration/requests/[requestId]/pdf/route";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { getCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";
import { readCollaborationRequestFile } from "@/lib/collaboration-request-fs";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");
vi.mock("@/domain/collaboration-request-repository");
vi.mock("@/lib/collaboration-request-storage");
vi.mock("@/lib/collaboration-request-fs");

type CollaborationPdfRouteContext = {
	params: Promise<{ requestId: string }>;
};

describe("API :: Collaboration :: Requests :: [requestId] :: PDF", () => {
    let request: NextRequest;
    const context : CollaborationPdfRouteContext = { params: Promise.resolve({ requestId: "1" }) };
    const user = { username: "testuser", role: "USER" };
    const collaborationRequest = {
        id: 1,
        requesterUsername: "testuser",
        supportingPdfPath: "path/to/file.pdf",
        supportingPdfName: "file.pdf",
        supportingPdfMimeType: "application/pdf",
        supportingPdfSizeBytes: 12345,
    };

    beforeEach(() => {
        vi.resetAllMocks();
        request = new NextRequest("http://localhost");
    });

    it("should return 401 if not authenticated", async () => {
        (getSession as Mock).mockResolvedValue(null);
        const response = await GET(request, context);
        expect(response.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(null);
        const response = await GET(request, context);
        expect(response.status).toBe(404);
    });

    it("should return 400 for invalid request ID", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        const invalidContext : CollaborationPdfRouteContext = { params: Promise.resolve({ requestId: "abc" }) };
        const response = await GET(request, invalidContext);
        expect(response.status).toBe(400);
    });

    it("should return 404 if request not found", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestById as Mock).mockResolvedValue(null);
        const response = await GET(request, context);
        expect(response.status).toBe(404);
    });

    it("should return 403 if forbidden", async () => {
        (getSession as Mock).mockResolvedValue("otheruser");
        (getUserByUsername as Mock).mockResolvedValue({ username: "otheruser", role: "USER" });
        (getCollaborationRequestById as Mock).mockResolvedValue(collaborationRequest);
        const response = await GET(request, context);
        expect(response.status).toBe(403);
    });

    it("should return 404 if PDF not found on filesystem", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestById as Mock).mockResolvedValue(collaborationRequest);
        (getCollaborationPdfStoragePath as Mock).mockReturnValue("/abs/path/to/file.pdf");
        const enoentError = new Error("File not found");
        (enoentError as any).code = "ENOENT";
        (readCollaborationRequestFile as Mock).mockRejectedValue(enoentError);
        
        const response = await GET(request, context);
        expect(response.status).toBe(404);
    });

    it("should successfully return PDF", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestById as Mock).mockResolvedValue(collaborationRequest);
        (getCollaborationPdfStoragePath as Mock).mockReturnValue("/abs/path/to/file.pdf");
        (readCollaborationRequestFile as Mock).mockResolvedValue(Buffer.from("pdf content"));

        const response = await GET(request, context);
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("application/pdf");
        expect(response.headers.get("Content-Disposition")).toContain("file.pdf");
    });
    
    it("should return 500 on other filesystem error", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestById as Mock).mockResolvedValue(collaborationRequest);
        (getCollaborationPdfStoragePath as Mock).mockReturnValue("/abs/path/to/file.pdf");
        (readCollaborationRequestFile as Mock).mockRejectedValue(new Error("FS error"));

        const response = await GET(request, context);
        expect(response.status).toBe(500);
    });
});