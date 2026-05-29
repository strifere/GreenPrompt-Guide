import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminUsersPage from "@/app/admin/users/page";

const listUsersMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/user-repository", () => ({
  listUsers: listUsersMock,
}));

describe("Admin users page", () => {
  it("renders role labels and omits moderation buttons for admin users", async () => {
    listUsersMock.mockResolvedValueOnce([
      {
        username: "victor",
        email: "victor@example.com",
        role: "ADMIN",
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      },
      {
        username: "ana",
        email: "ana@example.com",
        role: "USER",
        createdAt: new Date("2026-05-02T00:00:00.000Z"),
        updatedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
    ] as any);

    const element = await AdminUsersPage();
    render(element);

    expect(screen.getByRole("heading", { name: /all users/i })).toBeInTheDocument();
    expect(screen.getByText("Admin user")).toBeInTheDocument();
    expect(screen.getByText("Standard user")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ban/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByText(/protected admin account/i)).toBeInTheDocument();
  });
});