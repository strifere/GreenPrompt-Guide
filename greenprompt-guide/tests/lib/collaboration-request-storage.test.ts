
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    getCollaborationPdfStorageDir,
    getCollaborationPdfStoragePath,
    getCollaborationPdfPublicRoute,
} from "@/lib/collaboration-request-storage";

describe("collaboration-request-storage", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterEach(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    describe("getCollaborationPdfStorageDir", () => {
        it("should return the default storage directory if env var is not set", () => {
            delete process.env.COLLABORATION_PDF_STORAGE_DIR;
            const dir = getCollaborationPdfStorageDir();
            expect(dir).toBe("/data/uploads/collaboration-requests");
        });

        it("should return the trimmed directory from the env var if set", () => {
            process.env.COLLABORATION_PDF_STORAGE_DIR = "  /custom/storage/dir  ";
            const dir = getCollaborationPdfStorageDir();
            expect(dir).toBe("/custom/storage/dir");
        });

        it("should return the default directory if env var is empty", () => {
            process.env.COLLABORATION_PDF_STORAGE_DIR = "";
            const dir = getCollaborationPdfStorageDir();
            expect(dir).toBe("/data/uploads/collaboration-requests");
        });
    });

    describe("getCollaborationPdfStoragePath", () => {
        it("should correctly join the storage directory and the relative path", () => {
            delete process.env.COLLABORATION_PDF_STORAGE_DIR;
            const storagePath = getCollaborationPdfStoragePath("file.pdf");
            // path.join will use the separator for the OS, so we check for both
            expect(storagePath).toMatch(
                /(\/data\/uploads\/collaboration-requests\/file\.pdf|\data\uploads\collaboration-requests\file\.pdf)/
            );
        });

        it("should use the custom storage directory for joining", () => {
            process.env.COLLABORATION_PDF_STORAGE_DIR = "/custom/dir";
            const storagePath = getCollaborationPdfStoragePath("another/file.pdf");
            expect(storagePath).toMatch(
                /(\/custom\/dir\/another\/file\.pdf|\custom\dir\another\file\.pdf)/
            );
        });
    });

    describe("getCollaborationPdfPublicRoute", () => {
        it("should construct the correct public route for a given request ID", () => {
            const route = getCollaborationPdfPublicRoute(123);
            expect(route).toBe("/api/collaboration/requests/123/pdf");
        });
    });
});
