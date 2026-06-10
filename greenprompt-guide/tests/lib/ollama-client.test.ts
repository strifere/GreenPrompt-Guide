import { analyzeRequestWithOllama } from "@/lib/ollama-client";
import { setAnalysisStep } from "@/domain/collaboration-request-repository";
import { Ollama } from "ollama";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/domain/collaboration-request-repository");
const mockOllamaGenerate = vi.fn();
vi.mock("ollama", () => {
    return {
        Ollama: vi.fn().mockImplementation(class {
            generate = mockOllamaGenerate;
        }),
    }
});
const mockSetAnalysisStep = setAnalysisStep as jest.Mock;

describe("ollama-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOllamaGenerate.mockReset();
  });

  const mockDataBlock1 = {
    practice: { name: "Practice 1", description: "Desc 1", greenScore: 75, tactic: "GREEN_PRACTICE", categories: ["C1"] },
    practiceExample: { scenario: "S1", originalPrompts: "OP1", improvedPrompts: "IP1", observations: "O1" },
    promptTechniques: [{ name: "PT1", description: "PT Desc 1", example: "PTE1" }],
  };

  const mockDataBlock2 = {
    reference: { title: "Ref 1", authors: "Author 1", year: 2024, abstract: "Abs 1", keywords: "K1" },
  };

  const mockDataBlock3 = {
    models: [{ name: "Model 1", parameters: "7B" }],
    datasets: [{ name: "Dataset 1" }],
    hyperparameters: [{ name: "Temp", value: "0.5", dataType: "float" }],
  };

  const mockDataBlock4 = {
    genericMetrics: [{ title: "GM1", value: "10" }],
    energyMetrics: [{ title: "EM1", value: "20" }],
    accuracyMetrics: [{ title: "AM1", value: "30" }],
  };

  const PREFIX_PROMPT = "You are an expert AI research assistant that extracts structured data from research papers regarding Green Prompt Engineering. Your sole purpose is to analyze the provided text/images and extract data matching the exact JSON schema provided. Respond ONLY with a single, valid JSON object. Do not include markdown formatting (like ```json), preambles, or explanations."

  const SUFFIX = `Rules for Extraction:
1. Return ONLY valid JSON.
2. If a field is optional and the information is not present, use null. DO NOT invent information.
3. Strictly adhere to the specified ENUM values and data types.
4. Ensure all strings are properly escaped.`;

  const PRACTICE_EXTRACTION_PROMPT = `Extract the core green prompt engineering practice, its examples, and associated prompt techniques from the paper.

Output exactly this JSON structure:
{
  "practice": {
    "name": "<string: Short, descriptive title of the green prompt practice>",
    "description": "<string: 2-4 sentence description of what the practice is and why it reduces LLM energy use>",
    "greenScore": <integer: 0-100, where 100 means maximum energy saving. Default to 50 if unclear>,
    "tactic": "<enum: MUST be exactly 'GREEN_PRACTICE' or 'RED_PRACTICE'>",
    "categories": ["<string: Category related to the practice>"]
  },
  "practiceExample": {
    "scenario": "<string: Brief description of the scenario/task where this practice is applied>",
    "originalPrompts": "<string: Example of the original, less efficient prompts>",
    "improvedPrompts": "<string: Example of the improved prompts after applying the practice>",
    "observations": "<string: Relevant observations about the difference in energy or performance>"
  },
  "promptTechniques": [
    {
      "name": "<string: Name of the prompt technique>",
      "description": "<string: 2-4 sentences detailing how the technique is applied>",
      "example": "<string or null: An example of the technique in use>"
    }
  ]
}
`

  it("should orchestrate all 4 analysis steps and combine results", async () => {
    mockOllamaGenerate
      .mockResolvedValueOnce({ done: true, response: JSON.stringify(mockDataBlock1) })
      .mockResolvedValueOnce({ done: true, response: JSON.stringify(mockDataBlock2) })
      .mockResolvedValueOnce({ done: true, response: JSON.stringify(mockDataBlock3) })
      .mockResolvedValueOnce({ done: true, response: JSON.stringify(mockDataBlock4) });

    const result = await analyzeRequestWithOllama(1, ["pdf_base64_data"]);

    // Check steps were called
    expect(mockSetAnalysisStep).toHaveBeenCalledTimes(4);
    expect(mockSetAnalysisStep).toHaveBeenCalledWith(1, 1);
    expect(mockSetAnalysisStep).toHaveBeenCalledWith(1, 2);
    expect(mockSetAnalysisStep).toHaveBeenCalledWith(1, 3);
    expect(mockSetAnalysisStep).toHaveBeenCalledWith(1, 4);

    // Check Ollama calls
    expect(mockOllamaGenerate).toHaveBeenCalledTimes(4);
    const firstCallArgs = mockOllamaGenerate.mock.calls[0][0];
    expect(firstCallArgs.images).toEqual(["pdf_base64_data"]);
    expect(firstCallArgs.prompt).toContain(PREFIX_PROMPT + PRACTICE_EXTRACTION_PROMPT + SUFFIX);

    // Check final combined result
    expect(result.practice.name).toBe("Practice 1");
    expect(result.reference.title).toBe("Ref 1");
    expect(result.models[0].name).toBe("Model 1");
    expect(result.metrics.genericMetrics[0].title).toBe("GM1");
    expect(result.examples.length).toBe(1);
    expect(result.examples[0].scenario).toBe("S1");
  });

  it("should handle missing data gracefully with defaults", async () => {
    mockOllamaGenerate.mockResolvedValue({ done: true, response: JSON.stringify({}) });

    const result = await analyzeRequestWithOllama(1, ["pdf_base64_data"]);

    expect(result.practice.name).toBe("Unknown Practice");
    expect(result.practice.greenScore).toBe(50);
    expect(result.reference.title).toBe("Unknown Title");
    expect(result.reference.year).toBe(new Date().getFullYear());
    expect(result.models).toEqual([]);
    expect(result.metrics.genericMetrics).toEqual([]);
    expect(result.examples).toEqual([]);
  });

  it("should throw an error if Ollama generation is not done", async () => {
    mockOllamaGenerate.mockResolvedValue({
      done: false,
      done_reason: "test_failure",
    });

    await expect(analyzeRequestWithOllama(1, ["pdf"])).rejects.toThrow(
      "Ollama execution broken: test_failure"
    );
  });

  it("should throw an error if JSON parsing fails", async () => {
    mockOllamaGenerate.mockResolvedValue({
      done: true,
      response: "this is not json",
    });

    await expect(analyzeRequestWithOllama(1, ["pdf"])).rejects.toThrow();
  });
});