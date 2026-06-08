import { Ollama } from 'ollama';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

export type Practice = {
  name: string;
  description: string;
  greenScore: number; // 0–100
  tactic: "GREEN_PRACTICE" | "RED_PRACTICE";
}

export type Reference = {
  title: string;
  authors: string;
  year: number;
  abstract: string;
  keywords: string;
  studyType: string;
  domain: string | null;
  task: string | null;
  venue: string | null;
  toolAvailability: string | null;
}

export type PromptTechnique = {
  name: string;
  description: string;
  example: string | null;
};

export type Model = {
  name: string;
  parameters: string | null;
  size: string | null;
};

export type Dataset = {
  name: string;
  description: string | null;
  size: string | null;
};

export type Hyperparameter = {
  name: string;
  value: string;
  dataType: string;
};

export type BaseMetric = {
  title: string;
  value: string; // Can be numeric or text
  description: string | null;
  confidence: number;
};

export type EnergyMetric = BaseMetric & {
  type: "REDUCTION" | "CONSUMPTION" | "EFFICIENCY";
  minValue: number | null;
  maxValue: number | null;
  bestGuessValue: number;
  unit: string;
}

export type AccuracyMetric = BaseMetric & {
  level: "WORSE" | "SAME_OR_WORSE" | "SAME" | "SAME_OR_BETTER" | "BETTER" | "MUCH_BETTER" | "NEAR_PERFECT";
  score: number | null // Numeric representation 0-1
};

export type PracticeExample = {
  scenario: string;
  originalPrompts: string;
  improvedPrompts: string;
  observations: string;
};

export type OllamaExtractionResult = {
  practice: Practice;
  reference: Reference;
  categories: string[];          // e.g. ["Prompt Design", "Inference Efficiency"]
  promptTechniques: Array<PromptTechnique>;
  models: Array<Model>;
  datasets: Array<Dataset>;
  hyperparameters: Array<Hyperparameter>;
  metrics: {
    genericMetrics: Array<BaseMetric>;
    energyMetrics: Array<EnergyMetric>;
    accuracyMetrics: Array<AccuracyMetric>;
  }
  examples: Array<PracticeExample>;
};

const SYSTEM_PROMPT = `You are a research assistant that extracts structured information from green prompt engineering research papers.

Your task is to analyze the provided paper text and extract data that maps to a specific data model. You MUST respond with ONLY valid JSON — no markdown, no explanation, no preamble.

The JSON must match this exact structure:
{
  "practice": {
    "name": "short descriptive title of the green prompt practice",
    "description": "2-4 sentence description of what the practice is and why it reduces LLM energy use",
    "greenScore": <integer 0-100, where 100 means maximum energy saving>,
    "tactic": "GREEN_PRACTICE" or "RED_PRACTICE"
  },
  "reference": {
    "title": "full paper title",
    "authors": "Author1; Author2; Author3",
    "year": <publication year as integer>,
    "abstract": "paper abstract or summary",
    "keywords": "comma-separated keywords",
    "studyType": "e.g. Empirical Study, Experimental Investigation, Benchmarking",
    "domain": "application domain or null",
    "task": "NLP task studied or null",
    "venue": "conference or journal name or null",
    "toolAvailability": "GitHub URL or tool name if available or null"
  },
  "categories": ["Category Name 1", "Category Name 2"],
  "promptTechniques": [
    { "name": "technique name", "description": "what it does", "example": "example usage or null" }
  ],
  "models": [
    { "name": "model name e.g. GPT-4", "parameters": "7B or null", "size": "small/large or null" }
  ],
  "datasets": [
    { "name": "dataset name", "description": "what it contains or null", "size": "e.g. 10k samples or null" }
  ],
  "hyperparameters": [
    { "name": "parameter name", "value": "value used", "dataType": "int/float/string/boolean" }
  ],
  "metrics": [
    {
      "subtype": "ENERGY",
      "title": "metric title",
      "value": "e.g. 30% reduction",
      "description": "what was measured",
      "confidence": 0.8,
      "energyType": "REDUCTION",
      "minValue": 20,
      "maxValue": 40,
      "bestGuessValue": 30,
      "unit": "PERCENTAGE"
    }
  ],
  "examples": [
    {
      "scenario": "task or use case",
      "originalPrompts": "the original inefficient prompt",
      "improvedPrompts": "the improved green prompt",
      "observations": "what changed and why it is more efficient"
    }
  ]
}

Rules:
- If you cannot find a value, use null for optional fields or a reasonable default for required ones.
- greenScore should reflect how impactful the practice is (80+ = very impactful, 40-79 = moderate, 0-39 = minor).
- For categories, infer from the paper's focus: e.g. "Prompt Design", "Context Compression", "Batching", "Model Selection".
- Only output JSON. Nothing else.`;

export async function analyzeRequestWithOllama(
  pdfText: string,
): Promise<OllamaExtractionResult> {
  const ollama = new Ollama({ host: OLLAMA_BASE_URL });
  const response = await ollama.generate({
    model: OLLAMA_MODEL,
    prompt: SYSTEM_PROMPT + `Analyze this research paper and extract the structured data:\n\n${pdfText}`,
    stream: false,
    format: "json",
    options: {
      temperature: 0.1,   // Low temperature for more deterministic extraction
    },
  });
  
  if (!response.done) {
    throw new Error("Ollama response was not completed:" + response.done_reason);
  }

  const data = response.response;

  console.log("Raw Ollama response:", data);

  return JSON.parse(data) as OllamaExtractionResult;
}