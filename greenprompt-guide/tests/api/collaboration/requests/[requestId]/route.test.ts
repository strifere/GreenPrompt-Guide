import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/collaboration/requests/[requestId]/route";

const getSessionMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());
const getCollaborationRequestDetailsByIdMock = vi.hoisted(() => vi.fn());
const updateCollaborationRequestByIdMock = vi.hoisted(() => vi.fn());
const updateCollaborationRequestStatusByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
	getSession: getSessionMock,
}));

vi.mock("@/domain/user-repository", () => ({
	getUserByUsername: getUserByUsernameMock,
}));

vi.mock("@/domain/collaboration-request-repository", () => ({
	getCollaborationRequestDetailsById: getCollaborationRequestDetailsByIdMock,
	updateCollaborationRequestById: updateCollaborationRequestByIdMock,
	updateCollaborationRequestStatusById: updateCollaborationRequestStatusByIdMock,
}));

describe("PATCH /api/collaboration/requests/[requestId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue("victor");
		getUserByUsernameMock.mockResolvedValue({ username: "victor", email: "victor@example.com", role: "ADMIN" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ requesterUsername: "ana" });
	});

	it("approves a request for admin users", async () => {
		updateCollaborationRequestStatusByIdMock.mockResolvedValue({ id: 1, status: "APPROVED" });

		const response = await PATCH(
			new NextRequest("http://localhost/api/collaboration/requests/1", {
				method: "PATCH",
				body: JSON.stringify({ status: "APPROVED" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ request: { id: 1, status: "APPROVED" } });
		expect(updateCollaborationRequestStatusByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				status: "APPROVED",
				reviewerUsername: "victor",
			}),
		);
		expect(updateCollaborationRequestByIdMock).not.toHaveBeenCalled();
	});

	it("denies a request with a rejection reason for admin users", async () => {
		updateCollaborationRequestStatusByIdMock.mockResolvedValue({ id: 1, status: "DENIED", rejectionReason: "Not enough detail" });

		const response = await PATCH(
			new NextRequest("http://localhost/api/collaboration/requests/1", {
				method: "PATCH",
				body: JSON.stringify({ status: "DENIED", rejectionReason: "Not enough detail" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ request: { id: 1, status: "DENIED", rejectionReason: "Not enough detail" } });
		expect(updateCollaborationRequestStatusByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				status: "DENIED",
				reviewerUsername: "victor",
				rejectionReason: "Not enough detail",
			}),
		);
	});

	it("reopens a denied request back to pending for admin users", async () => {
		updateCollaborationRequestStatusByIdMock.mockResolvedValue({ id: 1, status: "PENDING", rejectionReason: null });

		const response = await PATCH(
			new NextRequest("http://localhost/api/collaboration/requests/1", {
				method: "PATCH",
				body: JSON.stringify({ status: "PENDING" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ request: { id: 1, status: "PENDING", rejectionReason: null } });
		expect(updateCollaborationRequestStatusByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				status: "PENDING",
				reviewerUsername: "victor",
				rejectionReason: null,
			}),
		);
	});

	it("updates requester fields for non-admin users", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", email: "victor@example.com", role: "USER" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ requesterUsername: "victor" });
		updateCollaborationRequestByIdMock.mockResolvedValue({ id: 1, practiceTitle: "Updated title", referenceLink: "https://example.com/paper" });

		const response = await PATCH(
			new NextRequest("http://localhost/api/collaboration/requests/1", {
				method: "PATCH",
				body: JSON.stringify({ practiceTitle: "Updated title", referenceLink: "https://example.com/paper" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ request: { id: 1, practiceTitle: "Updated title", referenceLink: "https://example.com/paper" } });
		expect(updateCollaborationRequestByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				practiceTitle: "Updated title",
				referenceLink: "https://example.com/paper",
			}),
		);
		expect(updateCollaborationRequestStatusByIdMock).not.toHaveBeenCalled();
	});

	it("rejects admin-only status updates from requester users", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", email: "victor@example.com", role: "USER" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ requesterUsername: "victor" });

		const response = await PATCH(
			new NextRequest("http://localhost/api/collaboration/requests/1", {
				method: "PATCH",
				body: JSON.stringify({ status: "APPROVED" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "Forbidden" });
		expect(updateCollaborationRequestByIdMock).not.toHaveBeenCalled();
		expect(updateCollaborationRequestStatusByIdMock).not.toHaveBeenCalled();
	});
});
