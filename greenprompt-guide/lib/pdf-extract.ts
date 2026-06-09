import { pdfToImg } from "pdftoimg-js";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
).toString();

export async function extractTextFromPdf(absolutePath: string): Promise<string[]> {
    return await pdfToImg(absolutePath, {
      imgType: "jpg",
      scale: 4,
      background: "white",
    });
}

