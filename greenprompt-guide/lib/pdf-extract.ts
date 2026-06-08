"use server";

import { Pdf, pdf } from 'pdf-to-img';

export async function extractTextFromPdf(absolutePath: string): Promise<Pdf> {
    return await pdf(absolutePath);
}

