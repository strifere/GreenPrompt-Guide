import { NextRequest, NextResponse } from "next/server";
import {
	createAdminPractice,
	normalizeAdminPracticePayload,
	type AdminPracticePayload,
} from "@/lib/admin-practice-creation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		const adminCheck = await requireAdmin();

		if (!adminCheck.ok) {
			return adminCheck.response;
		}

		const payload = normalizeAdminPracticePayload((await request.json()) as AdminPracticePayload);

		if ("error" in payload) {
			return NextResponse.json({ error: payload.error }, { status: 400 });
		}

		const practice = await prisma.$transaction((tx) => createAdminPractice(tx, payload.value));

		return NextResponse.json({ practice }, { status: 201 });
	} catch (error) {
		console.error("Practice creation error:", error);
		return NextResponse.json({ error: `An error occurred while creating the practice: ${error}` }, { status: 500 });
	}
}
