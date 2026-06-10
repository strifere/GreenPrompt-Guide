import { extractTextFromPdf } from "@/lib/pdf-extract";
import { pdfToImg } from "pdftoimg-js";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, it, expect, vi } from "vitest";

// Mock the external library
vi.mock("pdftoimg-js", () => ({
  pdfToImg: vi.fn(),
}));

const mockPdfToImg = pdfToImg as jest.Mock;

describe("pdf-extract", () => {
  it("should call pdfToImg with the correct parameters", async () => {
    const fakeResult = ["base64_string_1", "base64_string_2"];
    mockPdfToImg.mockResolvedValue(fakeResult);

    const result = await extractTextFromPdf("/path/to/my.pdf");

    expect(mockPdfToImg).toHaveBeenCalledOnce();
    expect(mockPdfToImg).toHaveBeenCalledWith("/path/to/my.pdf", {
      imgType: "jpg",
      scale: 3,
      background: "white",
    });

    expect(result).toEqual(fakeResult);
  });

  it("should throw an error if pdfToImg fails", async () => {
    const testError = new Error("PDF rendering failed");
    mockPdfToImg.mockRejectedValue(testError);

    await expect(extractTextFromPdf("/path/to/bad.pdf")).rejects.toThrow(
      "PDF rendering failed"
    );
  });

  it("should set the pdf.js worker source", () => {
    expect(GlobalWorkerOptions.workerSrc).toBeTypeOf("string");
    expect(GlobalWorkerOptions.workerSrc).to.include("pdf.worker.mjs");
  });
});
