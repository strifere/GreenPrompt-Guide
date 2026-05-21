import { NextRequest, NextResponse } from "next/server";
import { passwordRecoveryStore } from "@/lib/password-recovery";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Verify code and invalidate it immediately on success
    const resetToken = passwordRecoveryStore.verifyCode(code, email);

    if (!resetToken) {
      return NextResponse.json(
        { error: "The introduced code isn't correct. Please try again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Code verified successfully", resetToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password recovery verify error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
