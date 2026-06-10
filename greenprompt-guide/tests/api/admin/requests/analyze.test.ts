import { POST, GET } from "@/app/api/admin/requests/[requestId]/analyze/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collaborationRequest: {
      findUnique: vi.fn(),
    },
    analysisJob: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

const mockGetSession = getSession as jest.Mock;
const mockCRFindUnique = prisma.collaborationRequest.findUnique as jest.Mock;
const mockJobUpsert = prisma.analysisJob.upsert as jest.Mock;
const mockJobFindUnique = prisma.analysisJob.findUnique as jest.Mock;

describe("/api/admin/requests/[requestId]/analyze", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("POST", () => {
        it("should return 401 if not authenticated", async () => {
            mockGetSession.mockResolvedValue(null);
            const response = await POST({} as Request, { params: { requestId: "1" } });
            expect(response.status).toBe(401);
        });

        it("should return 400 for an invalid request ID", async () => {
            mockGetSession.mockResolvedValue("admin");
            const response = await POST({} as Request, { params: { requestId: "invalid" } });
            expect(response.status).toBe(400);
        });

        it("should return 404 if request not found", async () => {
            mockGetSession.mockResolvedValue("admin");
            mockCRFindUnique.mockResolvedValue(null);
            const response = await POST({} as Request, { params: { requestId: "999" } });
            expect(response.status).toBe(404);
        });

        it("should create a new job if one doesnt exist", async () => {
            mockGetSession.mockResolvedValue("admin");
            mockCRFindUnique.mockResolvedValue({ id: 1 });
            mockJobUpsert.mockResolvedValue({ id: 10, status: "PENDING" });
            
            const response = await POST({} as Request, { params: { requestId: "1" } });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.jobId).toBe(10);
            expect(body.status).toBe("PENDING");
            expect(mockJobUpsert).toHaveBeenCalledWith({
                where: { requestId: 1 },
                create: { requestId: 1, status: "PENDING" },
                update: { status: "PENDING", error: null, result: JSON.stringify({}), startedAt: null, completedAt: null },
            });
        });
    });

    describe("GET", () => {
        it("should return 401 if not authenticated", async () => {
            mockGetSession.mockResolvedValue(null);
            const response = await GET({} as Request, { params: { requestId: "1" } });
            expect(response.status).toBe(401);
        });

        it("should return 400 for an invalid request ID", async () => {
            mockGetSession.mockResolvedValue("admin");
            const response = await GET({} as Request, { params: { requestId: "invalid" } });
            expect(response.status).toBe(400);
        });

        it("should return NONE if no job exists", async () => {
            mockGetSession.mockResolvedValue("admin");
            mockJobFindUnique.mockResolvedValue(null);
            const response = await GET({} as Request, { params: { requestId: "1" } });
            const body = await response.json();
            expect(body.status).toBe("NONE");
        });

        it("should return job status if job is running", async () => {
            mockGetSession.mockResolvedValue("admin");
            const mockJob = { id: 1, status: "RUNNING", step: "FIRST_PROMPT", error: null };
            mockJobFindUnique.mockResolvedValue(mockJob);
            
            const response = await GET({} as Request, { params: { requestId: "1" } });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.status).toBe("RUNNING");
            expect(body.step).toBe("FIRST_PROMPT");
        });

        it("should return job result if job is done", async () => {
            mockGetSession.mockResolvedValue("admin");
            const mockResult = { practice: { name: "test" } };
            const mockJob = { id: 1, status: "DONE", result: mockResult, error: null };
            mockJobFindUnique.mockResolvedValue(mockJob);

            const response = await GET({} as Request, { params: { requestId: "1" } });
            const body = await response.json();
            
            expect(response.status).toBe(200);
            expect(body.status).toBe("DONE");
            expect(body.extraction).toEqual(mockResult);
        });
    });
});
