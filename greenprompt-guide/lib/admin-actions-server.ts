import { DataFormatType } from ".prisma/client/edge";
import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { requireAdmin } from "./admin-auth";
import { secureTrim } from "./utils";
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

/**
 * Parse and deduplicate a list of non-empty reference title strings from an
 * unknown payload field.  Returns an empty array when the field is absent or
 * invalid rather than throwing.
 */
function parseReferenceTitles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    ),
  );
}

/**
 * Validate that every title in `referenceTitles` exists in the database.
 * Returns a 400 NextResponse on failure, or `null` when all titles are valid.
 */
async function validateReferences(referenceTitles: string[]): Promise<NextResponse | null> {
  if (referenceTitles.length === 0) return null;

  const found = await prisma.reference.findMany({
    where: { title: { in: referenceTitles } },
    select: { title: true },
  });

  const foundSet = new Set(found.map((r) => r.title));
  const missing = referenceTitles.filter((t) => !foundSet.has(t));

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `References not found: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  return null;
}

export async function updateObjectAPI(
  type: "model" | "dataset" | "reference" | "hyperparameter",
  request: NextRequest,
  objectKey: string | number,
): Promise<NextResponse> {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const decodedName = decodeURIComponent(String(objectKey));

    let existing;
    switch (type) {
      case "model":
        existing = await prisma.model.findUnique({ where: { name: decodedName }, select: { name: true } });
        break;
      case "dataset":
        existing = await prisma.dataset.findUnique({ where: { name: decodedName }, select: { name: true } });
        break;
      case "reference":
        existing = await prisma.reference.findUnique({ where: { title: decodedName }, select: { title: true } });
        break;
      case "hyperparameter":
        existing = await prisma.hyperparameter.findUnique({ where: { id: Number.parseInt(String(decodedName)) }, select: { id: true } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }

    const body = await request.json();

    if (type === "model") {
      const referenceTitles = parseReferenceTitles(body.referenceTitles);
      const refError = await validateReferences(referenceTitles);
      if (refError) return refError;

      const [object] = await prisma.$transaction([
        prisma.model.update({
          where: { name: decodedName },
          data: {
            description: secureTrim(body.description),
            parameters: secureTrim(body.parameters),
            size: secureTrim(body.size),
            dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
          },
        }),
        // Replace all reference links.
        prisma.modelReference.deleteMany({ where: { modelName: decodedName } }),
        ...referenceTitles.map((referenceTitle) =>
          prisma.modelReference.create({ data: { modelName: decodedName, referenceTitle } }),
        ),
      ]);

      return NextResponse.json({ model: object }, { status: 200 });
    } else if (type === "dataset") {
      const referenceTitles = parseReferenceTitles(body.referenceTitles);
      const refError = await validateReferences(referenceTitles);
      if (refError) return refError;

      const [object] = await prisma.$transaction([
        prisma.dataset.update({
          where: { name: decodedName },
          data: {
            description: secureTrim(body.description),
            size: secureTrim(body.size),
            dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
          },
        }),
        // Replace all reference links.
        prisma.paperDataset.deleteMany({ where: { datasetName: decodedName } }),
        ...referenceTitles.map((referenceTitle) =>
          prisma.paperDataset.create({ data: { datasetName: decodedName, referenceTitle } }),
        ),
      ]);

      return NextResponse.json({ dataset: object }, { status: 200 });
    } else if (type === "hyperparameter") {
      const object = await prisma.hyperparameter.update({
        where: { id: Number.parseInt(String(decodedName)) },
        data: {
          referenceTitle: secureTrim(body.referenceTitle),
          practiceName: secureTrim(body.practiceName),
          name: secureTrim(body.name),
          value: secureTrim(body.value),
          dataType: secureTrim(body.dataType),
        },
      });
      return NextResponse.json({ hyperparameter: object }, { status: 200 });
    }

    // type === "reference"
    const object = await prisma.reference.update({
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

    return NextResponse.json({ reference: object }, { status: 200 });
  } catch (error) {
    console.error(`${type} update error:`, error);
    return NextResponse.json(
      { error: `An error occurred while updating the ${type}` },
      { status: 500 },
    );
  }
}

export async function deleteObjectAPI(
  type: "model" | "dataset" | "reference" | "hyperparameter",
  objectKey: string | number,
): Promise<NextResponse> {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const decodedTitle = decodeURIComponent(String(objectKey));

    let existing;
    switch (type) {
      case "model":
        existing = await prisma.model.findUnique({
          where: { name: decodedTitle },
          select: { name: true },
        });
        break;
      case "dataset":
        existing = await prisma.dataset.findUnique({
          where: { name: decodedTitle },
          select: { name: true },
        });
        break;
      case "reference":
        existing = await prisma.reference.findUnique({
          where: { title: decodedTitle },
          select: { title: true },
        });
        break;
      case "hyperparameter":
        existing = await prisma.hyperparameter.findUnique({
          where: { id: Number.parseInt(String(decodedTitle)) },
          select: { id: true },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }

    switch (type) {
      case "model":
        await prisma.model.delete({ where: { name: decodedTitle } });
        break;
      case "dataset":
        await prisma.dataset.delete({ where: { name: decodedTitle } });
        break;
      case "hyperparameter":
        await prisma.hyperparameter.delete({ where: { id: Number.parseInt(String(decodedTitle)) } });
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

export async function insertObjectAPI(
  type: "model" | "dataset" | "hyperparameter",
  request: NextRequest,
): Promise<NextResponse> {
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

    let existing;
    switch (type) {
      case "model":
        existing = await prisma.model.findUnique({ where: { name }, select: { name: true } });
        break;
      case "dataset":
        existing = await prisma.dataset.findUnique({ where: { name }, select: { name: true } });
        break;
      case "hyperparameter":
        existing = false; // Hyperparameters are identified by ID, so we allow duplicate names.
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (existing) {
      return NextResponse.json(
        { error: `A ${type} with that name already exists` },
        { status: 409 },
      );
    }

    const referenceTitles = parseReferenceTitles(body.referenceTitles);
    const refError = await validateReferences(referenceTitles);
    if (refError) return refError;

    let object;
    if (type === "model") {
      [object] = await prisma.$transaction([
        prisma.model.create({
          data: {
            name,
            description: secureTrim(body.description),
            parameters: secureTrim(body.parameters),
            size: secureTrim(body.size),
            dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
          },
        }),
        ...referenceTitles.map((referenceTitle) =>
          prisma.modelReference.create({ data: { modelName: name, referenceTitle } }),
        ),
      ]);
    } else if (type === "dataset") {
      [object] = await prisma.$transaction([
        prisma.dataset.create({
          data: {
            name,
            description: secureTrim(body.description),
            size: secureTrim(body.size),
            dataFormatType: normalizeDataFormatTypes(body.dataFormatType),
          },
        }),
        ...referenceTitles.map((referenceTitle) =>
          prisma.paperDataset.create({ data: { datasetName: name, referenceTitle } }),
        ),
      ]);
    } else if (type === "hyperparameter") {
      const practiceName = secureTrim(body.practiceName);
      [object] = await prisma.$transaction([
        prisma.hyperparameter.create({
          data: {
            referenceTitle: secureTrim(body.referenceTitle),
            practiceName: practiceName == "" ? null : practiceName,
            name: secureTrim(body.name),
            value: secureTrim(body.value),
            dataType: secureTrim(body.dataType),
          },
        }),
      ]);
    }

    return NextResponse.json({ object }, { status: 201 });
  } catch (error) {
    console.error(`${type} creation error:`, error);
    return NextResponse.json(
      { error: `An error occurred while creating the ${type}` },
      { status: 500 },
    );
  }
}
