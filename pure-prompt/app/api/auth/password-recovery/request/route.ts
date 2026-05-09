import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/auth";
import { passwordRecoveryStore } from "@/lib/password-recovery";
import { emailService } from "@/lib/email-service";
import { getUserByEmail } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const user = await getUserByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { error: "The introduced email doesn't match the one registered in your account" },
        { status: 404 }
      );
    }

    // Generate recovery code
    const code = passwordRecoveryStore.createToken(email);

    // Send email with code
    const emailSent = await emailService.sendPasswordRecoveryCode(email, code);

    if (!emailSent) {
      return NextResponse.json(
        { error: "The current email isn't valid. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Recovery code sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password recovery request error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
