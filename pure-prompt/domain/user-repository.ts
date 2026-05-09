import { prisma } from "@/lib/prisma";

export type UserPublic = {
  username: string;
  email: string;
  role: string | null;
};

export type UserWithPassword = UserPublic & {
  password: string;
};

// ============================================
// USER LOOKUP
// ============================================

export async function getUserByUsername(
  username: string
): Promise<UserPublic | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { username: true, email: true, role: true },
  });
  return user;
}

export async function getUserEmailByUsername(username: string): Promise<{ email: string } | null> {
  return (await prisma.user.findUnique({ where: { username }, select: { email: true } })) as { email: string } | null;
}

export async function getUserByUsernameWithPassword(
  username: string
): Promise<UserWithPassword | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user;
}

export async function getUserByIdentifier(identifier: string): Promise<UserWithPassword | null> {
  // Use findFirst with OR for identifier lookups (matches original login implementation)
  return (await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } })) as UserWithPassword | null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { username }, select: { username: true } });
  return !user;
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email }, select: { email: true } });
  return !user;
}

// ============================================
// USER CREATION
// ============================================

export type CreateUserInput = {
  username: string;
  email: string;
  password: string; // hashed
};

export async function createUser(input: CreateUserInput): Promise<UserPublic> {
  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: input.password,
      },
    });
    return user as UserPublic;
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      throw new Error("User already exists");
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  return (await prisma.user.findUnique({ where: { email } })) as UserWithPassword | null;
}

// ============================================
// USER UPDATES
// ============================================

export type UpdateUsernameInput = {
  currentUsername: string;
  newUsername: string;
};

export async function updateUsername(input: UpdateUsernameInput): Promise<{ username: string; email: string }> {
  const updated = await prisma.user.update({
    where: { username: input.currentUsername },
    data: { username: input.newUsername },
    select: { username: true, email: true },
  });
  return updated;
}

export type UpdatePasswordInput = {
  username: string;
  hashedPassword: string;
};

export async function updatePassword(input: UpdatePasswordInput): Promise<void> {
  await prisma.user.update({ where: { username: input.username }, data: { password: input.hashedPassword } });
}

export type UpdatePasswordByEmailInput = {
  email: string;
  hashedPassword: string;
};

export async function updatePasswordByEmail(input: UpdatePasswordByEmailInput): Promise<void> {
  await prisma.user.update({ where: { email: input.email }, data: { password: input.hashedPassword } });
}

export type UpdateEmailInput = {
  username: string;
  newEmail: string;
};

export async function updateEmail(input: UpdateEmailInput): Promise<UserPublic> {
  const updated = await prisma.user.update({ where: { username: input.username }, data: { email: input.newEmail } });
  return updated;
}

export async function deleteUser(username: string): Promise<void> {
  await prisma.user.delete({ where: { username } });
}
