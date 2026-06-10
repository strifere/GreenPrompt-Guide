import { NextResponse } from "next/server";
import {
	getCollaborationRequestDetailsById,
	updateCollaborationRequestById,
	updateCollaborationRequestStatusById,
} from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import type { CollaborationRequestStatus } from "@prisma/client";

export const runtime = "nodejs";

type RequestRouteContext = {
	params: Promise<{ requestId: string }>;
};

function parseRequestId(requestId: string) {
	const parsedRequestId = Number.parseInt(requestId, 10);
	return Number.isInteger(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;
}

function normalizeRequiredText(value: unknown) {
	return typeof value === "string" ? value.trim() : undefined;
}

function normalizeOptionalText(value: unknown) {
	if (value === null) {
		return null;
	}

	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeStatus(value: unknown): CollaborationRequestStatus | undefined {
	if (value === "PENDING" || value === "APPROVED" || value === "DENIED") {
		return value;
	}

	return undefined;
}

async function loadAuthorizedCollaborationRequest(requestId: string) {
	const currentUsername = await getSession();

	if (!currentUsername) {
		return { errorResponse: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
	}

	const currentUser = await getUserByUsername(currentUsername);

	if (!currentUser) {
		return { errorResponse: NextResponse.json({ error: "User not found" }, { status: 404 }) };
	}

	const parsedRequestId = parseRequestId(requestId);

	if (!parsedRequestId) {
		return { errorResponse: NextResponse.json({ error: "Invalid request id" }, { status: 400 }) };
	}

	const collaborationRequest = await getCollaborationRequestDetailsById(parsedRequestId);

	if (!collaborationRequest) {
		return { errorResponse: NextResponse.json({ error: "Request not found" }, { status: 404 }) };
	}

	if (currentUser.role !== "ADMIN" && collaborationRequest.requesterUsername !== currentUser.username) {
		return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}

	return { currentUser, collaborationRequest, parsedRequestId };
}

export async function GET(_request: Request, context: RequestRouteContext) {
	try {
		const { requestId } = await context.params;
		const authorizationResult = await loadAuthorizedCollaborationRequest(requestId);

		if ("errorResponse" in authorizationResult) {
			return authorizationResult.errorResponse;
		}

		return NextResponse.json({ request: authorizationResult.collaborationRequest }, { status: 200 });
	} catch (error) {
		console.error("Collaboration request fetch error:", error);
		return NextResponse.json({ error: "An error occurred while loading the request" }, { status: 500 });
	}
}

export async function PATCH(request: Request, context: RequestRouteContext) {
	try {
		const { requestId } = await context.params;
		const authorizationResult = await loadAuthorizedCollaborationRequest(requestId);

		if ("errorResponse" in authorizationResult) {
			return authorizationResult.errorResponse;
		}

		const payload = await request.json();
		const practiceTitle = normalizeRequiredText(payload.practiceTitle);
		const practiceSummary = normalizeRequiredText(payload.practiceSummary);
		const practiceDescription = normalizeRequiredText(payload.practiceDescription);
		const referenceLink = normalizeRequiredText(payload.referenceLink);
		const practiceExamples = normalizeOptionalText(payload.practiceExamples);
		const hyperparameters = normalizeOptionalText(payload.hyperparameters);
		const promptTechniques = normalizeOptionalText(payload.promptTechniques);
		const status = normalizeStatus(payload.status);
		const rejectionReason = normalizeRequiredText(payload.rejectionReason);
		const reviewerNotes = normalizeOptionalText(payload.reviewerNotes);
		const hasRequesterFieldUpdates = [practiceTitle, practiceSummary, practiceDescription, referenceLink, practiceExamples, hyperparameters, promptTechniques].some((value) => value !== undefined);
		const hasAdminFieldUpdates = status !== undefined || rejectionReason !== undefined || reviewerNotes !== undefined;

		if (!hasRequesterFieldUpdates && !hasAdminFieldUpdates) {
			return NextResponse.json({ error: "No fields were provided for update" }, { status: 400 });
		}

		if (authorizationResult.currentUser.role === "ADMIN" && hasRequesterFieldUpdates) {
			return NextResponse.json({ error: "Admins cannot edit request fields" }, { status: 403 });
		}

		if (authorizationResult.currentUser.role !== "ADMIN" && hasAdminFieldUpdates) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (authorizationResult.currentUser.role === "ADMIN" && hasAdminFieldUpdates && !status) {
			return NextResponse.json({ error: "A status is required for admin updates" }, { status: 400 });
		}

		if ((practiceTitle !== undefined && !practiceTitle) || (practiceSummary !== undefined && !practiceSummary) || (practiceDescription !== undefined && !practiceDescription)) {
			return NextResponse.json({ error: "Title, summary, and description cannot be empty" }, { status: 400 });
		}

		if (referenceLink !== undefined && !referenceLink) {
			return NextResponse.json({ error: "Reference link cannot be empty" }, { status: 400 });
		}

		if (authorizationResult.currentUser.role === "ADMIN" && status === "DENIED" && !rejectionReason) {
			return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
		}

		if (authorizationResult.currentUser.role === "ADMIN" && status !== "DENIED" && hasAdminFieldUpdates && rejectionReason !== undefined) {
			return NextResponse.json({ error: "A rejection reason is only allowed when denying" }, { status: 400 });
		}

		const requestUpdate: {
			practiceTitle?: string;
			practiceSummary?: string;
			practiceDescription?: string;
			referenceLink?: string;
			practiceExamples?: string | null;
			hyperparameters?: string | null;
			promptTechniques?: string | null;
		} = {};

		if (practiceTitle !== undefined) {
			requestUpdate.practiceTitle = practiceTitle;
		}

		if (practiceSummary !== undefined) {
			requestUpdate.practiceSummary = practiceSummary;
		}

		if (practiceDescription !== undefined) {
			requestUpdate.practiceDescription = practiceDescription;
		}

		if (referenceLink !== undefined) {
			requestUpdate.referenceLink = referenceLink;
		}

		if (practiceExamples !== undefined) {
			requestUpdate.practiceExamples = practiceExamples;
		}

		if (hyperparameters !== undefined) {
			requestUpdate.hyperparameters = hyperparameters;
		}

		if (promptTechniques !== undefined) {
			requestUpdate.promptTechniques = promptTechniques;
		}

		if (authorizationResult.currentUser.role === "ADMIN" && hasAdminFieldUpdates) {
			const reviewedAt = status === "PENDING" ? null : new Date();
			const requestedMoreInfoAt = status === "PENDING" ? null : undefined;
			const normalizedRejectionReason = status === "DENIED" ? rejectionReason ?? null : null;

			const updatedByAdmin = await updateCollaborationRequestStatusById({
				id: authorizationResult.parsedRequestId,
				status,
				reviewerUsername: authorizationResult.currentUser.username,
				reviewedAt,
				requestedMoreInfoAt,
				rejectionReason: normalizedRejectionReason,
				reviewerNotes,
			});

			return NextResponse.json({ request: updatedByAdmin }, { status: 200 });
		}

		const updatedRequest = await updateCollaborationRequestById({
			id: authorizationResult.parsedRequestId,
			...requestUpdate,
		});

		return NextResponse.json({ request: updatedRequest }, { status: 200 });
	} catch (error) {
		console.error("Collaboration request update error:", error);
		return NextResponse.json({ error: "An error occurred while updating the request" }, { status: 500 });
	}
}