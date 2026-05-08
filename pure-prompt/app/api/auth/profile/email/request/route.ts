import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { emailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const currentUsername = await getSession();

    if (!currentUsername) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const nextEmail = typeof body.email === "string" ? body.email.trim() : "";

    if (!nextEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(nextEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: { email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.email === nextEmail) {
      return NextResponse.json(
        { error: "This email is already associated with your account" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: nextEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const code = passwordRecoveryStore.createToken(nextEmail);
    const emailSent = await emailService.sendEmailChangeVerificationCode(nextEmail, code);

    if (!emailSent) {
      return NextResponse.json(
        { error: "The current email isn't valid. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification code sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email change request error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}