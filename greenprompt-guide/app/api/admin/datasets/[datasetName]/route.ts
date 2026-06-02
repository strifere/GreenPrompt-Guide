import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { DataFormatType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ datasetName: string }> | { datasetName: string };
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

    const { datasetName } = await Promise.resolve(context.params);
    const decodedName = decodeURIComponent(datasetName);

    const existing = await prisma.dataset.findUnique({
      where: { name: decodedName },
      select: { name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const body = await request.json();

    const dataset = await prisma.dataset.update({
      where: { name: decodedName },
      data: {
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        size: typeof body.size === "string" ? body.size.trim() || null : null,
        dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
      },
    });

    return NextResponse.json({ dataset }, { status: 200 });
  } catch (error) {
    console.error("Dataset update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the dataset" },
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

    const { datasetName } = await Promise.resolve(context.params);
    const decodedName = decodeURIComponent(datasetName);

    const existing = await prisma.dataset.findUnique({
      where: { name: decodedName },
      select: { name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    await prisma.dataset.delete({ where: { name: decodedName } });

    return NextResponse.json({ message: "Dataset deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Dataset deletion error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the dataset" },
      { status: 500 },
    );
  }
}
