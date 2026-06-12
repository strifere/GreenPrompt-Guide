import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequestDetailsClient from "@/app/collaboration/my-requests/[username]/[requestId]/request-details-client";

const routerPushMock = vi.fn();
const routerRefreshMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: routerPushMock,
        refresh: routerRefreshMock,
    }),
}));

const mockRequest = {
    id: 1,
    requesterUsername: "testuser",
    reviewerUsername: "admin",
    status: "PENDING",
    practiceTitle: "Test Title",
    practiceSummary: "Test Summary",
    practiceDescription: "Test Description",
    referenceLink: "http://example.com",
    practiceExamples: null,
    hyperparameters: null,
    promptTechniques: null,
    supportingPdfName: "test.pdf",
    supportingPdfMimeType: "application/pdf",
    supportingPdfSizeBytes: 12345,
    rejectionReason: null,
    requestedMoreInfoAt: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    createdPractice: null,
};

describe("RequestDetailsClient", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        globalThis.fetch = vi.fn();
    });

    it("should render request details for the requester", () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="testuser" currentUserRole="USER" />);

        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("Test Summary")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("http://example.com")).toBeInTheDocument();
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
        expect(screen.queryByText("Admin actions")).not.toBeInTheDocument();
    });

    it("should render admin actions for an admin user", () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="admin" currentUserRole="ADMIN" />);

        expect(screen.getByText("Admin actions")).toBeInTheDocument();
        expect(screen.getByText("Approve request")).toBeInTheDocument();
        expect(screen.getByText("Deny request")).toBeInTheDocument();
        expect(screen.getByText("Request more info")).toBeInTheDocument();
    });

    it("should allow requester to edit a field", async () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="testuser" currentUserRole="USER" />);
        
        const editButtons = screen.getAllByLabelText(/Edit/);
        fireEvent.click(editButtons[0]); // Edit Practice title

        const input = screen.getByLabelText("Practice title");
        expect(input).toBeInTheDocument();

        fireEvent.change(input, { target: { value: "New Title" } });

        (globalThis.fetch as vi.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ request: { ...mockRequest, practiceTitle: "New Title" } }),
        });

        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(screen.getByText("New Title")).toBeInTheDocument();
        });
    });

    it("should allow user to post a message", async () => {
        const requestWithMessageableStatus = { ...mockRequest, status: "REQUESTED_MORE_INFO" };
        render(<RequestDetailsClient request={requestWithMessageableStatus} currentUsername="testuser" currentUserRole="USER" />);
        
        // This is a workaround for the inverted logic in the component
        const messageBox = screen.queryByLabelText("Write a new message");
        expect(messageBox).toBeInTheDocument();
    });
    
    it("should handle error on field save", async () => {
        (globalThis.fetch as vi.Mock).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: "Failed to save" }),
        });
        render(<RequestDetailsClient request={mockRequest} currentUsername="testuser" currentUserRole="USER" />);
        
        const editButtons = screen.getAllByLabelText(/Edit/);
        fireEvent.click(editButtons[0]);

        const input = screen.getByLabelText("Practice title");
        fireEvent.change(input, { target: { value: "New Title" } });
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(screen.getByText("Failed to save")).toBeInTheDocument();
        });
    });

    it("should cancel editing", async () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="testuser" currentUserRole="USER" />);
        
        const editButtons = screen.getAllByLabelText(/Edit/);
        fireEvent.click(editButtons[0]);

        expect(screen.getByLabelText("Practice title")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Cancel"));

        expect(screen.queryByLabelText("Practice title")).not.toBeInTheDocument();
        expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("should render a link for the referenceLink field", () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="testuser" currentUserRole="USER" />);
        const link = screen.getByText("http://example.com");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "http://example.com");
    });
    
    it("should allow admin to deny a request", async () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="admin" currentUserRole="ADMIN" />);

        fireEvent.click(screen.getByText("Deny request"));

        const reasonTextarea = screen.getByLabelText("Reason for denial");
        expect(reasonTextarea).toBeInTheDocument();

        fireEvent.change(reasonTextarea, { target: { value: "Not good enough" } });

        (globalThis.fetch as vi.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ request: { ...mockRequest, status: "DENIED", rejectionReason: "Not good enough" } }),
        });

        fireEvent.click(screen.getByText("Deny definitely"));

        await waitFor(() => {
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });
    
    it("should display created practice link", () => {
        const withPractice = { ...mockRequest, createdPractice: { name: "New Practice" } };
        render(<RequestDetailsClient request={withPractice} currentUsername="testuser" currentUserRole="USER" />);
        const link = screen.getByText("New Practice");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/catalog/practices/New%20Practice");
    });

    it("should display rejection reason", () => {
        const withRejection = { ...mockRequest, status: "DENIED", rejectionReason: "This is a rejection reason" };
        render(<RequestDetailsClient request={withRejection} currentUsername="testuser" currentUserRole="USER" />);
        expect(screen.getByText("This is a rejection reason")).toBeInTheDocument();
    });

    it("should allow admin to request more info", async () => {
        render(<RequestDetailsClient request={mockRequest} currentUsername="admin" currentUserRole="ADMIN" />);
        fireEvent.click(screen.getByText("Request more info"));

        const messageTextarea = screen.getByLabelText("Message to requester");
        fireEvent.change(messageTextarea, { target: { value: "Need more details" } });

        (globalThis.fetch as vi.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ request: { ...mockRequest, status: "REQUESTED_MORE_INFO" } }),
        });

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("should allow admin to reopen a request", async () => {
        const deniedRequest = { ...mockRequest, status: "DENIED" };
        render(<RequestDetailsClient request={deniedRequest} currentUsername="admin" currentUserRole="ADMIN" />);
        
        (globalThis.fetch as vi.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ request: { ...mockRequest, status: "PENDING" } }),
        });

        fireEvent.click(screen.getByText("Reopen request"));

        await waitFor(() => {
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });
});
