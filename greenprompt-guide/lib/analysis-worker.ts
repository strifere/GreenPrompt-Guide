import { prisma } from "@/lib/prisma";
import { analyzeRequestWithOllama } from "@/lib/ollama-client";
import { getCollaborationPdfStoragePath } from "@/lib/collaboration-request-storage";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { setAnalysisStep } from "@/domain/collaboration-request-repository";

const POLL_INTERVAL_MS = 5000;

async function claimAndRunNextJob(): Promise<void> {
  // Atomically claim one PENDING job
  const job = await prisma.analysisJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return;

  // Mark as RUNNING before doing any work (prevents double-claim)
  const claimed = await prisma.analysisJob.updateMany({
    where: { id: job.id, status: "PENDING" }, // extra guard
    data: { status: "RUNNING", startedAt: new Date() },
  });

  if (claimed.count === 0) return; // another worker got it first (future-proofing)

  try {
    const request = await prisma.collaborationRequest.findUnique({
      where: { id: job.requestId },
      select: { supportingPdfPath: true },
    });

    if (!request) throw new Error("Collaboration request not found");

    const absolutePath = getCollaborationPdfStoragePath(request.supportingPdfPath);
    const pdfImages = await extractTextFromPdf(absolutePath); //encoded in base64 strings

    const base64Data: string[] = [];
    for (const [, img] of pdfImages.entries()) {
      const urlRemoved = img.replace(/^data:image\/[a-z]+;base64,/, ""); // Remove the data URL prefix if it exists
      base64Data.push(urlRemoved);
    }

    
    let result;
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[AnalysisWorker] Running LLM analysis (Attempt ${attempt}/${maxAttempts})...`);
        result = await analyzeRequestWithOllama(job.requestId, base64Data);
        break; // Success! Break out of the retry loop.
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error; // Out of attempts, pass error to main catch block
        }
        
        console.warn(
          `[AnalysisWorker] Attempt ${attempt} failed. Ollama might be cold-starting. Retrying in 15 seconds...`
        );
        // Wait 15 seconds to give Ollama a realistic window to finish loading weights into VRAM
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }

    setAnalysisStep(job.requestId, "end"); // Mark step 5 complete

    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        result: result as object,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: message, completedAt: new Date() },
    });
  }
}

let workerStarted = false;

export function startAnalysisWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  console.log("[AnalysisWorker] Started");

  // Also recover any jobs stuck in RUNNING from a previous crash
  prisma.analysisJob
    .updateMany({
      where: { status: "RUNNING" },
      data: { status: "PENDING", startedAt: null },
    })
    .then((r) => {
      if (r.count > 0) {
        console.log(`[AnalysisWorker] Reset ${r.count} stuck RUNNING job(s) to PENDING`);
      }
    });

  setInterval(() => {
    claimAndRunNextJob().catch((err) => {
      console.error("[AnalysisWorker] Unexpected error in worker tick:", err);
    });
  }, POLL_INTERVAL_MS);
}