import { getData } from 'pdf-parse/worker';
import { PDFParse, VerbosityLevel } from 'pdf-parse';
import { readFile } from "node:fs/promises";

PDFParse.setWorker(getData());

export async function extractTextFromPdf(absolutePath: string): Promise<string> {

    const pdfBuffer = await readFile(absolutePath);
    const pdfData = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);

    const parser = new PDFParse({ 
        data: pdfData,
        verbosity: VerbosityLevel.ERRORS 
    });

    try {
        const result = await parser.getText();
        console.log("Text:", result.text);
        return result.text;
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred while parsing the PDF:', error);
        } else {
            throw error;
        }
    } finally {
        await parser.destroy();
    }
    return "";
}

