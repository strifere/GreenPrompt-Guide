import { prisma } from "@/lib/prisma";
import {
  createCollaborationRequest,
  getCollaborationRequestById,
  getCollaborationRequestDetailsById,
  updateCollaborationRequestById,
  updateCollaborationRequestStatusById,
  createCollaborationRequestMessage,
  markCollaborationRequestMessageAsRead,
  deleteCollaborationRequestById,
  listCollaborationRequestsByRequesterUsername,
  listAllCollaborationRequests,
  findExistingJob,
  setAnalysisStep,
} from "@/domain/collaboration-request-repository";
import { describe, it, expect, vi } from "vitest";
import { AnalysisStep } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collaborationRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    collaborationRequestMessage: {
      create: vi.fn(),
      update: vi.fn(),
    },
    analysisJob: {
        findUnique: vi.fn(),
        update: vi.fn(),
    }
  },
}));

describe("collaboration-request-repository", () => {
  const mockRequest = {
    id: 1,
    requesterUsername: "testuser",
    practiceTitle: "Test Practice",
    practiceSummary: "A summary",
    practiceDescription: "A description",
    referenceLink: "http://example.com",
    practiceExamples: null,
    hyperparameters: null,
    promptTechniques: null,
    supportingPdfName: "test.pdf",
    supportingPdfPath: "/path/to/test.pdf",
    supportingPdfMimeType: "application/pdf",
    supportingPdfSizeBytes: 1234,
  };

  it("should create a collaboration request", async () => {
    const createMock = prisma.collaborationRequest.create as jest.Mock;
    createMock.mockResolvedValue(mockRequest);
    const { id: _id, ...restOfMockRequest } = mockRequest;
    await createCollaborationRequest(restOfMockRequest);
    expect(prisma.collaborationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: restOfMockRequest,
        select: {
          id: true,
          practiceTitle: true,
          referenceLink: true,
          status: true,
          supportingPdfName: true,
          supportingPdfPath: true,
        },
      })
    );
  });

  it("should get a collaboration request by ID", async () => {
    const findUniqueMock = prisma.collaborationRequest.findUnique as jest.Mock;
    findUniqueMock.mockResolvedValue(mockRequest);
    await getCollaborationRequestById(1);
    expect(prisma.collaborationRequest.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  it("should get collaboration request details by ID", async () => {
    const findUniqueMock = prisma.collaborationRequest.findUnique as jest.Mock;
    findUniqueMock.mockResolvedValue(mockRequest);
    await getCollaborationRequestDetailsById(1);
    expect(prisma.collaborationRequest.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  describe("updateCollaborationRequestById", () => {
    it("should update a collaboration request with a single field", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, practiceTitle: "New Title" });
        await updateCollaborationRequestById({ id: 1, practiceTitle: "New Title" });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { practiceTitle: "New Title" },
        })
        );
    });

    it("should update a collaboration request with multiple fields", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, practiceTitle: "New Title", practiceSummary: "New Summary" });
        await updateCollaborationRequestById({ id: 1, practiceTitle: "New Title", practiceSummary: "New Summary" });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { practiceTitle: "New Title", practiceSummary: "New Summary" },
        })
        );
    });

    it("should not include undefined fields in the update", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue(mockRequest);
        await updateCollaborationRequestById({ id: 1, practiceTitle: undefined });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: {},
        })
        );
    });

    it("should handle null fields", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, practiceExamples: null });
        await updateCollaborationRequestById({ id: 1, practiceExamples: null });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { practiceExamples: null },
        })
        );
    });
  });

  describe("updateCollaborationRequestStatusById", () => {
    it("should update status with a single field", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, status: "APPROVED" });
        await updateCollaborationRequestStatusById({ id: 1, status: "APPROVED" });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { status: "APPROVED" },
        })
        );
    });

    it("should update status with multiple fields", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, status: "REJECTED", rejectionReason: "Bad" });
        await updateCollaborationRequestStatusById({ id: 1, status: "REJECTED", rejectionReason: "Bad" });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { status: "REJECTED", rejectionReason: "Bad" },
        })
        );
    });

    it("should not include undefined status fields in the update", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue(mockRequest);
        await updateCollaborationRequestStatusById({ id: 1, status: undefined });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: {},
        })
        );
    });

    it("should handle null status fields", async () => {
        const updateMock = prisma.collaborationRequest.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockRequest, reviewerUsername: null });
        await updateCollaborationRequestStatusById({ id: 1, reviewerUsername: null });
        expect(prisma.collaborationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: 1 },
            data: { reviewerUsername: null },
        })
        );
    });
  });

  it("should create a collaboration request message", async () => {
    const message = {
      requestId: 1,
      authorUsername: "user",
      authorRole: "USER",
      type: "MESSAGE",
      message: "Hello",
    };
    const createMock = prisma.collaborationRequestMessage.create as jest.Mock;
    createMock.mockResolvedValue(message);
    await createCollaborationRequestMessage(message);
    expect(prisma.collaborationRequestMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining(message) })
    );
  });

  it("should mark a message as read", async () => {
    const updateMock = prisma.collaborationRequestMessage.update as jest.Mock;
    updateMock.mockResolvedValue({ id: 1, readAt: new Date() });
    await markCollaborationRequestMessageAsRead(1);
    expect(prisma.collaborationRequestMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { readAt: expect.any(Date) },
      })
    );
  });

  it("should delete a collaboration request by ID", async () => {
    const deleteMock = prisma.collaborationRequest.delete as jest.Mock;
    deleteMock.mockResolvedValue(undefined);
    await deleteCollaborationRequestById(1);
    expect(prisma.collaborationRequest.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("should list requests by requester username", async () => {
    const findManyMock = prisma.collaborationRequest.findMany as jest.Mock;
    findManyMock.mockResolvedValue([mockRequest]);
    await listCollaborationRequestsByRequesterUsername("testuser");
    expect(prisma.collaborationRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { requesterUsername: "testuser" } })
    );
  });

  it("should list all collaboration requests", async () => {
    const findManyMock = prisma.collaborationRequest.findMany as jest.Mock;
    findManyMock.mockResolvedValue([mockRequest]);
    await listAllCollaborationRequests();
    expect(prisma.collaborationRequest.findMany).toHaveBeenCalled();
  });

  describe("findExistingJob", () => {
    it("should find an existing analysis job", async () => {
      const findUniqueMock = prisma.analysisJob.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue({ status: "PENDING" });
      await findExistingJob(1);
      expect(prisma.analysisJob.findUnique).toHaveBeenCalledWith({
        where: { requestId: 1 },
        select: { status: true, result: true, error: true },
      });
    });
  });

  describe("setAnalysisStep", () => {
    it.each([
      [1, AnalysisStep.FIRST_PROMPT],
      [2, AnalysisStep.SECOND_PROMPT],
      [3, AnalysisStep.THIRD_PROMPT],
      [4, AnalysisStep.FOURTH_PROMPT],
      [5, AnalysisStep.FINISHED],
      ["end", AnalysisStep.FINISHED],
    ])("should set analysis step for step %s", async (step, expected) => {
      const updateMock = prisma.analysisJob.update as jest.Mock;
      await setAnalysisStep(1, step);
      expect(updateMock).toHaveBeenCalledWith({
        where: { requestId: 1 },
        data: { step: expected },
      });
    });

    it("should throw an error for an unsupported step", async () => {
        await expect(setAnalysisStep(1, 99)).rejects.toThrow("Unsupported analysis step: 99");
    });
  });
});
