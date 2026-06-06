import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { secureTrim } from "@/lib/utils";
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

    // Collect and validate reference titles from the new multi-select field.
    // Fall back to legacy single `reference` string for backwards compatibility.
    const rawTitles: unknown = body.referenceTitles;
    const referenceTitles: string[] = Array.isArray(rawTitles)
      ? rawTitles.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
        : [secureTrim(body.reference)];

    // Verify all supplied references exist so the transaction won't fail silently.
    if (referenceTitles.length > 0) {
      const foundRefs = await prisma.reference.findMany({
        where: { title: { in: referenceTitles } },
        select: { title: true },
      });

      const foundTitles = new Set(foundRefs.map((r) => r.title));
      const missing = referenceTitles.filter((t) => !foundTitles.has(t));

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `References not found: ${missing.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const [technique] = await prisma.$transaction([
      prisma.promptTechnique.create({
        data: {
          name,
          description,
          example: typeof body.example === "string" ? body.example.trim() || null : null,
        },
      }),
      // Create one join-table row per reference.
      ...referenceTitles.map((referenceTitle) =>
        prisma.paperPromptTechnique.create({
          data: { promptTechniqueName: name, referenceTitle },
        }),
      ),
    ]);

    return NextResponse.json({ technique }, { status: 201 });
  } catch (error) {
    console.error("Prompt technique creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the prompt technique" },
      { status: 500 },
    );
  }
}
