import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { DataFormatType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ modelName: string }> | { modelName: string };
};

const VALID_DATA_FORMAT_TYPES: DataFormatType[] = [
  "TEXT_ONLY",
  "IMAGE",
  "PDF",
  "CSV",
  "HTML",
  "ANY_FORMAT",
];

function normalizeDataFormatTypes(value: unknown): DataFormatType[] {
  if (!Array.isArray(value)) return ["TEXT_ONLY"];
  const valid = value.filter(
    (v): v is DataFormatType =>
      typeof v === "string" && VALID_DATA_FORMAT_TYPES.includes(v as DataFormatType),
  );
  return valid.length > 0 ? valid : ["TEXT_ONLY"];
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { modelName } = await Promise.resolve(context.params);
    const decodedName = decodeURIComponent(modelName);

    const existing = await prisma.model.findUnique({
      where: { name: decodedName },
      select: { name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const body = await request.json();

    const model = await prisma.model.update({
      where: { name: decodedName },
      data: {
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        parameters: typeof body.parameters === "string" ? body.parameters.trim() || null : null,
        size: typeof body.size === "string" ? body.size.trim() || null : null,
        dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
      },
    });

    return NextResponse.json({ model }, { status: 200 });
  } catch (error) {
    console.error("Model update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the model" },
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

    const { modelName } = await Promise.resolve(context.params);
    const decodedName = decodeURIComponent(modelName);

    const existing = await prisma.model.findUnique({
      where: { name: decodedName },
      select: { name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    await prisma.model.delete({ where: { name: decodedName } });

    return NextResponse.json({ message: "Model deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Model deletion error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the model" },
      { status: 500 },
    );
  }
}
