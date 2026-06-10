import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequestDetailsPage from "@/app/collaboration/my-requests/[username]/[requestId]/page";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { getCollaborationRequestDetailsById } from "@/domain/collaboration-request-repository";
import { redirect, notFound } from "next/navigation";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");
vi.mock("@/domain/collaboration-request-repository");
vi.mock("next/navigation", () => ({
    redirect: vi.fn(() => { throw new Error("Redirected"); }),
    notFound: vi.fn(() => { throw new Error("NotFound"); }),
}));
vi.mock("@/app/collaboration/my-requests/[username]/[requestId]/request-details-client", () => ({
    default: vi.fn(() => <div>RequestDetailsClient</div>),
}));

describe("RequestDetailsPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const username = "testuser";
    const requestId = "1";
    const props = { params: { username, requestId } };

    it("should redirect to /login if user is not authenticated", async () => {
        (getSession as vi.Mock).mockResolvedValue(null);
        
        await expect(RequestDetailsPage(props)).rejects.toThrow("Redirected");
        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to /login if current user is not found", async () => {
        (getSession as vi.Mock).mockResolvedValue(username);
        (getUserByUsername as vi.Mock).mockResolvedValue(null);

        await expect(RequestDetailsPage(props)).rejects.toThrow("Redirected");
        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect if a non-admin user tries to access another user's request page", async () => {
        (getSession as vi.Mock).mockResolvedValue("anotherUser");
        (getUserByUsername as vi.Mock).mockResolvedValue({ username: "anotherUser", role: "USER" });
        
        await expect(RequestDetailsPage(props)).rejects.toThrow("Redirected");
        expect(redirect).toHaveBeenCalledWith("/collaboration/my-requests/anotherUser");
    });

    it("should call notFound for invalid requestId", async () => {
        (getSession as vi.Mock).mockResolvedValue(username);
        (getUserByUsername as vi.Mock).mockResolvedValue({ username, role: "USER" });
        const invalidProps = { params: { username, requestId: "abc" } };

        await expect(RequestDetailsPage(invalidProps)).rejects.toThrow("NotFound");
        expect(notFound).toHaveBeenCalled();
    });

    it("should call notFound if request is not found", async () => {
        (getSession as vi.Mock).mockResolvedValue(username);
        (getUserByUsername as vi.Mock).mockResolvedValue({ username, role: "USER" });
        (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue(null);

        await expect(RequestDetailsPage(props)).rejects.toThrow("NotFound");
        expect(notFound).toHaveBeenCalled();
    });

    it("should call notFound if user tries to access a request that is not theirs", async () => {
        (getSession as vi.Mock).mockResolvedValue(username);
        (getUserByUsername as vi.Mock).mockResolvedValue({ username, role: "USER" });
        (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue({ id: 1, requesterUsername: "anotherUser" });

        await expect(RequestDetailsPage(props)).rejects.toThrow("NotFound");
        expect(notFound).toHaveBeenCalled();
    });

    it("should render RequestDetailsClient for authenticated user", async () => {
        const requestDetails = {
            id: 1,
            requesterUsername: username,
            practiceTitle: "Title",
            status: "PENDING",
            messages: [],
            reviewerNotes: "some notes"
        };
        (getSession as vi.Mock).mockResolvedValue(username);
        (getUserByUsername as vi.Mock).mockResolvedValue({ username, role: "USER" });
        (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue(requestDetails);

        const Page = await RequestDetailsPage(props);
        render(Page);
        
        expect(screen.getByText("RequestDetailsClient")).toBeInTheDocument();
    });
    
    it("should allow admin to view any request", async () => {
        const adminUser = "admin";
        const requestDetails = {
            id: 1,
            requesterUsername: username,
            practiceTitle: "Title",
            status: "PENDING",
            messages: []
        };
        (getSession as vi.Mock).mockResolvedValue(adminUser);
        (getUserByUsername as vi.Mock).mockResolvedValue({ username: adminUser, role: "ADMIN" });
        (getCollaborationRequestDetailsById as vi.Mock).mockResolvedValue(requestDetails);

        const Page = await RequestDetailsPage(props);
        render(Page);
        
        expect(screen.getByText("RequestDetailsClient")).toBeInTheDocument();
        expect(redirect).not.toHaveBeenCalled();
        expect(notFound).not.toHaveBeenCalled();
    });
});
