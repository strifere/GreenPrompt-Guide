import { NextRequest, NextResponse } from "next/server";
import { isValidPassword, hashPassword } from "@/lib/auth";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { getUserByEmail, updatePasswordByEmail } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetToken, password, passwordConfirm } = body;

    // Validate input
    if (!resetToken || typeof resetToken !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!passwordConfirm || typeof passwordConfirm !== "string") {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "The passwords don't match. Please type them again." },
        { status: 400 }
      );
    }

    // Check password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const email = passwordRecoveryStore.getResetTokenEmail(resetToken);

    // Verify reset token is still valid
    if (!email) {
      return NextResponse.json(
        { error: "The recovery session is invalid or expired. Please request a new recovery code." },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await updatePasswordByEmail({
      email,
      hashedPassword,
    });

    // Consume the reset token to prevent reuse
    passwordRecoveryStore.consumeResetToken(resetToken);

    return NextResponse.json(
      { message: "Your password has been changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password recovery reset error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
