import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the worker module
const mockStartAnalysisWorker = vi.fn();
vi.mock("@/lib/analysis-worker", () => ({
  startAnalysisWorker: mockStartAnalysisWorker,
}));

// We need to dynamically import register after setting up mocks and env vars
async function runRegister() {
  const { register } = await import("@/instrumentation");
  await register();
}

describe("instrumentation.ts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules(); // Clear import cache
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should start the analysis worker when NEXT_RUNTIME is 'nodejs'", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    await runRegister();
    expect(mockStartAnalysisWorker).toHaveBeenCalledOnce();
  });

  it("should not start the analysis worker when NEXT_RUNTIME is not 'nodejs'", async () => {
    process.env.NEXT_RUNTIME = "edge";
    await runRegister();
    expect(mockStartAnalysisWorker).not.toHaveBeenCalled();
  });

  it("should not start the analysis worker when NEXT_RUNTIME is undefined", async () => {
    delete process.env.NEXT_RUNTIME;
    await runRegister();
    expect(mockStartAnalysisWorker).not.toHaveBeenCalled();
  });
});
