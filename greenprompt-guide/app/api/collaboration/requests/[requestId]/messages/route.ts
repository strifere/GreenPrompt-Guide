import { NextResponse } from "next/server";
import {
	createCollaborationRequestMessage,
	getCollaborationRequestDetailsById,
	updateCollaborationRequestStatusById,
} from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import type { CollaborationRequestStatus, UserRole } from "@prisma/client";

export const runtime = "nodejs";

type RequestMessagesRouteContext = {
	params: Promise<{ requestId: string }>;
};

type MessageIntent = "MORE_INFO_REQUEST";

function parseRequestId(requestId: string) {
	const parsedRequestId = Number.parseInt(requestId, 10);
	return Number.isInteger(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;
}

function readIntent(value: unknown): MessageIntent | null {
	return value === "MORE_INFO_REQUEST" ? value : null;
}

export async function POST(request: Request, context: RequestMessagesRouteContext) {
	try {
		const currentUsername = await getSession();

		if (!currentUsername) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const currentUser = await getUserByUsername(currentUsername);

		if (!currentUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const { requestId } = await context.params;
		const parsedRequestId = parseRequestId(requestId);

		if (!parsedRequestId) {
			return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
		}

		const collaborationRequest = await getCollaborationRequestDetailsById(parsedRequestId);

		if (!collaborationRequest) {
			return NextResponse.json({ error: "Request not found" }, { status: 404 });
		}

		if (currentUser.role !== "ADMIN" && collaborationRequest.requesterUsername !== currentUser.username) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const payload = await request.json();
		const message = typeof payload.message === "string" ? payload.message.trim() : "";
		const intent = readIntent(payload.intent);

		if (!message) {
			return NextResponse.json({ error: "Message is required" }, { status: 400 });
		}

		const isAdmin = currentUser.role === "ADMIN";
		const isAdminMoreInfoRequest = isAdmin && intent === "MORE_INFO_REQUEST";
		const isRequesterResponse = !isAdmin && collaborationRequest.status === "REQUESTED_MORE_INFO";
		const messageType = isAdminMoreInfoRequest
			? "MORE_INFO_REQUEST"
			: isRequesterResponse
				? "RESPONSE"
				: "NOTE";
		const nextStatus: CollaborationRequestStatus | null = isAdminMoreInfoRequest
			? "REQUESTED_MORE_INFO"
			: isRequesterResponse
				? "PENDING"
				: null;
		const createdMessage = await createCollaborationRequestMessage({
			requestId: parsedRequestId,
			authorUsername: currentUser.username,
			authorRole: (currentUser.role ?? "USER") as UserRole,
			type: messageType,
			message,
			readAt: null,
		});

		const updatedRequest = nextStatus
			? await updateCollaborationRequestStatusById({
					id: parsedRequestId,
					status: nextStatus,
					...(isAdminMoreInfoRequest
						? {
							requestedMoreInfoAt: new Date(),
							reviewerUsername: currentUser.username,
						}
						: {}),
				})
			: await getCollaborationRequestDetailsById(parsedRequestId);

		if (!updatedRequest) {
			return NextResponse.json({ error: "Request not found" }, { status: 404 });
		}

		return NextResponse.json({ request: updatedRequest, message: createdMessage }, { status: 201 });
	} catch (error) {
		console.error("Collaboration request message create error:", error);
		return NextResponse.json({ error: "An error occurred while posting the message" }, { status: 500 });
	}
}