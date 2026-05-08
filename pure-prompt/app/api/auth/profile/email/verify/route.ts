import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { passwordRecoveryStore } from "@/lib/password-recovery";

export async function POST(request: NextRequest) {
  try {
    const currentUsername = await getSession();

    if (!currentUsername) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const nextEmail = typeof body.email === "string" ? body.email.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!nextEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(nextEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const resetToken = passwordRecoveryStore.verifyCode(code, nextEmail);

    if (!resetToken) {
      return NextResponse.json(
        { error: "The introduced code isn't correct. Please try again." },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: { email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
    });

    if (existingUser && existingUser.username !== currentUsername) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    await prisma.user.update({
      where: { username: currentUsername },
      data: { email: nextEmail },
    });

    passwordRecoveryStore.consumeResetToken(resetToken);

    return NextResponse.json(
      { message: "Email updated successfully", user: { email: nextEmail } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email change verify error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}