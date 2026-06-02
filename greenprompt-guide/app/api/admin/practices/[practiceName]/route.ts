import { NextRequest, NextResponse } from "next/server";
import { deletePractice, getPracticeByName } from "@/domain/practice-repository";
import {
	normalizeAdminPracticeUpdatePayload,
	type AdminPracticeUpdatePayload,
	updateAdminPractice,
} from "@/lib/admin-practice-creation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ practiceName: string }> | { practiceName: string };
};

function decodePracticeName(practiceName: string) {
	try {
		return decodeURIComponent(practiceName);
	} catch {
		return practiceName;
	}
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const adminCheck = await requireAdmin();

		if (!adminCheck.ok) {
			return adminCheck.response;
		}

		const { practiceName } = await Promise.resolve(context.params);
		const decodedPracticeName = decodePracticeName(practiceName);
		const payload = normalizeAdminPracticeUpdatePayload((await request.json()) as AdminPracticeUpdatePayload);

		if ("error" in payload) {
			return NextResponse.json({ error: payload.error }, { status: 400 });
		}

		const practice = await prisma.$transaction((tx) =>
			updateAdminPractice(tx, decodedPracticeName, payload.value),
		);

		return NextResponse.json({ practice }, { status: 200 });
	} catch (error) {
		if (error instanceof Error && error.message === "PRACTICE_NOT_FOUND") {
			return NextResponse.json({ error: "Practice not found" }, { status: 404 });
		}

		if (error instanceof Error && error.message === "PRACTICE_NAME_EXISTS") {
			return NextResponse.json({ error: "A practice with that title already exists" }, { status: 409 });
		}

		console.error("Practice update error:", error);
		return NextResponse.json({ error: "An error occurred while updating the practice" }, { status: 500 });
	}
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { practiceName } = await Promise.resolve(context.params);
    const decodedPracticeName = decodePracticeName(practiceName);
    const practice = await getPracticeByName(decodedPracticeName);

    if (!practice) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 });
    }

    await deletePractice(decodedPracticeName);

    return NextResponse.json({ message: "Practice deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Practice deletion error:", error);
    return NextResponse.json({ error: "An error occurred while deleting the practice" }, { status: 500 });
  }
}
