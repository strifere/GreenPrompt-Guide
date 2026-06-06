import { prisma } from "@/lib/prisma";
import {
  getUserByUsername,
  getUserEmailByUsername,
  getUserByUsernameWithPassword,
  getUserByIdentifier,
  isUsernameAvailable,
  isEmailAvailable,
  createUser,
  getUserByEmail,
  listUsers,
  deleteUserByUsername,
  updateUserBanStatus,
  updateUsername,
  updatePassword,
  updatePasswordByEmail,
  updateEmail,
} from "@/domain/user-repository";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("user-repository", () => {
  const mockUser = {
    username: "testuser",
    email: "test@example.com",
    password: "hashedpassword",
    role: "USER",
    banned: false,
  };

  describe("User Lookup", () => {
    it("should get user by username", async () => {
      const findUniqueMock = prisma.user.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(mockUser);
      await getUserByUsername("testuser");
      expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { username: "testuser" } }));
    });

    it("should get user email by username", async () => {
        const findUniqueMock = prisma.user.findUnique as jest.Mock;
        findUniqueMock.mockResolvedValue({ email: "test@example.com" });
        await getUserEmailByUsername("testuser");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "testuser" }, select: { email: true } });
      });
  
      it("should get user with password by username", async () => {
        const findUniqueMock = prisma.user.findUnique as jest.Mock;
        findUniqueMock.mockResolvedValue(mockUser);
        await getUserByUsernameWithPassword("testuser");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "testuser" } });
      });

      it("should get user by identifier (username)", async () => {
        const findFirstMock = prisma.user.findFirst as jest.Mock;
        findFirstMock.mockResolvedValue(mockUser);
        await getUserByIdentifier("testuser");
        expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { OR: [{ username: "testuser" }, { email: "testuser" }] } });
      });

      it("should check if username is available", async () => {
        const findUniqueMock = prisma.user.findUnique as jest.Mock;
        findUniqueMock.mockResolvedValue(null);
        const available = await isUsernameAvailable("newuser");
        expect(available).toBe(true);
      });

      it("should check if email is available", async () => {
        const findUniqueMock = prisma.user.findUnique as jest.Mock;
        findUniqueMock.mockResolvedValue({ email: "new@example.com" });
        const available = await isEmailAvailable("new@example.com");
        expect(available).toBe(false);
      });

      it("should get user by email", async () => {
        const findUniqueMock = prisma.user.findUnique as jest.Mock;
        findUniqueMock.mockResolvedValue(mockUser);
        await getUserByEmail("test@example.com");
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
      });

      it("should list users", async () => {
        const findManyMock = prisma.user.findMany as jest.Mock;
        findManyMock.mockResolvedValue([mockUser]);
        await listUsers();
        expect(prisma.user.findMany).toHaveBeenCalled();
      });
  });

  describe("User Creation", () => {
    it("should create a user", async () => {
      const createMock = prisma.user.create as jest.Mock;
      createMock.mockResolvedValue(mockUser);
      await createUser({ username: "testuser", email: "test@example.com", password: "hashedpassword" });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("should throw error if user already exists", async () => {
        const createMock = prisma.user.create as jest.Mock;
        createMock.mockRejectedValue({ code: "P2002" });
        await expect(createUser({ username: "testuser", email: "test@example.com", password: "hashedpassword" })).rejects.toThrow("User already exists");
    });

    it("should re-throw other errors", async () => {
        const createMock = prisma.user.create as jest.Mock;
        const error = new Error("Some other error");
        createMock.mockRejectedValue(error);
        await expect(createUser({ username: "testuser", email: "test@example.com", password: "hashedpassword" })).rejects.toThrow("Some other error");
    });
  });

  describe("User Deletion", () => {
    it("should delete a user by username", async () => {
        const deleteMock = prisma.user.delete as jest.Mock;
        deleteMock.mockResolvedValue(undefined);
        await deleteUserByUsername("testuser");
        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { username: "testuser" } });
      });
  });

  describe("User Updates", () => {
    it("should update user ban status", async () => {
        const updateMock = prisma.user.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockUser, banned: true });
        await updateUserBanStatus({ username: "testuser", banned: true });
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { username: "testuser" }, data: { banned: true } }));
    });

    it("should update username", async () => {
        const updateMock = prisma.user.update as jest.Mock;
        updateMock.mockResolvedValue({ username: "newuser", email: "test@example.com" });
        await updateUsername({ currentUsername: "testuser", newUsername: "newuser" });
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { username: "testuser" }, data: { username: "newuser" } }));
    });

    it("should update password", async () => {
        const updateMock = prisma.user.update as jest.Mock;
        updateMock.mockResolvedValue(undefined);
        await updatePassword({ username: "testuser", hashedPassword: "newpassword" });
        expect(prisma.user.update).toHaveBeenCalledWith({ where: { username: "testuser" }, data: { password: "newpassword" } });
    });

    it("should update password by email", async () => {
        const updateMock = prisma.user.update as jest.Mock;
        updateMock.mockResolvedValue(undefined);
        await updatePasswordByEmail({ email: "test@example.com", hashedPassword: "newpassword" });
        expect(prisma.user.update).toHaveBeenCalledWith({ where: { email: "test@example.com" }, data: { password: "newpassword" } });
    });

    it("should update email", async () => {
        const updateMock = prisma.user.update as jest.Mock;
        updateMock.mockResolvedValue({ ...mockUser, email: "new@example.com" });
        await updateEmail({ username: "testuser", newEmail: "new@example.com" });
        expect(prisma.user.update).toHaveBeenCalledWith({ where: { username: "testuser" }, data: { email: "new@example.com" } });
    });
  });
});
