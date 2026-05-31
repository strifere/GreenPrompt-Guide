import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";
import {
  deleteUserByUsername,
  getUserByUsername,
  updateUserBanStatus,
} from "@/domain/user-repository";
import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ username: string }> | { username: string };
};

function getReason(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const reason = (body as { reason?: unknown }).reason;

  return typeof reason === "string" ? reason.trim() : "";
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { username } = await Promise.resolve(context.params);
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = getReason(body);

    if (!reason) {
      return NextResponse.json({ error: "Deletion reason is required" }, { status: 400 });
    }

    const emailSent = await emailService.sendUserDeletionNotice(user.email, reason);

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to notify the user" }, { status: 502 });
    }

    await deleteUserByUsername(username);

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "An error occurred while deleting the user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { username } = await Promise.resolve(context.params);
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body === "object" && body !== null && typeof (body as { action?: unknown }).action === "string"
      ? ((body as { action: string }).action)
      : "";

    if (action === "ban") {
      const reason = getReason(body);

      if (!reason) {
        return NextResponse.json({ error: "Ban reason is required" }, { status: 400 });
      }

      const emailSent = await emailService.sendUserBanNotice(user.email, reason);

      if (!emailSent) {
        return NextResponse.json({ error: "Failed to notify the user" }, { status: 502 });
      }

      await updateUserBanStatus({ username, banned: true });

      return NextResponse.json({ message: "User banned successfully" }, { status: 200 });
    }

    if (action === "unban") {
      const emailSent = await emailService.sendUserUnbanNotice(user.email);

      if (!emailSent) {
        return NextResponse.json({ error: "Failed to notify the user" }, { status: 502 });
      }

      await updateUserBanStatus({ username, banned: false });

      return NextResponse.json({ message: "User unbanned successfully" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
  } catch (error) {
    console.error("User moderation error:", error);
    return NextResponse.json({ error: "An error occurred while updating the user" }, { status: 500 });
  }
}