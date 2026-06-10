import { mkdir, writeFile, readFile } from "node:fs/promises";

export async function createCollaborationRequestDir(path: string) {
    await mkdir(path, { recursive: true });
}

export async function writeCollaborationRequestFile(path: string, data: Uint8Array) {
    await writeFile(path, data);
}

export async function readCollaborationRequestFile(path: string): Promise<Buffer> {
    return await readFile(path);
}
