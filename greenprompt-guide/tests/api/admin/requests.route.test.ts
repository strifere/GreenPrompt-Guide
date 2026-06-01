import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const getSessionMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());
const getCollaborationRequestDetailsByIdMock = vi.hoisted(() => vi.fn());
const deleteCollaborationRequestByIdMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
    $transaction: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
    getSession: getSessionMock,
}));

vi.mock("@/domain/user-repository", () => ({
    getUserByUsername: getUserByUsernameMock,
}));

vi.mock("@/domain/collaboration-request-repository", () => ({
    deleteCollaborationRequestById: deleteCollaborationRequestByIdMock,
    getCollaborationRequestDetailsById: getCollaborationRequestDetailsByIdMock,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: prismaMock,
}));

import { DELETE } from "@/app/api/admin/requests/[requestId]/route";

describe("DELETE /api/admin/requests/:requestId", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deletes a collaboration request for an admin user", async () => {
        getSessionMock.mockResolvedValueOnce("victor");
        getUserByUsernameMock.mockResolvedValueOnce({ username: "victor", email: "victor@example.com", role: "ADMIN" });
        getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce({ id: 7, practiceTitle: "Reduce token usage" });
        deleteCollaborationRequestByIdMock.mockResolvedValueOnce(undefined);

        const response = await DELETE(
            createJsonRequest("/api/admin/requests/7", {}, { method: "DELETE" }),
            { params: Promise.resolve({ requestId: "7" }) },
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: "Request deleted successfully" });
        expect(deleteCollaborationRequestByIdMock).toHaveBeenCalledWith(7);
    });

    it("returns 400 for invalid request ids", async () => {
        getSessionMock.mockResolvedValueOnce("victor");
        getUserByUsernameMock.mockResolvedValueOnce({ username: "victor", email: "victor@example.com", role: "ADMIN" });

        const response = await DELETE(
            createJsonRequest("/api/admin/requests/not-a-number", {}, { method: "DELETE" }),
            { params: Promise.resolve({ requestId: "not-a-number" }) },
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Invalid request id" });
        expect(getCollaborationRequestDetailsByIdMock).not.toHaveBeenCalled();
        expect(deleteCollaborationRequestByIdMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the request does not exist", async () => {
        getSessionMock.mockResolvedValueOnce("victor");
        getUserByUsernameMock.mockResolvedValueOnce({ username: "victor", email: "victor@example.com", role: "ADMIN" });
        getCollaborationRequestDetailsByIdMock.mockResolvedValueOnce(null);

        const response = await DELETE(
            createJsonRequest("/api/admin/requests/404", {}, { method: "DELETE" }),
            { params: Promise.resolve({ requestId: "404" }) },
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Request not found" });
        expect(deleteCollaborationRequestByIdMock).not.toHaveBeenCalled();
    });
});
