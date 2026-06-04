import type {
	AccuracyLevel,
	EnergyMetricType,
	MetricSubtype,
	Prisma,
	TacticType,
} from "@prisma/client";

export type PracticeExamplePayload = {
	scenario: string;
	originalPrompts: string;
	improvedPrompts: string;
	observations: string;
};

export type AdminPracticePayload = {
	practice?: {
		name?: string;
		description?: string;
		greenScore?: number | string;
		tactic?: TacticType;
	};
	categoryNames?: string[];
	newCategory?: {
		name?: string;
		description?: string;
		tactic?: TacticType;
	};
	examples?: PracticeExamplePayload[];
	reference?: {
		mode?: "existing" | "new";
		title?: string;
		authors?: string;
		abstract?: string;
		keywords?: string;
		year?: string | number;
		studyType?: string;
		domain?: string;
		task?: string;
		venue?: string;
		toolAvailability?: string;
		link?: string;
	};
};

export type AdminPracticeMetricPayload = {
	subtype?: MetricSubtype;
	title?: string;
	value?: string;
	description?: string;
	confidence?: number | string;
	energy?: {
		type?: EnergyMetricType;
		minValue?: number | string | null;
		maxValue?: number | string | null;
		bestGuessValue?: number | string | null;
		unit?: string;
	};
	accuracy?: {
		level?: AccuracyLevel;
		score?: number | string | null;
	};
};

export type AdminPracticeUpdatePayload = {
	practice?: {
		name?: string;
		description?: string;
		greenScore?: number | string;
		tactic?: TacticType;
	};
	categoryNames?: string[];
	promptTechniqueNames?: string[];
	modelNames?: string[];
	referenceTitles?: string[];
	hyperparameterIds?: Array<number | string>;
	examples?: PracticeExamplePayload[];
	metrics?: AdminPracticeMetricPayload[];
};

export type NormalizedAdminPracticePayload = {
	practice: {
		name: string;
		description: string;
		greenScore: number;
		tactic: TacticType;
	};
	categoryNames: string[];
	newCategory: {
		name: string;
		description: string | null;
		tactic: TacticType;
	} | null;
	examples: PracticeExamplePayload[];
	reference: 
		| {
				mode: "existing";
				title: string;
		  }
		| {
				mode: "new";
				title: string;
				authors: string;
				abstract: string | null;
				keywords: string | null;
				year: number;
				studyType: string;
				domain: string | null;
				task: string | null;
				venue: string | null;
				toolAvailability: string | null;
				link: string;
		  };
};

export type NormalizedAdminPracticeMetricPayload = {
	subtype: MetricSubtype;
	title: string;
	value: string;
	description: string | null;
	confidence: number;
	energy: {
		type: EnergyMetricType;
		minValue: number | null;
		maxValue: number | null;
		bestGuessValue: number;
		unit: string;
	} | null;
	accuracy: {
		level: AccuracyLevel;
		score: number | null;
	} | null;
};

export type NormalizedAdminPracticeUpdatePayload = {
	practice: {
		name: string;
		description: string;
		greenScore: number;
		tactic: TacticType;
	};
	categoryNames: string[];
	promptTechniqueNames: string[];
	modelNames: string[];
	referenceTitles: string[];
	hyperparameterIds: number[];
	examples: PracticeExamplePayload[];
	metrics: NormalizedAdminPracticeMetricPayload[];
};

function trimText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

function trimNullableText(value: unknown) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(value: unknown) {
	let parsedValue = Number.NaN;

	if (typeof value === "string") {
		parsedValue = Number.parseInt(value, 10);
	} else if (typeof value === "number") {
		parsedValue = value;
	}

	return Number.isInteger(parsedValue) ? parsedValue : null;
}

function parseNumber(value: unknown) {
	let parsedValue = Number.NaN;

	if (typeof value === "string" && value.trim()) {
		parsedValue = Number.parseFloat(value);
	} else if (typeof value === "number") {
		parsedValue = value;
	}

	return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseNullableNumber(value: unknown) {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	return parseNumber(value);
}

function uniqueTextList(values: unknown) {
	if (!Array.isArray(values)) {
		return [];
	}

	return Array.from(
		new Set(
			values
				.map((value) => trimText(value))
				.filter((value) => value.length > 0),
		),
	);
}

function uniqueIntegerList(values: unknown) {
	if (!Array.isArray(values)) {
		return [];
	}

	return Array.from(
		new Set(
			values
				.map((value) => parseInteger(value))
				.filter((value): value is number => value !== null && value > 0),
		),
	);
}

function normalizeExamples(examples: PracticeExamplePayload[] | undefined) {
	if (!Array.isArray(examples)) {
		return [];
	}

	return examples
		.map((example) => ({
			scenario: trimText(example.scenario),
			originalPrompts: trimText(example.originalPrompts),
			improvedPrompts: trimText(example.improvedPrompts),
			observations: trimText(example.observations),
		}))
		.filter((example) =>
			example.scenario || example.originalPrompts || example.improvedPrompts || example.observations,
		);
}

function normalizeMetrics(metrics: AdminPracticeMetricPayload[] | undefined) {
	if (!Array.isArray(metrics)) {
		return [];
	}

	return metrics
		.map((metric) => {
			const subtype = metric.subtype ?? "GENERIC";
			const confidence = parseNumber(metric.confidence);

			return {
				subtype,
				title: trimText(metric.title),
				value: trimText(metric.value),
				description: trimNullableText(metric.description),
				confidence,
				energy: metric.energy,
				accuracy: metric.accuracy,
			};
		})
		.filter((metric) => metric.title || metric.value || metric.description || metric.energy || metric.accuracy);
}

export function normalizeAdminPracticePayload(payload: AdminPracticePayload) {
	const practiceName = trimText(payload.practice?.name);
	const practiceDescription = trimText(payload.practice?.description);
	const practiceGreenScore = parseInteger(payload.practice?.greenScore);
	const practiceTactic = payload.practice?.tactic ?? null;
	
	const categoryNames = uniqueTextList(payload.categoryNames);
	
	const newCategoryName = trimText(payload.newCategory?.name);
	const newCategoryDescription = trimNullableText(payload.newCategory?.description);
	// Fixed: Default to "GREEN_PRACTICE" if missing, ensuring it fits TacticType
	const newCategoryTactic = payload.newCategory?.tactic ?? "GREEN_PRACTICE";
	
	const referenceMode = payload.reference?.mode ?? null;
	const referenceTitle = trimText(payload.reference?.title);
	const referenceAuthors = trimText(payload.reference?.authors);
	const referenceAbstract = trimNullableText(payload.reference?.abstract);
	const referenceKeywords = trimNullableText(payload.reference?.keywords);
	const referenceYear = parseInteger(payload.reference?.year);
	const referenceStudyType = trimText(payload.reference?.studyType);
	const referenceDomain = trimNullableText(payload.reference?.domain);
	const referenceTask = trimNullableText(payload.reference?.task);
	const referenceVenue = trimNullableText(payload.reference?.venue);
	const referenceToolAvailability = trimNullableText(payload.reference?.toolAvailability);
	const referenceLink = trimText(payload.reference?.link);
	
	const examples = normalizeExamples(payload.examples);

	if (!practiceName || !practiceDescription || practiceGreenScore === null || !practiceTactic) {
		return { error: "Practice title, description, green score, and tactic are required" };
	}

	if (practiceGreenScore < 0 || practiceGreenScore > 100) {
		return { error: "Green score must be between 0 and 100" };
	}

	if (categoryNames.length === 0 && !newCategoryName) {
		return { error: "At least one category selection or a new category is required" };
	}

	if (referenceMode !== "existing" && referenceMode !== "new") {
		return { error: "A reference mode is required" };
	}

	if (!referenceTitle) {
		return { error: "A reference title is required" };
	}

	let referencePayload: NormalizedAdminPracticePayload["reference"];

	if (referenceMode === "existing") {
		referencePayload = {
			mode: "existing",
			title: referenceTitle,
		};
	} else {
		if (!referenceAuthors || referenceYear === null || !referenceStudyType || !referenceLink) {
			return { error: "Reference authors, year, study type, and link are required for a new reference" };
		}

		referencePayload = {
			mode: "new",
			title: referenceTitle,
			authors: referenceAuthors,
			abstract: referenceAbstract,
			keywords: referenceKeywords,
			year: referenceYear,
			studyType: referenceStudyType,
			domain: referenceDomain,
			task: referenceTask,
			venue: referenceVenue,
			toolAvailability: referenceToolAvailability,
			link: referenceLink,
		};
	}

	for (const example of examples) {
		if (!example.scenario || !example.originalPrompts || !example.improvedPrompts || !example.observations) {
			return { error: "Each practice example must include a scenario, original prompts, improved prompts, and observations" };
		}
	}

	let newCategoryPayload: NormalizedAdminPracticePayload["newCategory"] = null;
	if (newCategoryName) {
		newCategoryPayload = {
			name: newCategoryName,
			description: newCategoryDescription,
			tactic: newCategoryTactic,
		};
	}

	return {
		value: {
			practice: {
				name: practiceName,
				description: practiceDescription,
				greenScore: practiceGreenScore,
				tactic: practiceTactic,
			},
			categoryNames,
			newCategory: newCategoryPayload,
			examples,
			reference: referencePayload,
		} satisfies NormalizedAdminPracticePayload,
	};
}

export function normalizeAdminPracticeUpdatePayload(payload: AdminPracticeUpdatePayload) {
	const practiceName = trimText(payload.practice?.name);
	const practiceDescription = trimText(payload.practice?.description);
	const practiceGreenScore = parseInteger(payload.practice?.greenScore);
	const practiceTactic = payload.practice?.tactic ?? null;
	const categoryNames = uniqueTextList(payload.categoryNames);
	const promptTechniqueNames = uniqueTextList(payload.promptTechniqueNames);
	const modelNames = uniqueTextList(payload.modelNames);
	const referenceTitles = uniqueTextList(payload.referenceTitles);
	const hyperparameterIds = uniqueIntegerList(payload.hyperparameterIds);
	const examples = normalizeExamples(payload.examples);
	const metrics = normalizeMetrics(payload.metrics);

	if (!practiceName || !practiceDescription || practiceGreenScore === null || !practiceTactic) {
		return { error: "Practice title, description, green score, and tactic are required" };
	}

	if (practiceGreenScore < 0 || practiceGreenScore > 100) {
		return { error: "Green score must be between 0 and 100" };
	}

	if (categoryNames.length === 0) {
		return { error: "At least one category is required" };
	}

	for (const example of examples) {
		if (!example.scenario || !example.originalPrompts || !example.improvedPrompts || !example.observations) {
			return { error: "Each practice example must include a scenario, original prompts, improved prompts, and observations" };
		}
	}

	const normalizedMetrics: NormalizedAdminPracticeMetricPayload[] = [];

	for (const metric of metrics) {
		if (metric.subtype !== "GENERIC" && metric.subtype !== "ENERGY" && metric.subtype !== "ACCURACY") {
			return { error: "Metric subtype must be generic, energy, or accuracy" };
		}

		if (!metric.title || !metric.value || metric.confidence === null) {
			return { error: "Each metric must include a title, value, and confidence" };
		}

		if (metric.confidence < 0 || metric.confidence > 1) {
			return { error: "Metric confidence must be between 0 and 1" };
		}

		let energy: NormalizedAdminPracticeMetricPayload["energy"] = null;
		let accuracy: NormalizedAdminPracticeMetricPayload["accuracy"] = null;

		if (metric.subtype === "ENERGY") {
			const bestGuessValue = parseNumber(metric.energy?.bestGuessValue);
			const minValue = parseNullableNumber(metric.energy?.minValue);
			const maxValue = parseNullableNumber(metric.energy?.maxValue);
			const unit = trimText(metric.energy?.unit) || "PERCENTAGE";

			if (!metric.energy?.type || bestGuessValue === null) {
				return { error: "Energy metrics must include a type and best guess value" };
			}

			energy = {
				type: metric.energy.type,
				minValue,
				maxValue,
				bestGuessValue,
				unit,
			};
		}

		if (metric.subtype === "ACCURACY") {
			const score = parseNullableNumber(metric.accuracy?.score);

			if (!metric.accuracy?.level) {
				return { error: "Accuracy metrics must include an accuracy level" };
			}

			accuracy = {
				level: metric.accuracy.level,
				score,
			};
		}

		normalizedMetrics.push({
			subtype: metric.subtype,
			title: metric.title,
			value: metric.value,
			description: metric.description,
			confidence: metric.confidence,
			energy,
			accuracy,
		});
	}

	return {
		value: {
			practice: {
				name: practiceName,
				description: practiceDescription,
				greenScore: practiceGreenScore,
				tactic: practiceTactic,
			},
			categoryNames,
			promptTechniqueNames,
			modelNames,
			referenceTitles,
			hyperparameterIds,
			examples,
			metrics: normalizedMetrics,
		} satisfies NormalizedAdminPracticeUpdatePayload,
	};
}

export async function createAdminPractice(
	tx: Prisma.TransactionClient,
	payload: NormalizedAdminPracticePayload,
	options: { createdFromRequestId?: number } = {},
) {
	const finalCategoryNames = [...payload.categoryNames];

	if (payload.newCategory) {
		const existingCategory = await tx.category.findUnique({ where: { name: payload.newCategory.name } });

		if (existingCategory) {
			throw new Error("That category already exists. Select it from the existing categories list instead.");
		}

		await tx.category.create({
			data: {
				name: payload.newCategory.name,
				description: payload.newCategory.description,
				tactic: payload.newCategory.tactic,
			},
		});

		if (!finalCategoryNames.includes(payload.newCategory.name)) {
			finalCategoryNames.push(payload.newCategory.name);
		}
	}

	for (const categoryName of payload.categoryNames) {
		const existingCategory = await tx.category.findUnique({ where: { name: categoryName } });

		if (!existingCategory) {
			throw new Error(`Selected category "${categoryName}" was not found`);
		}
	}

	let referenceTitle = payload.reference.title;

	if (payload.reference.mode === "existing") {
		const existingReference = await tx.reference.findUnique({ where: { title: referenceTitle } });

		if (!existingReference) {
			throw new Error("Selected reference was not found");
		}
		
		referenceTitle = existingReference.title;
	} else {
		const existingReference = await tx.reference.findUnique({ where: { title: referenceTitle } });

		if (existingReference) {
			throw new Error("That reference already exists. Select it from the existing references list instead.");
		}

		await tx.reference.create({
			data: {
				title: payload.reference.title,
				authors: payload.reference.authors,
				abstract: payload.reference.abstract,
				keywords: payload.reference.keywords,
				year: payload.reference.year,
				studyType: payload.reference.studyType,
				domain: payload.reference.domain,
				task: payload.reference.task,
				venue: payload.reference.venue,
				toolAvailability: payload.reference.toolAvailability,
				link: payload.reference.link,
			},
		});
	}

	return tx.practice.create({
		data: {
			name: payload.practice.name,
			description: payload.practice.description,
			greenScore: payload.practice.greenScore,
			tactic: payload.practice.tactic,
			createdFromRequestId: options.createdFromRequestId,
			categories: {
				create: finalCategoryNames.map((categoryName) => ({
					categoryName,
				})),
			},
			papers: {
				create: {
					referenceTitle,
				},
			},
			practiceExamples: payload.examples.length > 0
				? {
					create: payload.examples.map((example) => ({
						scenario: example.scenario,
						originalPrompts: example.originalPrompts,
						improvedPrompts: example.improvedPrompts,
						observations: example.observations,
					})),
				}
				: undefined,
		},
		select: { name: true },
	});
}

export async function updateAdminPractice(
	tx: Prisma.TransactionClient,
	originalPracticeName: string,
	payload: NormalizedAdminPracticeUpdatePayload,
) {
	const existingPractice = await tx.practice.findUnique({
		where: { name: originalPracticeName },
		select: { name: true },
	});

	if (!existingPractice) {
		throw new Error("PRACTICE_NOT_FOUND");
	}

	if (payload.practice.name !== originalPracticeName) {
		const duplicatePractice = await tx.practice.findUnique({
			where: { name: payload.practice.name },
			select: { name: true },
		});

		if (duplicatePractice) {
			throw new Error("PRACTICE_NAME_EXISTS");
		}
	}

	await tx.practiceCategory.deleteMany({ where: { practiceName: originalPracticeName } });
	await tx.practicePromptTechnique.deleteMany({ where: { practiceName: originalPracticeName } });
	await tx.practiceModel.deleteMany({ where: { practiceName: originalPracticeName } });
	await tx.paperPractice.deleteMany({ where: { practiceName: originalPracticeName } });
	await tx.hyperparameter.updateMany({
		where: { practiceName: originalPracticeName },
		data: { practiceName: null },
	});
	await tx.practiceExample.deleteMany({ where: { practiceName: originalPracticeName } });
	await tx.metric.deleteMany({ where: { practiceName: originalPracticeName } });

	const updatedPractice = await tx.practice.update({
		where: { name: originalPracticeName },
		data: payload.practice,
		select: { name: true },
	});

	if (payload.categoryNames.length > 0) {
		await tx.practiceCategory.createMany({
			data: payload.categoryNames.map((categoryName) => ({
				practiceName: updatedPractice.name,
				categoryName,
			})),
		});
	}

	if (payload.promptTechniqueNames.length > 0) {
		await tx.practicePromptTechnique.createMany({
			data: payload.promptTechniqueNames.map((promptTechniqueName) => ({
				practiceName: updatedPractice.name,
				promptTechniqueName,
			})),
		});
	}

	if (payload.modelNames.length > 0) {
		await tx.practiceModel.createMany({
			data: payload.modelNames.map((modelName) => ({
				practiceName: updatedPractice.name,
				modelName,
			})),
		});
	}

	if (payload.referenceTitles.length > 0) {
		await tx.paperPractice.createMany({
			data: payload.referenceTitles.map((referenceTitle) => ({
				practiceName: updatedPractice.name,
				referenceTitle,
			})),
		});
	}

	if (payload.hyperparameterIds.length > 0) {
		await tx.hyperparameter.updateMany({
			where: { id: { in: payload.hyperparameterIds } },
			data: { practiceName: updatedPractice.name },
		});
	}

	if (payload.examples.length > 0) {
		await tx.practiceExample.createMany({
			data: payload.examples.map((example) => ({
				practiceName: updatedPractice.name,
				scenario: example.scenario,
				originalPrompts: example.originalPrompts,
				improvedPrompts: example.improvedPrompts,
				observations: example.observations,
			})),
		});
	}

	for (const metric of payload.metrics) {
		await tx.metric.create({
			data: {
				practiceName: updatedPractice.name,
				subtype: metric.subtype,
				title: metric.title,
				value: metric.value,
				description: metric.description,
				confidence: metric.confidence,
				energyMetrics: metric.energy
					? {
						create: metric.energy,
					}
					: undefined,
				accuracyMetrics: metric.accuracy
					? {
						create: metric.accuracy,
					}
					: undefined,
			},
		});
	}

	return updatedPractice;
}