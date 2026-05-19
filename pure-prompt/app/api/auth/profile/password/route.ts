import { NextRequest, NextResponse } from "next/server";
import { hashPassword, isValidPassword, verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getUserByUsernameWithPassword, updatePassword } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const currentUsername = await getSession();

    if (!currentUsername) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const nextPassword = typeof body.password === "string" ? body.password : "";
    const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";

    if (!currentPassword || !nextPassword || !passwordConfirm) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (nextPassword !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (!isValidPassword(nextPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await getUserByUsernameWithPassword(currentUsername);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    // Prevent users from reusing their current password. We can safely compare
    // the plaintext candidate against the stored hash using `verifyPassword`.
    const isSameAsCurrent = await verifyPassword(nextPassword, user.password);

    if (isSameAsCurrent) {
      return NextResponse.json({ error: "New password must be different from the current password" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(nextPassword);

    await updatePassword({ username: currentUsername, hashedPassword });

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: "An error occurred while updating the password" }, { status: 500 });
  }
}