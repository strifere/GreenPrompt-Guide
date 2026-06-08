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

    const pdfImages = await extractTextFromPdf(absolutePath);

    const firstPageImage = (await pdfImages.getPage(0)).toString("base64"); // base64-encoded image of the first page

    const extraction = await analyzeRequestWithOllama(firstPageImage);

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