import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ categoryName: string }> | { categoryName: string };
};

const VALID_TACTICS = new Set(["GREEN_PRACTICE", "RED_PRACTICE"]);

async function resolveCategory(
  context: RouteContext,
): Promise<{ category: { name: string }; decodedName: string } | NextResponse> {
  const adminCheck = await requireAdmin();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { categoryName } = await Promise.resolve(context.params);
  const decodedName = decodeURIComponent(categoryName);

  const category = await prisma.category.findUnique({
    where: { name: decodedName },
    select: { name: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return { category, decodedName };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const result = await resolveCategory(context);

    if (result instanceof NextResponse) {
      return result;
    }

    const { decodedName } = result;
    const body = await request.json();

    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;
    const tactic = typeof body.tactic === "string" ? body.tactic.trim() : "";

    if (!tactic || !VALID_TACTICS.has(tactic)) {
      return NextResponse.json(
        { error: "Tactic must be GREEN_PRACTICE or RED_PRACTICE" },
        { status: 400 },
      );
    }

    const category = await prisma.category.update({
      where: { name: decodedName },
      data: {
        description,
        tactic: tactic as "GREEN_PRACTICE" | "RED_PRACTICE",
      },
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the category" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const result = await resolveCategory(context);

    if (result instanceof NextResponse) {
      return result;
    }

    const { decodedName } = result;

    await prisma.category.delete({ where: { name: decodedName } });

    return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the category" },
      { status: 500 },
    );
  }
}
