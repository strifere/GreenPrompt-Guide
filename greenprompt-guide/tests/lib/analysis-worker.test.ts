import { prisma } from "@/lib/prisma";
import { analyzeRequestWithOllama } from "@/lib/ollama-client";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { setAnalysisStep } from "@/domain/collaboration-request-repository";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";

// Mock dependencies with safe default resolved values to prevent .then() crashes
vi.mock("@/lib/prisma", () => ({
  prisma: {
    analysisJob: {
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockResolvedValue({}),
    },
    collaborationRequest: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));
vi.mock("@/lib/ollama-client");
vi.mock("@/lib/collaboration-request-storage");
vi.mock("@/lib/pdf-extract");
vi.mock("@/domain/collaboration-request-repository");

const mockJobFindFirst = prisma.analysisJob.findFirst as jest.Mock;
const mockJobUpdateMany = prisma.analysisJob.updateMany as jest.Mock;
const mockJobUpdate = prisma.analysisJob.update as jest.Mock;
const mockRequestFindUnique = prisma.collaborationRequest.findUnique as jest.Mock;
const mockAnalyze = analyzeRequestWithOllama as jest.Mock;
const mockExtract = extractTextFromPdf as jest.Mock;
const mockSetStep = setAnalysisStep as jest.Mock;

async function getWorker() {
    return (await import("@/lib/analysis-worker")).startAnalysisWorker;
}

describe("Analysis Worker", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.resetAllMocks(); // Wipes out mock implementation values from previous tests
        vi.spyOn(global, 'setInterval');
        vi.spyOn(global, 'clearInterval');
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllTimers();
    });

    it("should start, reset stuck jobs, and begin polling", async () => {
        const startAnalysisWorker = await getWorker();
        mockJobUpdateMany.mockResolvedValue({ count: 1 });
        startAnalysisWorker();
        startAnalysisWorker(); 

        expect(prisma.analysisJob.updateMany).toHaveBeenCalledWith({
            where: { status: "RUNNING" },
            data: { status: "PENDING", startedAt: null },
        });

        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it("should do nothing if no pending jobs are found", async () => {
        const startAnalysisWorker = await getWorker();
        mockJobUpdateMany.mockResolvedValue({ count: 1 });
        mockJobFindFirst.mockResolvedValue(null);
        startAnalysisWorker();
        
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(mockJobUpdateMany).toHaveBeenCalledTimes(1); 
        expect(mockJobUpdate).not.toHaveBeenCalled();
    });

    it("should process a job successfully", async () => {
        const startAnalysisWorker = await getWorker();
        const mockJob = { id: 1, requestId: 101, status: "PENDING" };
        mockJobFindFirst.mockResolvedValueOnce(mockJob).mockResolvedValue(null); 
        mockJobUpdateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 }); 
        mockRequestFindUnique.mockResolvedValue({ supportingPdfPath: "path/to.pdf" });
        mockExtract.mockResolvedValue(["page1_base64"]);
        mockAnalyze.mockResolvedValue({ practice: { name: "Success" } });
        
        startAnalysisWorker();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(mockJobUpdateMany).toHaveBeenCalledWith({
            where: { id: 1, status: "PENDING" },
            data: { status: "RUNNING", startedAt: expect.any(Date) },
        });
        expect(mockExtract).toHaveBeenCalled();
        expect(mockAnalyze).toHaveBeenCalledWith(101, ["page1_base64"]);
        expect(mockSetStep).toHaveBeenCalledWith(101, "end");
        expect(mockJobUpdate).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                status: "DONE",
                result: { practice: { name: "Success" } },
                completedAt: expect.any(Date),
            },
        });
    });

    it("should retry analysis on failure and then succeed", async () => {
        const startAnalysisWorker = await getWorker();
        const mockJob = { id: 1, requestId: 101, status: "PENDING" };
        
        // Return job on first tick, return null on subsequent polling intervals
        mockJobFindFirst.mockResolvedValueOnce(mockJob).mockResolvedValue(null); 
        mockJobUpdateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
        mockRequestFindUnique.mockResolvedValue({ supportingPdfPath: "path/to.pdf" });
        mockExtract.mockResolvedValue(["page1_base64"]);
        
        mockAnalyze
            .mockRejectedValueOnce(new Error("Ollama is cold"))
            .mockResolvedValue({ practice: { name: "Success" } });
        
        startAnalysisWorker();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000); 
        });
        
        expect(mockAnalyze).toHaveBeenCalledTimes(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(15000);
        });

        expect(mockAnalyze).toHaveBeenCalledTimes(2);
        expect(mockJobUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DONE" }) }));
    });

    it("should mark job as FAILED after max retries", async () => {
        const startAnalysisWorker = await getWorker();
        const mockJob = { id: 1, requestId: 101, status: "PENDING" };
        mockJobFindFirst.mockResolvedValueOnce(mockJob).mockResolvedValue(null); 
        mockJobUpdateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
        mockRequestFindUnique.mockResolvedValue({ supportingPdfPath: "path/to.pdf" });
        mockExtract.mockResolvedValue(["page1_base64"]);
        
        mockAnalyze.mockRejectedValue(new Error("Ollama is broken"));

        startAnalysisWorker();

        await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
        await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
        await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
        
        expect(mockAnalyze).toHaveBeenCalledTimes(3);
        expect(mockJobUpdate).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                status: "FAILED",
                error: "Ollama is broken",
                completedAt: expect.any(Date),
            },
        });
    });

    it("should handle failure to find the collaboration request", async () => {
        const startAnalysisWorker = await getWorker();
        const mockJob = { id: 1, requestId: 101, status: "PENDING" };
        mockJobFindFirst.mockResolvedValueOnce(mockJob).mockResolvedValue(null); 
        mockJobUpdateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
        mockRequestFindUnique.mockResolvedValue(null); 

        startAnalysisWorker();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(mockJobUpdate).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                status: "FAILED",
                error: "Collaboration request not found",
                completedAt: expect.any(Date),
            },
        });
    });
});