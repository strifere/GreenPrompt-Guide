import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    await clearSession();

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
