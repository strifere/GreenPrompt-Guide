import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.promptTechnique.findUnique({
      where: { name },
      select: { name: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A prompt technique with that name already exists" },
        { status: 409 },
      );
    }

    const technique = await prisma.promptTechnique.create({
      data: {
        name,
        description,
        example: typeof body.example === "string" ? body.example.trim() || null : null,
      },
    });

    return NextResponse.json({ technique }, { status: 201 });
  } catch (error) {
    console.error("Prompt technique creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the prompt technique" },
      { status: 500 },
    );
  }
}
