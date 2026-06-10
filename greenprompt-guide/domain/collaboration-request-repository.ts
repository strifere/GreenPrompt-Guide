import type {
	CollaborationRequestMessageType,
	CollaborationRequestStatus,
	Prisma,
	UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AnalysisStep } from "@prisma/client";

const collaborationRequestListSelect = {
	id: true,
	requesterUsername: true,
	practiceTitle: true,
	practiceSummary: true,
	status: true,
	createdAt: true,
	updatedAt: true,
} as const;

const collaborationRequestBaseSelect = {
	id: true,
	requesterUsername: true,
	reviewerUsername: true,
	status: true,
	practiceTitle: true,
	practiceSummary: true,
	practiceDescription: true,
	referenceLink: true,
	practiceExamples: true,
	hyperparameters: true,
	promptTechniques: true,
	supportingPdfName: true,
	supportingPdfPath: true,
	supportingPdfMimeType: true,
	supportingPdfSizeBytes: true,
	rejectionReason: true,
	reviewerNotes: true,
	requestedMoreInfoAt: true,
	reviewedAt: true,
	createdAt: true,
	updatedAt: true,
	messages: false,
} as const;

const collaborationRequestDetailSelect = {
	...collaborationRequestBaseSelect,
	createdPractice: {
		select: {
			name: true,
		},
	},
	messages: {
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			requestId: true,
			authorUsername: true,
			authorRole: true,
			type: true,
			message: true,
			readAt: true,
			createdAt: true,
			author: {
				select: {
					username: true,
					email: true,
					role: true,
				},
			},
		},
	},
} as const;

export type CreateCollaborationRequestInput = {
	requesterUsername: string;
	practiceTitle: string;
	practiceSummary: string;
	practiceDescription: string;
	referenceLink: string;
	practiceExamples: string | null;
	hyperparameters: string | null;
	promptTechniques: string | null;
	supportingPdfName: string;
	supportingPdfPath: string;
	supportingPdfMimeType: string;
	supportingPdfSizeBytes: number;
};

export async function createCollaborationRequest(input: CreateCollaborationRequestInput) {
	return prisma.collaborationRequest.create({
		data: {
			requesterUsername: input.requesterUsername,
			practiceTitle: input.practiceTitle,
			practiceSummary: input.practiceSummary,
			practiceDescription: input.practiceDescription,
			referenceLink: input.referenceLink,
			practiceExamples: input.practiceExamples,
			hyperparameters: input.hyperparameters,
			promptTechniques: input.promptTechniques,
			supportingPdfName: input.supportingPdfName,
			supportingPdfPath: input.supportingPdfPath,
			supportingPdfMimeType: input.supportingPdfMimeType,
			supportingPdfSizeBytes: input.supportingPdfSizeBytes,
		},
		select: {
			id: true,
			practiceTitle: true,
			referenceLink: true,
			status: true,
			supportingPdfName: true,
			supportingPdfPath: true,
		},
	});
}

export async function getCollaborationRequestById(id: number) {
	return prisma.collaborationRequest.findUnique({
		where: { id },
		select: collaborationRequestBaseSelect,
	});
}

export async function getCollaborationRequestDetailsById(id: number) {
	return prisma.collaborationRequest.findUnique({
		where: { id },
		select: collaborationRequestDetailSelect,
	});
}

export type UpdateCollaborationRequestInput = {
	id: number;
	practiceTitle?: string;
	practiceSummary?: string;
	practiceDescription?: string;
	referenceLink?: string;
	practiceExamples?: string | null;
	hyperparameters?: string | null;
	promptTechniques?: string | null;
	status?: CollaborationRequestStatus;
	reviewerUsername?: string | null;
	requestedMoreInfoAt?: Date | null;
	reviewedAt?: Date | null;
};

export async function updateCollaborationRequestById(input: UpdateCollaborationRequestInput) {
	const data: Record<string, string | null | undefined> = {};

	if (input.practiceTitle !== undefined) {
		data.practiceTitle = input.practiceTitle;
	}

	if (input.practiceSummary !== undefined) {
		data.practiceSummary = input.practiceSummary;
	}

	if (input.practiceDescription !== undefined) {
		data.practiceDescription = input.practiceDescription;
	}

	if (input.referenceLink !== undefined) {
		data.referenceLink = input.referenceLink;
	}

	if (input.practiceExamples !== undefined) {
		data.practiceExamples = input.practiceExamples;
	}

	if (input.hyperparameters !== undefined) {
		data.hyperparameters = input.hyperparameters;
	}

	if (input.promptTechniques !== undefined) {
		data.promptTechniques = input.promptTechniques;
	}

	return prisma.collaborationRequest.update({
		where: { id: input.id },
		data,
		select: collaborationRequestDetailSelect,
	});
}

export type UpdateCollaborationRequestStatusInput = {
	id: number;
	status?: CollaborationRequestStatus;
	reviewerUsername?: string | null;
	requestedMoreInfoAt?: Date | null;
	reviewedAt?: Date | null;
	rejectionReason?: string | null;
	reviewerNotes?: string | null;
};

export async function updateCollaborationRequestStatusById(input: UpdateCollaborationRequestStatusInput) {
	const data: Record<string, string | Date | null | undefined> = {};

	if (input.status !== undefined) {
		data.status = input.status;
	}

	if (input.reviewerUsername !== undefined) {
		data.reviewerUsername = input.reviewerUsername;
	}

	if (input.requestedMoreInfoAt !== undefined) {
		data.requestedMoreInfoAt = input.requestedMoreInfoAt;
	}

	if (input.reviewedAt !== undefined) {
		data.reviewedAt = input.reviewedAt;
	}

	if (input.rejectionReason !== undefined) {
		data.rejectionReason = input.rejectionReason;
	}

	if (input.reviewerNotes !== undefined) {
		data.reviewerNotes = input.reviewerNotes;
	}

	return prisma.collaborationRequest.update({
		where: { id: input.id },
		data,
		select: collaborationRequestDetailSelect,
	});
}

export type CreateCollaborationRequestMessageInput = {
	requestId: number;
	authorUsername: string;
	authorRole: UserRole;
	type: CollaborationRequestMessageType;
	message: string;
	readAt?: Date | null;
};

export async function createCollaborationRequestMessage(input: CreateCollaborationRequestMessageInput) {
	const messageData: Prisma.CollaborationRequestMessageUncheckedCreateInput = {
		requestId: input.requestId,
		authorUsername: input.authorUsername,
		authorRole: input.authorRole,
		type: input.type,
		message: input.message,
		readAt: input.readAt ?? null,
	};

	const messageSelect = {
		id: true,
		requestId: true,
		authorUsername: true,
		authorRole: true,
		type: true,
		message: true,
		readAt: true,
		createdAt: true,
		author: {
			select: {
				username: true,
				email: true,
				role: true,
			},
		},
	} satisfies Prisma.CollaborationRequestMessageSelect;

	return prisma.collaborationRequestMessage.create({
		data: messageData,
		select: messageSelect,
	});
}

export async function markCollaborationRequestMessageAsRead(messageId: number) {
	const messageUpdateData: Prisma.CollaborationRequestMessageUncheckedUpdateInput = {
		readAt: new Date(),
	};

	const messageSelect = {
		id: true,
		requestId: true,
		authorUsername: true,
		authorRole: true,
		type: true,
		message: true,
		readAt: true,
		createdAt: true,
	} satisfies Prisma.CollaborationRequestMessageSelect;

	return prisma.collaborationRequestMessage.update({
		where: { id: messageId },
		data: messageUpdateData,
		select: messageSelect,
	});
}

export async function deleteCollaborationRequestById(id: number): Promise<void> {
	await prisma.collaborationRequest.delete({ where: { id } });
}

export async function listCollaborationRequestsByRequesterUsername(requesterUsername: string) {
	return prisma.collaborationRequest.findMany({
		where: { requesterUsername },
		orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
		select: collaborationRequestListSelect,
	});
}

export async function listAllCollaborationRequests() {
	return prisma.collaborationRequest.findMany({
		orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
		select: collaborationRequestListSelect,
	});
}

export async function findExistingJob(requestId: number) {
  return prisma.analysisJob.findUnique({
	where: { requestId: requestId },
	select: { status: true, result: true, error: true },
	});
}

function parseStep(step: number | string): AnalysisStep {
  switch (step) {
	case 1:
		return AnalysisStep.FIRST_PROMPT;
	case 2:
		return AnalysisStep.SECOND_PROMPT;
	case 3:
		return AnalysisStep.THIRD_PROMPT;
	case 4:
		return AnalysisStep.FOURTH_PROMPT;
	case 5:
		return AnalysisStep.FINISHED;
	case "end":
		return AnalysisStep.FINISHED;
	default:
		throw new Error(`Unsupported analysis step: ${step}`);
  }
}

export async function setAnalysisStep(requestId: number, step: number | string): Promise<void> {
  const parsedStep = parseStep(step);
  await prisma.analysisJob.update({
	where: { requestId: requestId },
	data: { step: parsedStep },
  });
}