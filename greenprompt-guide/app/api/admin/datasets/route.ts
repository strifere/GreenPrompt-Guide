import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { DataFormatType } from "@prisma/client";

export const runtime = "nodejs";

const VALID_DATA_FORMAT_TYPES: Set<DataFormatType> = new Set([
  "TEXT_ONLY",
  "IMAGE",
  "PDF",
  "CSV",
  "HTML",
  "ANY_FORMAT",
]);

function normalizeDataFormatTypes(value: unknown): DataFormatType[] {
  if (!Array.isArray(value)) return ["TEXT_ONLY"];
  const valid = value.filter(
    (v): v is DataFormatType =>
      typeof v === "string" && VALID_DATA_FORMAT_TYPES.has(v as DataFormatType),
  );
  return valid.length > 0 ? valid : ["TEXT_ONLY"];
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.dataset.findUnique({ where: { name }, select: { name: true } });

    if (existing) {
      return NextResponse.json(
        { error: "A dataset with that name already exists" },
        { status: 409 },
      );
    }

    const dataset = await prisma.dataset.create({
      data: {
        name,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        size: typeof body.size === "string" ? body.size.trim() || null : null,
        dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
      },
    });

    return NextResponse.json({ dataset }, { status: 201 });
  } catch (error) {
    console.error("Dataset creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the dataset" },
      { status: 500 },
    );
  }
}
