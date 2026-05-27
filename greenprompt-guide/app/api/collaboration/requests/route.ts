import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { createCollaborationRequest, deleteCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { getCollaborationPdfPublicRoute, getCollaborationPdfStorageDir, getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";

export const runtime = "nodejs";

function readTextField(formData: FormData, key: string, required: boolean): string {
	const value = formData.get(key);
	if (typeof value !== "string") {
		if (required) {
			throw new Error(`${key} is required`);
		}
		return "";
	}

	const trimmed = value.trim();
	if (!trimmed && required) {
		throw new Error(`${key} is required`);
	}

	return trimmed;
}

export async function POST(request: NextRequest) {
	let createdRequestId: number | null = null;

	try {
		const currentUsername = await getSession();

		if (!currentUsername) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const user = await getUserByUsername(currentUsername);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const formData = await request.formData();
		const practiceTitle = readTextField(formData, "practiceTitle", true);
		const practiceSummary = readTextField(formData, "practiceSummary", true);
		const practiceDescription = readTextField(formData, "practiceDescription", true);
		const practiceExamples = readTextField(formData, "practiceExamples", false) || null;
		const hyperparameters = readTextField(formData, "hyperparameters", false) || null;
		const promptTechniques = readTextField(formData, "promptTechniques", false) || null;
		const sourcePdf = formData.get("sourcePdf");

		if (!(sourcePdf instanceof File) || sourcePdf.size === 0) {
			return NextResponse.json({ error: "A supporting PDF is required" }, { status: 400 });
		}

		if (sourcePdf.type !== "application/pdf") {
			return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
		}

		const storageDir = getCollaborationPdfStorageDir();
		await mkdir(storageDir, { recursive: true });

		const safeName = sourcePdf.name.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "supporting.pdf";
		const relativePath = `${randomUUID()}-${safeName}`;
		const absolutePath = getCollaborationPdfStoragePath(relativePath);
		const pdfBytes = new Uint8Array(await sourcePdf.arrayBuffer());

		const createdRequest = await createCollaborationRequest({
			requesterUsername: user.username,
			practiceTitle,
			practiceSummary,
			practiceDescription,
			practiceExamples,
			hyperparameters,
			promptTechniques,
			supportingPdfName: sourcePdf.name,
			supportingPdfPath: relativePath,
			supportingPdfMimeType: sourcePdf.type,
			supportingPdfSizeBytes: sourcePdf.size,
		});
		createdRequestId = createdRequest.id;

		try {
			await writeFile(absolutePath, pdfBytes);
		} catch (storageError) {
			if (createdRequestId != null) {
				await deleteCollaborationRequestById(createdRequestId).catch(() => undefined);
			}
			throw storageError;
		}

		return NextResponse.json(
			{
				message: "Collaboration request created successfully",
				request: {
					id: createdRequest.id,
					practiceTitle: createdRequest.practiceTitle,
					status: createdRequest.status,
					pdfUrl: getCollaborationPdfPublicRoute(createdRequest.id),
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Collaboration request upload error:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred while creating the request" }, { status: 500 });
	}
}