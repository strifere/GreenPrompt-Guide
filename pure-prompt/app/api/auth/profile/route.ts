import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";

export async function GET() {
  try {
    const username = await getSession();

    if (!username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Profile lookup error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}