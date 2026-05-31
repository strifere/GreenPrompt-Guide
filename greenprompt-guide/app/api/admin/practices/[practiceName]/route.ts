import { NextRequest, NextResponse } from "next/server";
import { deletePractice, getPracticeByName } from "@/domain/practice-repository";
import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ practiceName: string }> | { practiceName: string };
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { practiceName } = await Promise.resolve(context.params);
    const practice = await getPracticeByName(practiceName);

    if (!practice) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 });
    }

    await deletePractice(practiceName);

    return NextResponse.json({ message: "Practice deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Practice deletion error:", error);
    return NextResponse.json({ error: "An error occurred while deleting the practice" }, { status: 500 });
  }
}