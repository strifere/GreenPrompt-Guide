import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ referenceTitle: string }> | { referenceTitle: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { referenceTitle } = await Promise.resolve(context.params);
    const decodedTitle = decodeURIComponent(referenceTitle);

    const existing = await prisma.reference.findUnique({
      where: { title: decodedTitle },
      select: { title: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }

    const body = await request.json();
    const authors = typeof body.authors === "string" ? body.authors.trim() : "";
    const year = Number.parseInt(String(body.year), 10);
    const studyType = typeof body.studyType === "string" ? body.studyType.trim() : "";

    if (!authors || !Number.isInteger(year) || !studyType) {
      return NextResponse.json(
        { error: "Authors, year, and study type are required" },
        { status: 400 },
      );
    }

    const reference = await prisma.reference.update({
      where: { title: decodedTitle },
      data: {
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

    return NextResponse.json({ reference }, { status: 200 });
  } catch (error) {
    console.error("Reference update error:", error);
    return NextResponse.json({ error: "An error occurred while updating the reference" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { referenceTitle } = await Promise.resolve(context.params);
    const decodedTitle = decodeURIComponent(referenceTitle);

    const existing = await prisma.reference.findUnique({
      where: { title: decodedTitle },
      select: { title: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }

    await prisma.reference.delete({ where: { title: decodedTitle } });

    return NextResponse.json({ message: "Reference deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reference deletion error:", error);
    return NextResponse.json({ error: "An error occurred while deleting the reference" }, { status: 500 });
  }
}
