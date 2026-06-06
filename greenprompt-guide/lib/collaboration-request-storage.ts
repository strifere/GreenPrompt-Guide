import path from "node:path";

const DEFAULT_STORAGE_DIR = "/data/uploads/collaboration-requests";

export function getCollaborationPdfStorageDir(): string {
	return process.env.COLLABORATION_PDF_STORAGE_DIR?.trim() || DEFAULT_STORAGE_DIR;
}

export function getCollaborationPdfStoragePath(relativePath: string): string {
	return path.join(getCollaborationPdfStorageDir(), relativePath);
}

export function getCollaborationPdfPublicRoute(requestId: number): string {
	return `/api/collaboration/requests/${requestId}/pdf`;
}