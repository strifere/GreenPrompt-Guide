import { NextRequest, NextResponse } from "next/server";
import { hashPassword, isValidEmail, isValidPassword } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";
import { isUsernameAvailable, isEmailAvailable, createUser } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, passwordConfirm } = body;

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usernameAvailable = await isUsernameAvailable(username);

    if (!usernameAvailable) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const emailAvailable = await isEmailAvailable(email);

    if (!emailAvailable) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    const user = await createUser({ username, email, password: hashedPassword });

    // Create session
    await createSessionCookie(user.username);

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { username: user.username, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
