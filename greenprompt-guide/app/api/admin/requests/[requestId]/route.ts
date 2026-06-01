import { type Prisma, type TacticType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
    deleteCollaborationRequestById,
    getCollaborationRequestDetailsById,
} from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

type RequestedPracticeRouteContext = {
    params: Promise<{ requestId: string }>;
};

type ExamplePayload = {
    scenario: string;
    originalPrompts: string;
    improvedPrompts: string;
    observations: string;
};

type RequestedPracticePayload = {
    practice?: {
        name?: string;
        description?: string;
        greenScore?: number | string;
        tactic?: TacticType;
    };
    category?: {
        mode?: "existing" | "new";
        name?: string;
        description?: string;
        tactic?: TacticType;
    };
    examples?: ExamplePayload[];
    reference?: {
        title?: string;
        authors?: string;
        abstract?: string;
        keywords?: string;
        year?: string | number;
        studyType?: string;
        domain?: string;
        task?: string;
        venue?: string;
        toolAvailability?: string;
        link?: string;
    };
};

type NormalizedRequestedPracticePayload = {
    practice: {
        name: string;
        description: string;
        greenScore: number;
        tactic: TacticType;
    };
    category: {
        mode: "existing" | "new";
        name: string;
        description: string | null;
        tactic: TacticType | null;
    };
    examples: ExamplePayload[];
    reference: {
        title: string;
        authors: string;
        abstract: string | null;
        keywords: string | null;
        year: number;
        studyType: string;
        domain: string | null;
        task: string | null;
        venue: string | null;
        toolAvailability: string | null;
        link: string;
    };
};

function parseRequestId(requestId: string) {
    const parsedRequestId = Number.parseInt(requestId, 10);
    return Number.isInteger(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;
}

function trimText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function trimNullableText(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function parseGreenScore(value: unknown) {
    let score = Number.NaN;

    if (typeof value === "string") {
        score = Number.parseInt(value, 10);
    } else if (typeof value === "number") {
        score = value;
    }

    return Number.isInteger(score) ? score : null;
}

function parseYear(value: unknown) {
    let year = Number.NaN;

    if (typeof value === "string") {
        year = Number.parseInt(value, 10);
    } else if (typeof value === "number") {
        year = value;
    }

    return Number.isInteger(year) ? year : null;
}

function normalizeExamples(examples: ExamplePayload[] | undefined) {
    if (!Array.isArray(examples)) {
        return [];
    }

    return examples
        .map((example) => ({
            scenario: trimText(example.scenario),
            originalPrompts: trimText(example.originalPrompts),
            improvedPrompts: trimText(example.improvedPrompts),
            observations: trimText(example.observations),
        }))
        .filter((example) =>
            example.scenario || example.originalPrompts || example.improvedPrompts || example.observations,
        );
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

function normalizeRequestedPracticePayload(payload: RequestedPracticePayload) {
    const practiceName = trimText(payload.practice?.name);
    const practiceDescription = trimText(payload.practice?.description);
    const practiceGreenScore = parseGreenScore(payload.practice?.greenScore);
    const practiceTactic = payload.practice?.tactic ?? null;
    const categoryMode = payload.category?.mode ?? null;
    const categoryName = trimText(payload.category?.name);
    const categoryDescription = trimNullableText(payload.category?.description);
    const categoryTactic = payload.category?.tactic ?? null;
    const referenceTitle = trimText(payload.reference?.title);
    const referenceAuthors = trimText(payload.reference?.authors);
    const referenceAbstract = trimNullableText(payload.reference?.abstract);
    const referenceKeywords = trimNullableText(payload.reference?.keywords);
    const referenceYear = parseYear(payload.reference?.year);
    const referenceStudyType = trimText(payload.reference?.studyType);
    const referenceDomain = trimNullableText(payload.reference?.domain);
    const referenceTask = trimNullableText(payload.reference?.task);
    const referenceVenue = trimNullableText(payload.reference?.venue);
    const referenceToolAvailability = trimNullableText(payload.reference?.toolAvailability);
    const referenceLink = trimText(payload.reference?.link);
    const examples = normalizeExamples(payload.examples);

    if (!practiceName || !practiceDescription || practiceGreenScore === null || !practiceTactic) {
        return { error: "Practice title, description, green score, and tactic are required" };
    }

    if (practiceGreenScore < 0 || practiceGreenScore > 100) {
        return { error: "Green score must be between 0 and 100" };
    }

    if (categoryMode !== "existing" && categoryMode !== "new") {
        return { error: "A category mode is required" };
    }

    if (!categoryName) {
        return { error: "A category is required" };
    }

    if (categoryMode === "new" && !categoryTactic) {
        return { error: "A tactic is required for a new category" };
    }

    if (!referenceTitle || !referenceAuthors || referenceYear === null || !referenceStudyType || !referenceLink) {
        return { error: "Reference title, authors, year, study type, and link are required" };
    }

    for (const example of examples) {
        if (!example.scenario || !example.originalPrompts || !example.improvedPrompts || !example.observations) {
            return { error: "Each practice example must include a scenario, original prompts, improved prompts, and observations" };
        }
    }

    return {
        value: {
            practice: {
                name: practiceName,
                description: practiceDescription,
                greenScore: practiceGreenScore,
                tactic: practiceTactic,
            },
            category: {
                mode: categoryMode,
                name: categoryName,
                description: categoryDescription,
                tactic: categoryTactic,
            },
            examples,
            reference: {
                title: referenceTitle,
                authors: referenceAuthors,
                abstract: referenceAbstract,
                keywords: referenceKeywords,
                year: referenceYear,
                studyType: referenceStudyType,
                domain: referenceDomain,
                task: referenceTask,
                venue: referenceVenue,
                toolAvailability: referenceToolAvailability,
                link: referenceLink,
            },
        } satisfies NormalizedRequestedPracticePayload,
    };
}

async function createRequestedPractice(
    tx: Prisma.TransactionClient,
    requestId: number,
    currentUsername: string,
    payload: NormalizedRequestedPracticePayload,
) {
    let categoryName = payload.category.name;

    if (payload.category.mode === "existing") {
        const existingCategory = await tx.category.findUnique({ where: { name: categoryName } });

        if (!existingCategory) {
            throw new Error("Selected category was not found");
        }

        categoryName = existingCategory.name;
    } else {
        const existingCategory = await tx.category.findUnique({ where: { name: categoryName } });

        if (existingCategory) {
            throw new Error("That category already exists. Select it from the existing categories list instead.");
        }

        await tx.category.create({
            data: {
                name: categoryName,
                description: payload.category.description,
                tactic: payload.category.tactic ?? payload.practice.tactic,
            },
        });
    }

    const createdReference = await tx.reference.create({
        data: {
            title: payload.reference.title,
            authors: payload.reference.authors,
            abstract: payload.reference.abstract,
            keywords: payload.reference.keywords,
            year: payload.reference.year,
            studyType: payload.reference.studyType,
            domain: payload.reference.domain,
            task: payload.reference.task,
            venue: payload.reference.venue,
            toolAvailability: payload.reference.toolAvailability,
            link: payload.reference.link,
        },
    });

    const createdPractice = await tx.practice.create({
        data: {
            name: payload.practice.name,
            description: payload.practice.description,
            greenScore: payload.practice.greenScore,
            tactic: payload.practice.tactic,
            createdFromRequestId: requestId,
            categories: {
                create: {
                    categoryName,
                },
            },
            papers: {
                create: {
                    referenceTitle: createdReference.title,
                },
            },
            practiceExamples: payload.examples.length > 0
                ? {
                    create: payload.examples.map((example) => ({
                        scenario: example.scenario,
                        originalPrompts: example.originalPrompts,
                        improvedPrompts: example.improvedPrompts,
                        observations: example.observations,
                    })),
                }
                : undefined,
        },
        select: { name: true },
    });

    await tx.collaborationRequest.update({
        where: { id: requestId },
        data: {
            status: "APPROVED",
            reviewerUsername: currentUsername,
            reviewedAt: new Date(),
            requestedMoreInfoAt: null,
        },
    });

    return createdPractice;
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

        const payload = normalizeRequestedPracticePayload((await request.json()) as RequestedPracticePayload);

        if ("error" in payload) {
            return NextResponse.json({ error: payload.error }, { status: 400 });
        }

        const createdPractice = await prisma.$transaction((tx) =>
            createRequestedPractice(tx, parsedRequestId, authResult.currentUser.username, payload.value),
        );

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
