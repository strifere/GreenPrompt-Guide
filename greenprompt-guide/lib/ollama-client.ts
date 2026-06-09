import { Ollama } from 'ollama';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:latest";

export type Practice = {
  name: string;
  description: string;
  greenScore: number; // 0–100
  tactic: "GREEN_PRACTICE" | "RED_PRACTICE";
  categories: Array<string>;
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
  link: string | null;
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

const PREFIX_PROMPT = "You are an expert AI research assistant that extracts structured data from research papers regarding Green Prompt Engineering. Your sole purpose is to analyze the provided text/images and extract data matching the exact JSON schema provided. Respond ONLY with a single, valid JSON object. Do not include markdown formatting (like ```json), preambles, or explanations."

const PRACTICE_EXTRACTION_PROMPT = `Extract the core green prompt engineering practice, its examples, and associated prompt techniques from the paper.

Output exactly this JSON structure:
{
  "practice": {
    "name": "<string: Short, descriptive title of the green prompt practice>",
    "description": "<string: 2-4 sentence description of what the practice is and why it reduces LLM energy use>",
    "greenScore": <integer: 0-100, where 100 means maximum energy saving. Default to 50 if unclear>,
    "tactic": "<enum: MUST be exactly 'GREEN_PRACTICE' or 'RED_PRACTICE'>"
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

const REFERENCE_EXTRACTION_PROMPT = `Extract the academic metadata and reference details of the provided paper. 

Output exactly this JSON structure:
{
  "reference": {
    "title": "<string: Full title of the paper>",
    "authors": "<string: Full names of authors, comma-separated>",
    "year": <integer: The 4-digit publication year>,
    "abstract": "<string or null: The complete abstract of the paper>",
    "keywords": "<string or null: Comma-separated list of keywords>",
    "studyType": "<string: The methodology or type of study conducted>",
    "domain": "<string or null: The specific industry or academic domain of the paper>",
    "task": "<string or null: The specific task the language models were given (e.g., Summarization, Code Generation)>",
    "venue": "<string or null: The publication venue (e.g., conference name, journal, arXiv)>",
    "toolAvailability": "<string or null: Name/link of any custom tool or system built in the paper>"
  }
}
`

const OTHERS_EXCTRACTION_PROMPT = `Extract all language models, datasets, and hyperparameters utilized or evaluated in the paper.

Output exactly this JSON structure:
{
  "models": [
    {
      "name": "<string: Name of the language model (e.g., LLaMA-2, GPT-4)>",
      "parameters": "<string or null: Number of parameters (e.g., '7B', '14B')>",
      "size": "<string or null: Categorical size if exact parameters are missing (e.g., 'small', 'large')>"
    }
  ],
  "datasets": [
    {
      "name": "<string: Name of the dataset>",
      "description": "<string or null: Brief explanation of what the dataset contains>",
      "size": "<string or null: The size of the dataset (e.g., '10,000 rows', '5GB')>"
    }
  ],
  "hyperparameters": [
    {
      "name": "<string: The hyperparameter name (e.g., 'temperature', 'top_p', 'max_tokens')>",
      "value": "<string: The literal value assigned to it>",
      "dataType": "<string: MUST be 'float', 'integer', 'string', or 'boolean'>"
    }
  ]
} 
`

const METRICS_EXTRACTION_PROMPT = `Extract all evaluation metrics from the paper, categorizing them into generic metrics, energy metrics, and accuracy metrics.
Confidence should be a float between 0.0 and 1.0 indicating how explicitly the paper stated this metric.

Output exactly this JSON structure:
{
  "genericMetrics": [
    {
      "title": "<string: e.g., Time Reduction, Token Savings>",
      "value": "<string: e.g., '15 seconds', '20%'>",
      "description": "<string or null: Context for the metric>",
      "confidence": <float: 0.0 to 1.0>
    }
  ],
  "energyMetrics": [
    {
      "title": "<string: e.g., Energy Consumption, Power Optimization>",
      "value": "<string: The literal value extracted>",
      "description": "<string or null: Context for the metric>",
      "confidence": <float: 0.0 to 1.0>,
      "type": "<enum: MUST be 'REDUCTION', 'CONSUMPTION', or 'EFFICIENCY'>",
      "minValue": <float or null: Minimum value measured>,
      "maxValue": <float or null: Maximum value measured>,
      "bestGuessValue": <float: Average, mean, or reported final value>,
      "unit": "<string: e.g., 'Wh', 'Joules', 'percentage'>"
    }
  ],
  "accuracyMetrics": [
    {
      "title": "<string: e.g., F1 Score, BLEU, Human Eval>",
      "value": "<string: The literal value extracted>",
      "description": "<string or null: Context for the metric>",
      "confidence": <float: 0.0 to 1.0>,
      "level": "<enum: MUST be 'WORSE', 'SAME_OR_WORSE', 'SAME', 'SAME_OR_BETTER', 'BETTER', 'MUCH_BETTER', or 'NEAR_PERFECT'>",
      "score": <float or null: Numeric representation between 0.0 and 1.0 matching the level>
    }
  ]
}`

const SUFFIX = `Rules for Extraction:
1. Return ONLY valid JSON.
2. If a field is optional and the information is not present, use null. DO NOT invent information.
3. Strictly adhere to the specified ENUM values and data types.
4. Ensure all strings are properly escaped.`;

export async function analyzeRequestWithOllama(
  base64Pdf: string[],
): Promise<OllamaExtractionResult> {
  const ollama = new Ollama({ host: OLLAMA_BASE_URL });
  const response = await ollama.generate({
    model: OLLAMA_MODEL,
    prompt: PREFIX_PROMPT + OTHERS_EXCTRACTION_PROMPT + SUFFIX,
    images: base64Pdf,
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