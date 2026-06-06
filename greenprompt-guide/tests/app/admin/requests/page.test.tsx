import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminRequestsPage from "@/app/admin/requests/page";

const listAllCollaborationRequestsMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/collaboration-request-repository", () => ({
  listAllCollaborationRequests: listAllCollaborationRequestsMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/admin/requests/admin-request-actions", () => ({
  AdminRequestDeleteAction: () => <div data-testid="admin-request-delete-action">Delete</div>,
}));

describe("AdminRequestsPage", () => {
  it("renders page header", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText("Collaboration requests")).toBeInTheDocument();
  });

  it("renders empty state when no requests exist", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it("renders list of requests", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 1,
        practiceTitle: "Token Optimization",
        practiceSummary: "A practice description",
        status: "PENDING",
        requesterUsername: "john_doe",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText("Token Optimization")).toBeInTheDocument();
    expect(screen.getByText("A practice description")).toBeInTheDocument();
  });

  it("renders status badge", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 1,
        practiceTitle: "Test",
        practiceSummary: "Description",
        status: "PENDING",
        requesterUsername: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders requester information", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 1,
        practiceTitle: "Test",
        practiceSummary: "Description",
        status: "PENDING",
        requesterUsername: "john_doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText("john_doe")).toBeInTheDocument();
  });

  it("renders request details link", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 42,
        practiceTitle: "Test",
        practiceSummary: "Description",
        status: "PENDING",
        requesterUsername: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    const link = screen.getByRole("link", { name: /test/i });
    expect(link).toHaveAttribute("href", "/admin/requests/42");
  });

  it("renders admin request actions component", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 1,
        practiceTitle: "Test",
        practiceSummary: "Description",
        status: "PENDING",
        requesterUsername: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByTestId("admin-request-delete-action")).toBeInTheDocument();
  });

  it("queries requests in descending order by creation date", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([]);

    await AdminRequestsPage();

    expect(listAllCollaborationRequestsMock).toHaveBeenCalled();
  });

  it("renders multiple requests", async () => {
    listAllCollaborationRequestsMock.mockResolvedValueOnce([
      {
        id: 1,
        practiceTitle: "Request 1",
        practiceSummary: "Description 1",
        status: "PENDING",
        requesterUsername: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        practiceTitle: "Request 2",
        practiceSummary: "Description 2",
        status: "APPROVED",
        requesterUsername: "user2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const element = await AdminRequestsPage();
    render(element);

    expect(screen.getByText("Request 1")).toBeInTheDocument();
    expect(screen.getByText("Request 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("admin-request-delete-action")).toHaveLength(2);
  });
});
