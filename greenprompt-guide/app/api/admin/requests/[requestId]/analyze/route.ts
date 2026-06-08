import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCollaborationRequestById } from "@/domain/collaboration-request-repository";
import { getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { analyzeRequestWithOllama } from "@/lib/ollama-client";

export const runtime = "nodejs";

// Long timeout — LLM inference can take 30-60s on a 4-vCPU machine
export const maxDuration = 120;

type AnalyzeRouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function POST(_request: Request, context: AnalyzeRouteContext) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) return adminCheck.response;

    const { requestId } = await context.params;
    const parsedId = Number.parseInt(requestId, 10);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const collaborationRequest = await getCollaborationRequestById(parsedId);
    if (!collaborationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const absolutePath = getCollaborationPdfStoragePath(
      collaborationRequest.supportingPdfPath,
    );

    let pdfText: string;
    try {
      pdfText = await extractTextFromPdf(absolutePath);
    } catch {
      return NextResponse.json(
        { error: "Could not read or parse the PDF file" },
        { status: 422 },
      );
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: "The PDF appears to contain no extractable text (it may be scanned)" },
        { status: 422 },
      );
    }

    const extraction = await analyzeRequestWithOllama(pdfText);

    return NextResponse.json({ extraction }, { status: 200 });
  } catch (error) {
    console.error("LLM analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "The AI returned an unparseable response. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during analysis" },
      { status: 500 },
    );
  }
}