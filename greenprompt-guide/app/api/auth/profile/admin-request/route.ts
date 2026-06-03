import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  insertAdminRequest,
  searchExistingAdminRequest,
} from "@/domain/user-repository";

export async function GET() {
  try {
    const username = await getSession();

    if (!username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const existingRequest = await searchExistingAdminRequest(username);
    return NextResponse.json({ requested: !!existingRequest }, { status: 200 });
  } catch (error) {
    console.error("Admin request lookup error:", error);
    return NextResponse.json(
      { error: "An error occurred while checking admin request status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUsername = await getSession();

    if (!currentUsername) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const adminRequest = typeof body.request === "string" ? body.request.trim() : "";

    if (!adminRequest) {
      return NextResponse.json({ error: "Request is required" }, { status: 400 });
    }

    const existingRequest = await searchExistingAdminRequest(currentUsername);
    if (existingRequest) {
      return NextResponse.json(
        { error: "You have already submitted an admin request" },
        { status: 400 }
      );
    }

    await insertAdminRequest({ currentUsername, request: adminRequest });

    return NextResponse.json(
      { message: "Admin request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin request error:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting the admin request" },
      { status: 500 }
    );
  }
}