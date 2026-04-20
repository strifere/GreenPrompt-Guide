export enum TacticType {
  GREEN_PRACTICE = "GREEN_PRACTICE",
  RED_PRACTICE = "RED_PRACTICE",
}

export enum DataFormatType {
  TEXT_ONLY = "TEXT_ONLY",
  IMAGE = "IMAGE",
  PDF = "PDF",
  CSV = "CSV",
  HTML = "HTML",
  ANY_FORMAT = "ANY_FORMAT",
}

export enum AccuracyLevel {
  WORSE = "WORSE",
  SAME_OR_WORSE = "SAME_OR_WORSE",
  SAME = "SAME",
  SAME_OR_BETTER = "SAME_OR_BETTER",
  BETTER = "BETTER",
  MUCH_BETTER = "MUCH_BETTER",
  NEAR_PERFECT = "NEAR_PERFECT",
}

export enum EnergyMetricType {
  REDUCTION = "REDUCTION",
  EFFICIENCY = "EFFICIENCY",
  CONSUMPTION = "CONSUMPTION",
}

export class User {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly password: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Admin extends User {}

export class Category {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly tactic: TacticType,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class PromptTechnique {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly example: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Dataset {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly size: string | null,
    public readonly dataFormatType: DataFormatType[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Reference {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly authors: string,
    public readonly abstract: string | null,
    public readonly keywords: string | null,
    public readonly year: number,
    public readonly studyType: string,
    public readonly domain: string | null,
    public readonly task: string | null,
    public readonly venue: string | null,
    public readonly toolAvailability: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Hyperparameter {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly value: string,
    public readonly dataType: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Model {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly parameters: string | null,
    public readonly dataFormatType: DataFormatType[],
    public readonly size: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export abstract class Metric {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly value: unknown,
    public readonly description: string | null,
    public readonly confidence: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class EnergyMetric extends Metric {
  constructor(
    id: number,
    title: string,
    value: unknown,
    description: string | null,
    confidence: number,
    createdAt: Date,
    updatedAt: Date,
    public readonly type: EnergyMetricType,
    public readonly minValue: number | null,
    public readonly maxValue: number | null,
    public readonly bestGuessValue: number,
    public readonly unit: string,
  ) {
    super(id, title, value, description, confidence, createdAt, updatedAt);
  }
}

export class AccuracyMetric extends Metric {
  constructor(
    id: number,
    title: string,
    value: unknown,
    description: string | null,
    confidence: number,
    createdAt: Date,
    updatedAt: Date,
    public readonly level: AccuracyLevel,
    public readonly score: number | null,
  ) {
    super(id, title, value, description, confidence, createdAt, updatedAt);
  }
}

export class PracticeExample {
  constructor(
    public readonly id: number,
    public readonly scenario: string,
    public readonly originalPrompts: string,
    public readonly improvedPrompts: string,
    public readonly observations: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class Practice {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
    public readonly greenScore: number,
    public readonly tactic: TacticType,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly verifiedAt: Date | null,
    public readonly categories: Category[],
    public readonly promptTechniques: PromptTechnique[],
    public readonly references: Reference[],
    public readonly datasets: Dataset[],
    public readonly models: Model[],
    public readonly hyperparameters: Hyperparameter[],
    public readonly metrics: Metric[],
    public readonly examples: PracticeExample[],
  ) {}
}
