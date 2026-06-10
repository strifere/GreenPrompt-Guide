import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MyRequestsPage from "@/app/collaboration/my-requests/[username]/page";
import { getSession } from "@/lib/session";
import { listCollaborationRequestsByRequesterUsername } from "@/domain/collaboration-request-repository";
import { redirect } from "next/navigation";

vi.mock("@/lib/session");
vi.mock("@/domain/collaboration-request-repository");
vi.mock("next/navigation", () => ({
    redirect: vi.fn(() => { throw new Error("Redirected"); }),
}));

describe("MyRequestsPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should redirect to /login if user is not authenticated", async () => {
        (getSession as vi.Mock).mockResolvedValue(null);
        const props = { params: { username: "testuser" } };
        
        await expect(MyRequestsPage(props)).rejects.toThrow("Redirected");
        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to the logged-in user's page if trying to access another user's page", async () => {
        (getSession as vi.Mock).mockResolvedValue("currentUser");
        const props = { params: { username: "anotherUser" } };
        
        await expect(MyRequestsPage(props)).rejects.toThrow("Redirected");
        expect(redirect).toHaveBeenCalledWith("/collaboration/my-requests/currentUser");
    });

    it("should display the list of requests for the authenticated user", async () => {
        const username = "testuser";
        const requests = [
            { id: 1, practiceTitle: "Request 1", practiceSummary: "Summary 1", status: "PENDING", createdAt: new Date(), updatedAt: new Date() },
            { id: 2, practiceTitle: "Request 2", practiceSummary: "Summary 2", status: "APPROVED", createdAt: new Date(), updatedAt: new Date() },
        ];
        (getSession as vi.Mock).mockResolvedValue(username);
        (listCollaborationRequestsByRequesterUsername as vi.Mock).mockResolvedValue(requests);
        const props = { params: { username } };

        const Page = await MyRequestsPage(props);
        render(Page);

        expect(screen.getByText("Request 1")).toBeInTheDocument();
        expect(screen.getByText("Summary 1")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("Request 2")).toBeInTheDocument();
        expect(screen.getByText("Summary 2")).toBeInTheDocument();
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.queryByText("No requests yet")).not.toBeInTheDocument();
    });

    it("should display an empty state message if there are no requests", async () => {
        const username = "testuser";
        (getSession as vi.Mock).mockResolvedValue(username);
        (listCollaborationRequestsByRequesterUsername as vi.Mock).mockResolvedValue([]);
        const props = { params: { username } };

        const Page = await MyRequestsPage(props);
        render(Page);

        expect(screen.getByText("No requests yet")).toBeInTheDocument();
        expect(screen.getByText("You have not submitted any collaboration requests yet.")).toBeInTheDocument();
    });
});
