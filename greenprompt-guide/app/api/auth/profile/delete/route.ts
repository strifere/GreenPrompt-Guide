import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { clearSession, getSession } from "@/lib/session";
import { deleteUserByUsername, getUserByUsernameWithPassword } from "@/domain/user-repository";

export async function POST(request: NextRequest) {
	try {
		const currentUsername = await getSession();

		if (!currentUsername) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = await request.json();
		const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

		if (!currentPassword) {
			return NextResponse.json({ error: "Current password is required" }, { status: 400 });
		}

		const user = await getUserByUsernameWithPassword(currentUsername);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);

		if (!isCurrentPasswordValid) {
			return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
		}

		await deleteUserByUsername(currentUsername);
		await clearSession();

		return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
	} catch (error) {
		console.error("Account deletion error:", error);
		return NextResponse.json({ error: "An error occurred while deleting the account" }, { status: 500 });
	}
}