import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, isValidPassword } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { emailVerificationStore } from "@/lib/email-verification";
import { isEmailAvailable, isUsernameAvailable } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, passwordConfirm } = body;

    if (!username || !email || !password || !passwordConfirm) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const usernameAvailable = await isUsernameAvailable(username);

    if (!usernameAvailable) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const emailAvailable = await isEmailAvailable(email);

    if (!emailAvailable) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const verificationCode = emailVerificationStore.createCode(email);
    const emailSent = await emailService.sendSignupVerificationCode(email, verificationCode);

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
    console.error("Signup verification request error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}