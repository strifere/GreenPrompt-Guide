import { DataFormatType } from ".prisma/client/edge";
import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { requireAdmin } from "./admin-auth";
import { prisma } from "./prisma";

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

function secureTrim(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
}

export async function updateObjectAPI(
  type: "models" | "datasets" | "references",
  request: NextRequest,
  objectKey: any
) : Promise<NextResponse>
{
  try {
      const adminCheck = await requireAdmin();
  
      if (!adminCheck.ok) {
        return adminCheck.response;
      }
      const decodedName = decodeURIComponent(objectKey);

      let existing;
      switch (type) {
        case "models":
          existing = await prisma.model.findUnique({ where: { name: decodedName }, select: { name: true } });
          break;
        case "datasets":
          existing = await prisma.dataset.findUnique({ where: { name: decodedName }, select: { name: true } });
          break;
        case "references":
          existing = await prisma.reference.findUnique({ where: { title: decodedName }, select: { title: true } });
          break;
        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }

      if (!existing) {
        return NextResponse.json({ error: `${type} not found` }, { status: 404 });
      }
  
      const body = await request.json();
  
      let object;
      switch (type) {
        case "models":
          object = await prisma.model.update({
            where: { name: decodedName },
            data: {
              description: secureTrim(body.description),
              parameters: secureTrim(body.parameters),
              size: secureTrim(body.size),
              dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
            },
          });
          break;
        case "datasets":
          object = await prisma.dataset.update({
            where: { name: decodedName },
            data: {
              description: secureTrim(body.description),
              size: secureTrim(body.size),
              dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
            },
          });
          break;
        default:
          object = await prisma.reference.update({
            where: { title: decodedName },
            data: {
              authors: secureTrim(body.authors),
              abstract: secureTrim(body.abstract),
              keywords: secureTrim(body.keywords),
              year: Number.parseInt(String(body.year), 10),
              studyType: secureTrim(body.studyType),
              domain: secureTrim(body.domain),
              task: secureTrim(body.task),
              venue: secureTrim(body.venue),
              toolAvailability: secureTrim(body.toolAvailability),
              link: secureTrim(body.link),
            },
          });
          break;
      }
  
      return NextResponse.json({ [type]: object }, { status: 200 });
    } catch (error) {
      console.error(`${type} update error:`, error);
      return NextResponse.json(
        { error: `An error occurred while updating the ${type}` },
        { status: 500 },
      );
    }
}

export async function deleteObjectAPI(
  type: "models" | "datasets" | "references",
  objectKey: any
) : Promise<NextResponse>
{
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const decodedTitle = decodeURIComponent(objectKey);

    let existing;
    switch (type) {
      case "models":    
        existing = await prisma.model.findUnique({
          where: { name: decodedTitle },
          select: { name: true },
        });
        break;
      case "datasets":
        existing = await prisma.dataset.findUnique({
          where: { name: decodedTitle },
          select: { name: true },
        });
        break;
      case "references":
        existing = await prisma.reference.findUnique({
          where: { title: decodedTitle },
          select: { title: true },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }

    switch (type) {
      case "models":
        await prisma.model.delete({ where: { name: decodedTitle } });
        break;
      case "datasets":
        await prisma.dataset.delete({ where: { name: decodedTitle } });
        break;
      default:
        await prisma.reference.delete({ where: { title: decodedTitle } });
    }

    return NextResponse.json({ message: `${type} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`${type} deletion error:`, error);
    return NextResponse.json({ error: `An error occurred while deleting the ${type}` }, { status: 500 });
  }
}