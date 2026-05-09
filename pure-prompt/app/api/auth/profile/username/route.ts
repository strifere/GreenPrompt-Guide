import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie, getSession } from "@/lib/session";
import {
  getUserByUsername,
  isUsernameAvailable,
  updateUsername,
} from "@/domain/user-repository";

export async function POST(request: NextRequest) {
  try {
    const currentUsername = await getSession();

    if (!currentUsername) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const nextUsername = typeof body.username === "string" ? body.username.trim() : "";

    if (!nextUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (nextUsername === currentUsername) {
      const user = await getUserByUsername(currentUsername);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Username unchanged", user }, { status: 200 });
    }

    const available = await isUsernameAvailable(nextUsername);

    if (!available) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const updatedUser = await updateUsername({ currentUsername, newUsername: nextUsername });

    await createSessionCookie(updatedUser.username);

    return NextResponse.json(
      { message: "Username updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Username update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the username" },
      { status: 500 }
    );
  }
}