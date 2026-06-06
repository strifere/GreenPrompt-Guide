import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_TACTICS = new Set(["GREEN_PRACTICE", "RED_PRACTICE"]);

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;
    const tactic = typeof body.tactic === "string" ? body.tactic.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!tactic || !VALID_TACTICS.has(tactic)) {
      return NextResponse.json(
        { error: "Tactic must be GREEN_PRACTICE or RED_PRACTICE" },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findUnique({
      where: { name },
      select: { name: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with that name already exists" },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        tactic: tactic as "GREEN_PRACTICE" | "RED_PRACTICE",
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the category" },
      { status: 500 },
    );
  }
}
