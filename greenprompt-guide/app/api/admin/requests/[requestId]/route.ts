import { NextResponse } from "next/server";
import {
    deleteCollaborationRequestById,
    getCollaborationRequestDetailsById,
} from "@/domain/collaboration-request-repository";
import {
    createAdminPractice,
    normalizeAdminPracticePayload,
    type AdminPracticePayload,
} from "@/lib/admin-practice-creation";
import { getUserByUsername } from "@/domain/user-repository";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

type RequestedPracticeRouteContext = {
    params: Promise<{ requestId: string }>;
};

function parseRequestId(requestId: string) {
    const parsedRequestId = Number.parseInt(requestId, 10);
    return Number.isInteger(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;
}

async function getAuthenticatedAdmin() {
    const currentUsername = await getSession();

    if (!currentUsername) {
        return { errorResponse: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
    }

    const currentUser = await getUserByUsername(currentUsername);

    if (currentUser?.role !== "ADMIN") {
        return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { currentUser };
}

export async function POST(request: Request, context: RequestedPracticeRouteContext) {
    try {
        const authResult = await getAuthenticatedAdmin();

        if ("errorResponse" in authResult) {
            return authResult.errorResponse;
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

        if (collaborationRequest.createdPractice) {
            return NextResponse.json(
                {
                    message: "The practice for this request was already created",
                    request: collaborationRequest,
                    practice: collaborationRequest.createdPractice,
                },
                { status: 200 },
            );
        }

        if (collaborationRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Only pending requests can be approved from this flow" }, { status: 409 });
        }

        const payload = normalizeAdminPracticePayload((await request.json()) as AdminPracticePayload);

        if ("error" in payload) {
            return NextResponse.json({ error: payload.error }, { status: 400 });
        }

        const createdPractice = await prisma.$transaction(async (tx) => {
            const practice = await createAdminPractice(tx, payload.value, { createdFromRequestId: parsedRequestId });

            await tx.collaborationRequest.update({
                where: { id: parsedRequestId },
                data: {
                    status: "APPROVED",
                    reviewerUsername: authResult.currentUser.username,
                    reviewedAt: new Date(),
                    requestedMoreInfoAt: null,
                },
            });

            return practice;
        });

        const updatedRequest = await getCollaborationRequestDetailsById(parsedRequestId);

        return NextResponse.json(
            {
                practice: createdPractice,
                request: updatedRequest,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Requested practice creation error:", error);
        return NextResponse.json({ error: "An error occurred while creating the practice" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RequestedPracticeRouteContext) {
    try {
        const authResult = await getAuthenticatedAdmin();

        if ("errorResponse" in authResult) {
            return authResult.errorResponse;
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

        await deleteCollaborationRequestById(parsedRequestId);

        return NextResponse.json({ message: "Request deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Collaboration request deletion error:", error);
        return NextResponse.json({ error: "An error occurred while deleting the request" }, { status: 500 });
    }
}
