import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const getSessionMock = vi.hoisted(() => vi.fn());
const clearSessionMock = vi.hoisted(() => vi.fn());
const verifyPasswordMock = vi.hoisted(() => vi.fn());
const repoMock = vi.hoisted(() => ({
	getUserByUsernameWithPassword: vi.fn(),
	deleteUserByUsername: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
	getSession: getSessionMock,
	clearSession: clearSessionMock,
}));

vi.mock("@/lib/auth", () => ({
	verifyPassword: verifyPasswordMock,
}));

vi.mock("@/domain/user-repository", () => repoMock);

import { POST } from "@/app/api/auth/profile/delete/route";

describe("POST /api/auth/profile/delete", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when user is not authenticated", async () => {
		getSessionMock.mockResolvedValueOnce(null);

		const response = await POST(createJsonRequest("/api/auth/profile/delete", {
			currentPassword: "oldpass123",
		}));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "Not authenticated" });
		expect(repoMock.getUserByUsernameWithPassword).not.toHaveBeenCalled();
	});

	it("returns 401 when the current password is incorrect", async () => {
		getSessionMock.mockResolvedValueOnce("victor");
		repoMock.getUserByUsernameWithPassword.mockResolvedValueOnce({
			username: "victor",
			email: "victor@example.com",
			role: "USER",
			password: "hashed-current",
		});
		verifyPasswordMock.mockResolvedValueOnce(false);

		const response = await POST(createJsonRequest("/api/auth/profile/delete", {
			currentPassword: "wrong-password",
		}));

		expect(verifyPasswordMock).toHaveBeenCalledWith("wrong-password", "hashed-current");
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "Current password is incorrect" });
		expect(repoMock.deleteUserByUsername).not.toHaveBeenCalled();
	});

	it("deletes the account and clears the session after validating the password", async () => {
		getSessionMock.mockResolvedValueOnce("victor");
		repoMock.getUserByUsernameWithPassword.mockResolvedValueOnce({
			username: "victor",
			email: "victor@example.com",
			role: "USER",
			password: "hashed-current",
		});
		verifyPasswordMock.mockResolvedValueOnce(true);
		repoMock.deleteUserByUsername.mockResolvedValueOnce(undefined);
		clearSessionMock.mockResolvedValueOnce(undefined);

		const response = await POST(createJsonRequest("/api/auth/profile/delete", {
			currentPassword: "oldpass123",
		}));

		expect(repoMock.deleteUserByUsername).toHaveBeenCalledWith("victor");
		expect(clearSessionMock).toHaveBeenCalled();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: "Account deleted successfully" });
	});
});