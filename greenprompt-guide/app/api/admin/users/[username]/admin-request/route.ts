import { NextResponse } from "next/server";
import {
  searchExistingAdminRequest,
} from "@/domain/user-repository";

type RouteContext = {
  params: Promise<{ username: string }> | { username: string };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await Promise.resolve(context.params);

    if (!username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const existingRequest = await searchExistingAdminRequest(username);
    return NextResponse.json({ requested: !!existingRequest, message: existingRequest?.request }, { status: 200 });
  } catch (error) {
    console.error("Admin request lookup error:", error);
    return NextResponse.json(
      { error: "An error occurred while checking admin request status" },
      { status: 500 }
    );
  }
}