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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const authors = typeof body.authors === "string" ? body.authors.trim() : "";
    const year = Number.parseInt(String(body.year), 10);
    const studyType = typeof body.studyType === "string" ? body.studyType.trim() : "";

    if (!title || !authors || !Number.isInteger(year) || !studyType) {
      return NextResponse.json(
        { error: "Title, authors, year, and study type are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.reference.findUnique({ where: { title }, select: { title: true } });

    if (existing) {
      return NextResponse.json({ error: "A reference with that title already exists" }, { status: 409 });
    }

    const reference = await prisma.reference.create({
      data: {
        title,
        authors,
        abstract: typeof body.abstract === "string" ? body.abstract.trim() || null : null,
        keywords: typeof body.keywords === "string" ? body.keywords.trim() || null : null,
        year,
        studyType,
        domain: typeof body.domain === "string" ? body.domain.trim() || null : null,
        task: typeof body.task === "string" ? body.task.trim() || null : null,
        venue: typeof body.venue === "string" ? body.venue.trim() || null : null,
        toolAvailability: typeof body.toolAvailability === "string" ? body.toolAvailability.trim() || null : null,
        link: typeof body.link === "string" ? body.link.trim() || null : null,
      },
    });

    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    console.error("Reference creation error:", error);
    return NextResponse.json({ error: "An error occurred while creating the reference" }, { status: 500 });
  }
}
