import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ promptTechniqueName: string }> | { promptTechniqueName: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
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

    const body = await request.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const technique = await prisma.promptTechnique.update({
      where: { name: decodedName },
      data: {
        description,
        example: typeof body.example === "string" ? body.example.trim() || null : null,
      },
    });

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
