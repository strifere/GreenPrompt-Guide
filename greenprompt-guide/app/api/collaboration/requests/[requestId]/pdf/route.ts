import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { getCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";

export const runtime = "nodejs";

type CollaborationPdfRouteContext = {
	params: Promise<{ requestId: string }>;
};

export async function GET(_request: Request, context: CollaborationPdfRouteContext) {
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
		const parsedRequestId = Number.parseInt(requestId, 10);

		if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
			return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
		}

		const collaborationRequest = await getCollaborationRequestById(parsedRequestId);

		if (!collaborationRequest) {
			return NextResponse.json({ error: "Request not found" }, { status: 404 });
		}

		if (currentUser.role !== "ADMIN" && collaborationRequest.requesterUsername !== currentUser.username) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const absolutePath = getCollaborationPdfStoragePath(collaborationRequest.supportingPdfPath);
		let fileBuffer: Uint8Array;

		try {
			fileBuffer = new Uint8Array(await readFile(absolutePath));
		} catch (fileError) {
			if (typeof fileError === "object" && fileError !== null && "code" in fileError && fileError.code === "ENOENT") {
				return NextResponse.json({ error: "PDF not found" }, { status: 404 });
			}

			throw fileError;
		}

		const fileName = collaborationRequest.supportingPdfName || path.basename(collaborationRequest.supportingPdfPath);

		return new NextResponse(fileBuffer as unknown as BodyInit, {
			headers: {
				"Content-Type": collaborationRequest.supportingPdfMimeType,
				"Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
				"Content-Length": String(collaborationRequest.supportingPdfSizeBytes),
				"Cache-Control": "private, max-age=0, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Collaboration PDF delivery error:", error);
		return NextResponse.json({ error: "An error occurred while loading the PDF" }, { status: 500 });
	}
}