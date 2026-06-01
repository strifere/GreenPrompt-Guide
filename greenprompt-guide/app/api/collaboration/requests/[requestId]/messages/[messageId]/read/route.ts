import { NextResponse } from "next/server";
import {
	getCollaborationRequestDetailsById,
	markCollaborationRequestMessageAsRead,
} from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

type ReadMessageRouteContext = {
	params: Promise<{ requestId: string; messageId: string }>;
};

function parseId(value: string) {
	const parsedValue = Number.parseInt(value, 10);
	return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export async function POST(_request: Request, context: ReadMessageRouteContext) {
	try {
		const currentUsername = await getSession();

		if (!currentUsername) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const currentUser = await getUserByUsername(currentUsername);

		if (!currentUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const { requestId, messageId } = await context.params;
		const parsedRequestId = parseId(requestId);
		const parsedMessageId = parseId(messageId);

		if (!parsedRequestId || !parsedMessageId) {
			return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
		}

		const collaborationRequest = await getCollaborationRequestDetailsById(parsedRequestId);

		if (!collaborationRequest) {
			return NextResponse.json({ error: "Request not found" }, { status: 404 });
		}

		if (currentUser.role !== "ADMIN" && collaborationRequest.requesterUsername !== currentUser.username) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const message = collaborationRequest.messages.find((entry: { id: number; }) => entry.id === parsedMessageId);

		if (message?.requestId !== parsedRequestId) {
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		if (currentUser.username !== collaborationRequest.requesterUsername) {
			return NextResponse.json({ error: "Only the requester can mark messages as read" }, { status: 403 });
		}

		if (message.authorRole !== "ADMIN") {
			return NextResponse.json({ error: "Only admin messages can be marked as read" }, { status: 400 });
		}

		if (!message.readAt) {
			await markCollaborationRequestMessageAsRead(parsedMessageId);
		}

		const updatedRequest = await getCollaborationRequestDetailsById(parsedRequestId);

		return NextResponse.json({ request: updatedRequest }, { status: 200 });
	} catch (error) {
		console.error("Collaboration request message read error:", error);
		return NextResponse.json({ error: "An error occurred while marking the message as read" }, { status: 500 });
	}
}