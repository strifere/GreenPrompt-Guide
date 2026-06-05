import {
  createCollaborationRequestDir,
  writeCollaborationRequestFile,
  readCollaborationRequestFile,
} from "@/lib/collaboration-request-fs";
import * as fs from "node:fs/promises";
import { describe, it, expect, vi, afterEach } from "vitest";

// 1. Use a strictly synchronous mock and explicitly define the 'default' export
vi.mock("node:fs/promises", () => {
  const mkdirMock = vi.fn();
  const writeFileMock = vi.fn();
  const readFileMock = vi.fn();

  return {
    mkdir: mkdirMock,
    writeFile: writeFileMock,
    readFile: readFileMock,
    // Vitest expects a default export for Node built-ins in ESM mode
    default: {
      mkdir: mkdirMock,
      writeFile: writeFileMock,
      readFile: readFileMock,
    },
  };
});

describe("collaboration-request-fs", () => {
  afterEach(() => {
    vi.clearAllMocks(); 
  });

  describe("createCollaborationRequestDir", () => {
    it("should call mkdir with the correct path", async () => {
      const path = "/test/path";
      await createCollaborationRequestDir(path);
      expect(fs.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    });
  });

  describe("writeCollaborationRequestFile", () => {
    it("should call writeFile with the correct path and data", async () => {
      const path = "/test/path/file.txt";
      const data = new Uint8Array([1, 2, 3]);
      await writeCollaborationRequestFile(path, data);
      expect(fs.writeFile).toHaveBeenCalledWith(path, data);
    });
  });

  describe("readCollaborationRequestFile", () => {
    it("should call readFile with the correct path", async () => {
      const path = "/test/path/file.txt";
      const mockData = Buffer.from("test data");
      
      vi.mocked(fs.readFile).mockResolvedValueOnce(mockData as never);
      
      const data = await readCollaborationRequestFile(path);
      expect(fs.readFile).toHaveBeenCalledWith(path);
      expect(data).toEqual(mockData);
    });
  });
});