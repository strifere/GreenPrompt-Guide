// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";

vi.mock("@/lib/session");
vi.mock("@/domain/user-repository");

describe("lib/admin-auth", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("requireAdmin", () => {
        it("should return 401 if no session", async () => {
            (getSession as vi.Mock).mockResolvedValue(null);
            const result = await requireAdmin();
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.response.status).toBe(401);
            }
        });

        it("should return 403 if user is not an admin", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue({ username: "testuser", role: "USER" });
            const result = await requireAdmin();
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.response.status).toBe(403);
            }
        });

        it("should return ok for an admin user", async () => {
            const adminUser = { username: "admin", role: "ADMIN" };
            (getSession as vi.Mock).mockResolvedValue("admin");
            (getUserByUsername as vi.Mock).mockResolvedValue(adminUser);
            const result = await requireAdmin();
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.username).toBe("admin");
                expect(result.user).toEqual(adminUser);
            }
        });
        
        it("should return 403 if user does not exist", async () => {
            (getSession as vi.Mock).mockResolvedValue("testuser");
            (getUserByUsername as vi.Mock).mockResolvedValue(null);
            const result = await requireAdmin();
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.response.status).toBe(403);
            }
        });
    });
});
