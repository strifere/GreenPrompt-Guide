// @vitest-environment node
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { POST } from "@/app/api/collaboration/requests/[requestId]/messages/[messageId]/read/route";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { getCollaborationRequestDetailsById, markCollaborationRequestMessageAsRead } from "@/domain/collaboration-request-repository";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");
vi.mock("@/domain/collaboration-request-repository");

type ReadMessageRouteContext = {
	params: Promise<{ requestId: string; messageId: string }>;
};

describe("API :: Collaboration :: Requests :: [requestId] :: Messages :: [messageId] :: Read", () => {
    let request: NextRequest;
    const context : ReadMessageRouteContext = { params: Promise.resolve({ requestId: "1", messageId: "1" }) };
    const user = { username: "testuser", role: "USER" };
    const admin = { username: "adminuser", role: "ADMIN" };
    const collaborationRequest = {
        id: 1,
        requesterUsername: "testuser",
        messages: [
            { id: 1, requestId: 1, authorRole: "ADMIN", readAt: null },
            { id: 2, requestId: 1, authorRole: "USER", readAt: null },
        ],
    };

    beforeEach(() => {
        vi.resetAllMocks();
        request = new NextRequest("http://localhost");
    });

    it("should return 401 if not authenticated", async () => {
        (getSession as Mock).mockResolvedValue(null);
        const response = await POST(request, context);
        expect(response.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(null);
        const response = await POST(request, context);
        expect(response.status).toBe(404);
    });

    it("should return 400 for invalid IDs", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        const invalidContext = { params: Promise.resolve({ requestId: "abc", messageId: "1" }) };
        const response = await POST(request, invalidContext);
        expect(response.status).toBe(400);
    });

    it("should return 404 if request not found", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(null);
        const response = await POST(request, context);
        expect(response.status).toBe(404);
    });

    it("should return 403 if forbidden", async () => {
        (getSession as Mock).mockResolvedValue("otheruser");
        (getUserByUsername as Mock).mockResolvedValue({ username: "otheruser", role: "USER" });
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(collaborationRequest);
        const response = await POST(request, context);
        expect(response.status).toBe(403);
    });

    it("should return 404 if message not found", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(collaborationRequest);
        const invalidMsgContext = { params: Promise.resolve({ requestId: "1", messageId: "99" }) };
        const response = await POST(request, invalidMsgContext);
        expect(response.status).toBe(404);
    });

    it("should return 403 if not the requester", async () => {
        (getSession as Mock).mockResolvedValue("adminuser");
        (getUserByUsername as Mock).mockResolvedValue(admin);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(collaborationRequest);
        const response = await POST(request, context);
        expect(response.status).toBe(403);
    });

    it("should return 400 for non-admin messages", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(collaborationRequest);
        const userMsgContext = { params: Promise.resolve({ requestId: "1", messageId: "2" }) };
        const response = await POST(request, userMsgContext);
        expect(response.status).toBe(400);
    });

    it("should successfully mark message as read", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(collaborationRequest);
        (markCollaborationRequestMessageAsRead as Mock).mockResolvedValue({});
        
        const response = await POST(request, context);
        expect(response.status).toBe(200);
        expect(markCollaborationRequestMessageAsRead).toHaveBeenCalledWith(1);
    });

    it("should not mark already read message again", async () => {
        const alreadyReadRequest = { ...collaborationRequest, messages: [{...collaborationRequest.messages[0], readAt: new Date() }]};
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockResolvedValue(alreadyReadRequest);
        
        const response = await POST(request, context);
        expect(response.status).toBe(200);
        expect(markCollaborationRequestMessageAsRead).not.toHaveBeenCalled();
    });

    it("should return 500 on error", async () => {
        (getSession as Mock).mockResolvedValue("testuser");
        (getUserByUsername as Mock).mockResolvedValue(user);
        (getCollaborationRequestDetailsById as Mock).mockRejectedValue(new Error("DB error"));
        const response = await POST(request, context);
        expect(response.status).toBe(500);
    });
});
