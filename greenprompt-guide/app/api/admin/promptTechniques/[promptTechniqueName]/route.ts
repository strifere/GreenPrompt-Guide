import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ promptTechniqueName: string }> | { promptTechniqueName: string };
};

async function resolveDecodedName(
  context: RouteContext,
): Promise<NextResponse | string> {
  const adminCheck = await requireAdmin();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { promptTechniqueName } = await Promise.resolve(context.params);
  const decodedName = decodeURIComponent(promptTechniqueName);

  const existing = await prisma.promptTechnique.findUnique({
    where: { name: decodedName },
    select: { name: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Prompt technique not found" }, { status: 404 });
  }

  return decodedName;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const decodedName = await resolveDecodedName(context);

    if (decodedName instanceof NextResponse) {
      return decodedName;
    }

    const body = await request.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Collect and validate reference titles.
    const rawTitles: unknown = body.referenceTitles;
    const referenceTitles: string[] = Array.isArray(rawTitles)
      ? rawTitles.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
      : [];

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

    // Sync the prompt technique and its reference links in one transaction.
    const [technique] = await prisma.$transaction([
      prisma.promptTechnique.update({
        where: { name: decodedName },
        data: {
          description,
          example: typeof body.example === "string" ? body.example.trim() || null : null,
        },
      }),
      // Replace all existing reference links with the new selection.
      prisma.paperPromptTechnique.deleteMany({
        where: { promptTechniqueName: decodedName },
      }),
      ...referenceTitles.map((referenceTitle) =>
        prisma.paperPromptTechnique.create({
          data: { promptTechniqueName: decodedName, referenceTitle },
        }),
      ),
    ]);

    return NextResponse.json({ technique }, { status: 200 });
  } catch (error) {
    console.error("Prompt technique update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the prompt technique" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const decodedName = await resolveDecodedName(context);

    if (decodedName instanceof NextResponse) {
      return decodedName;
    }

    await prisma.promptTechnique.delete({ where: { name: decodedName } });

    return NextResponse.json({ message: "Prompt technique deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Prompt technique deletion error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the prompt technique" },
      { status: 500 },
    );
  }
}
