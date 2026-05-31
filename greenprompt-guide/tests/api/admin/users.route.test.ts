import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const requireAdminMock = vi.hoisted(() => vi.fn());
const getUserByUsernameMock = vi.hoisted(() => vi.fn());
const deleteUserByUsernameMock = vi.hoisted(() => vi.fn());
const updateUserBanStatusMock = vi.hoisted(() => vi.fn());
const emailServiceMock = vi.hoisted(() => ({
  sendUserDeletionNotice: vi.fn(),
  sendUserBanNotice: vi.fn(),
  sendUserUnbanNotice: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/domain/user-repository", () => ({
  getUserByUsername: getUserByUsernameMock,
  deleteUserByUsername: deleteUserByUsernameMock,
  updateUserBanStatus: updateUserBanStatusMock,
}));

vi.mock("@/lib/email-service", () => ({
  emailService: emailServiceMock,
}));

import { DELETE, PATCH } from "@/app/api/admin/users/[username]/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/admin/users/:username", () => {
  it("deletes a user after emailing the reason", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: false,
    });
    emailServiceMock.sendUserDeletionNotice.mockResolvedValueOnce(true);
    deleteUserByUsernameMock.mockResolvedValueOnce(undefined);

    const response = await DELETE(
      createJsonRequest("/api/admin/users/ana", { reason: "Spam account" }),
      { params: { username: "ana" } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "User deleted successfully" });
    expect(emailServiceMock.sendUserDeletionNotice).toHaveBeenCalledWith("ana@example.com", "Spam account");
    expect(deleteUserByUsernameMock).toHaveBeenCalledWith("ana");
  });

  it("requires a deletion reason", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: false,
    });

    const response = await DELETE(
      createJsonRequest("/api/admin/users/ana", {}),
      { params: { username: "ana" } },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Deletion reason is required" });
    expect(emailServiceMock.sendUserDeletionNotice).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/users/:username", () => {
  it("bans a user and emails the reason", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: false,
    });
    emailServiceMock.sendUserBanNotice.mockResolvedValueOnce(true);
    updateUserBanStatusMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: true,
    });

    const response = await PATCH(
      createJsonRequest("/api/admin/users/ana", { action: "ban", reason: "Repeated abuse" }),
      { params: { username: "ana" } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "User banned successfully" });
    expect(emailServiceMock.sendUserBanNotice).toHaveBeenCalledWith("ana@example.com", "Repeated abuse");
    expect(updateUserBanStatusMock).toHaveBeenCalledWith({ username: "ana", banned: true });
  });

  it("unbans a user and emails the restore notice", async () => {
    requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
    getUserByUsernameMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: true,
    });
    emailServiceMock.sendUserUnbanNotice.mockResolvedValueOnce(true);
    updateUserBanStatusMock.mockResolvedValueOnce({
      username: "ana",
      email: "ana@example.com",
      role: "USER",
      banned: false,
    });

    const response = await PATCH(
      createJsonRequest("/api/admin/users/ana", { action: "unban" }),
      { params: { username: "ana" } },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "User unbanned successfully" });
    expect(emailServiceMock.sendUserUnbanNotice).toHaveBeenCalledWith("ana@example.com");
    expect(updateUserBanStatusMock).toHaveBeenCalledWith({ username: "ana", banned: false });
  });
});