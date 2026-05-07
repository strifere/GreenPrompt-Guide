import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;
    const loginIdentifier = typeof identifier === "string" ? identifier.trim() : "";

    // Validation
    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Username or email and password are required" },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: loginIdentifier }, { email: loginIdentifier }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 401 }
      );
    }

    // Create session
    await createSessionCookie(user.username);

    return NextResponse.json(
      {
        message: "Login successful",
        user: { username: user.username, email: user.email },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
