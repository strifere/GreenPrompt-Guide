import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { OllamaExtractionResult } from "@/lib/ollama-client";

type RouteParams = { params: Promise<{ requestId: string }> };

// POST /api/admin/requests/:id/analyze — enqueue a job
export async function POST(_req: Request, { params }: RouteParams) {
  const username = await getSession();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const parsedId = Number.parseInt(requestId, 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const request = await prisma.collaborationRequest.findUnique({
    where: { id: parsedId },
    select: { id: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Upsert: if a FAILED job exists, reset it; otherwise create fresh
  const job = await prisma.analysisJob.upsert({
    where: { requestId: parsedId },
    create: { requestId: parsedId, status: "PENDING" },
    update: { status: "PENDING", error: null, result: JSON.stringify({}),
               startedAt: null, completedAt: null },
  });

  return NextResponse.json({ jobId: job.id, status: job.status });
}

// GET /api/admin/requests/:id/analyze — poll job status
export async function GET(_req: Request, { params }: RouteParams) {
  const username = await getSession();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const parsedId = Number.parseInt(requestId, 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const job = await prisma.analysisJob.findUnique({
    where: { requestId: parsedId },
    select: { id: true, status: true, step: true, result: true, error: true, createdAt: true },
  });

  if (!job) {
    return NextResponse.json({ status: "NONE" });
  }

  if (job.status === "DONE") {
    return NextResponse.json({
      status: "DONE",
      extraction: job.result as OllamaExtractionResult,
    });
  }

  return NextResponse.json({ status: job.status, step: job.step, error: job.error ?? null });
}