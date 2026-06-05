import { describe, expect, it, vi, beforeEach } from "vitest";
import AdminLayout from "@/app/admin/layout";

const redirectMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: getUserByUsernameMock,
}));

vi.mock("@/app/admin/admin-sidebar", () => ({
  AdminSidebar: () => <div data-testid="admin-sidebar">Admin Sidebar</div>,
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("redirects to home when no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    await AdminLayout({ children: <div>Content</div> });

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("redirects to home when user is not admin", async () => {
    getSessionMock.mockResolvedValueOnce("testuser");
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "testuser",
      role: "USER",
    });

    await AdminLayout({ children: <div>Content</div> });

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("redirects to home when user not found", async () => {
    getSessionMock.mockResolvedValueOnce("nonexistent");
    getUserByUsernameMock.mockResolvedValueOnce(null);

    await AdminLayout({ children: <div>Content</div> });

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("allows admin users to access the layout", async () => {
    getSessionMock.mockResolvedValueOnce("admin-user");
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "admin-user",
      role: "ADMIN",
    });

    const result = await AdminLayout({ children: <div>Admin Content</div> });

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
