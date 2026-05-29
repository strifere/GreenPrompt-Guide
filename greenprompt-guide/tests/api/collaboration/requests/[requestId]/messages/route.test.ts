import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/collaboration/requests/[requestId]/messages/route";

const getSessionMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());
const getCollaborationRequestDetailsByIdMock = vi.hoisted(() => vi.fn());
const createCollaborationRequestMessageMock = vi.hoisted(() => vi.fn());
const updateCollaborationRequestStatusByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
	getSession: getSessionMock,
}));

vi.mock("@/domain/user-repository", () => ({
	getUserByUsername: getUserByUsernameMock,
}));

vi.mock("@/domain/collaboration-request-repository", () => ({
	getCollaborationRequestDetailsById: getCollaborationRequestDetailsByIdMock,
	createCollaborationRequestMessage: createCollaborationRequestMessageMock,
	updateCollaborationRequestStatusById: updateCollaborationRequestStatusByIdMock,
}));

describe("POST /api/collaboration/requests/[requestId]/messages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue("victor");
		createCollaborationRequestMessageMock.mockResolvedValue({ id: 11 });
	});

	it("creates NOTE for admin bottom message without changing status", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", role: "ADMIN", email: "victor@example.com" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ id: 1, status: "PENDING", requesterUsername: "ana" });

		const response = await POST(
			new NextRequest("http://localhost/api/collaboration/requests/1/messages", {
				method: "POST",
				body: JSON.stringify({ message: "General note" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(createCollaborationRequestMessageMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "NOTE",
			}),
		);
		expect(updateCollaborationRequestStatusByIdMock).not.toHaveBeenCalled();
	});

	it("creates MORE_INFO_REQUEST and sets status to requested more info when admin intent is explicit", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", role: "ADMIN", email: "victor@example.com" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ id: 1, status: "PENDING", requesterUsername: "ana" });
		updateCollaborationRequestStatusByIdMock.mockResolvedValue({ id: 1, status: "REQUESTED_MORE_INFO" });

		const response = await POST(
			new NextRequest("http://localhost/api/collaboration/requests/1/messages", {
				method: "POST",
				body: JSON.stringify({ message: "Please clarify this part", intent: "MORE_INFO_REQUEST" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(createCollaborationRequestMessageMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "MORE_INFO_REQUEST",
			}),
		);
		expect(updateCollaborationRequestStatusByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				status: "REQUESTED_MORE_INFO",
				reviewerUsername: "victor",
			}),
		);
	});

	it("creates RESPONSE and sets status back to pending when requester responds to requested-more-info", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", role: "USER", email: "victor@example.com" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ id: 1, status: "REQUESTED_MORE_INFO", requesterUsername: "victor" });
		updateCollaborationRequestStatusByIdMock.mockResolvedValue({ id: 1, status: "PENDING" });

		const response = await POST(
			new NextRequest("http://localhost/api/collaboration/requests/1/messages", {
				method: "POST",
				body: JSON.stringify({ message: "Here is the extra information" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(createCollaborationRequestMessageMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "RESPONSE",
			}),
		);
		expect(updateCollaborationRequestStatusByIdMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				status: "PENDING",
			}),
		);
	});

	it("creates NOTE without status change for requester when request is not awaiting more info", async () => {
		getUserByUsernameMock.mockResolvedValue({ username: "victor", role: "USER", email: "victor@example.com" });
		getCollaborationRequestDetailsByIdMock.mockResolvedValue({ id: 1, status: "PENDING", requesterUsername: "victor" });

		const response = await POST(
			new NextRequest("http://localhost/api/collaboration/requests/1/messages", {
				method: "POST",
				body: JSON.stringify({ message: "A regular note" }),
				headers: { "Content-Type": "application/json" },
			}),
			{ params: Promise.resolve({ requestId: "1" }) },
		);

		expect(response.status).toBe(201);
		expect(createCollaborationRequestMessageMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "NOTE",
			}),
		);
		expect(updateCollaborationRequestStatusByIdMock).not.toHaveBeenCalled();
	});
});
