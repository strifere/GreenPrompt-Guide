import { describe, expect, it, vi } from "vitest";
import { updateAdminPractice, type NormalizedAdminPracticeUpdatePayload } from "@/lib/admin-practice-creation";

function buildPayload(): NormalizedAdminPracticeUpdatePayload {
	return {
		practice: {
			name: "Updated practice",
			description: "Updated description",
			greenScore: 91,
			tactic: "GREEN_PRACTICE",
		},
		categoryNames: ["Evaluation", "Prompt Compression"],
		promptTechniqueNames: ["Few-shot"],
		modelNames: ["GPT-4o-mini"],
		referenceTitles: ["Low-energy Prompt Engineering"],
		hyperparameterIds: [10, 11],
		examples: [
			{
				scenario: "Summarization",
				originalPrompts: "Summarize this.",
				improvedPrompts: "Summarize in five bullets.",
				observations: "Lower token use.",
			},
		],
		metrics: [
			{
				subtype: "ENERGY",
				title: "Energy reduction",
				value: "-20%",
				description: null,
				confidence: 0.8,
				energy: {
					type: "REDUCTION",
					minValue: 10,
					maxValue: 25,
					bestGuessValue: 20,
					unit: "PERCENTAGE",
				},
				accuracy: null,
			},
			{
				subtype: "ACCURACY",
				title: "Accuracy retained",
				value: "Same or better",
				description: "No observed loss.",
				confidence: 0.7,
				energy: null,
				accuracy: {
					level: "SAME_OR_BETTER",
					score: 0.84,
				},
			},
		],
	};
}

function buildTx() {
	return {
		practice: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		practiceCategory: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		practicePromptTechnique: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		practiceModel: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		paperPractice: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		hyperparameter: {
			updateMany: vi.fn(),
		},
		practiceExample: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		metric: {
			deleteMany: vi.fn(),
			create: vi.fn(),
		},
	};
}

describe("updateAdminPractice", () => {
	it("replaces joins, hyperparameter attachments, examples, and metrics", async () => {
		const tx = buildTx();
		tx.practice.findUnique.mockResolvedValueOnce({ name: "Original practice" }).mockResolvedValueOnce(null);
		tx.practice.update.mockResolvedValueOnce({ name: "Updated practice" });

		const result = await updateAdminPractice(tx as never, "Original practice", buildPayload());

		expect(result).toEqual({ name: "Updated practice" });
		expect(tx.practice.findUnique).toHaveBeenNthCalledWith(1, {
			where: { name: "Original practice" },
			select: { name: true },
		});
		expect(tx.practice.findUnique).toHaveBeenNthCalledWith(2, {
			where: { name: "Updated practice" },
			select: { name: true },
		});
		expect(tx.practiceCategory.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.practicePromptTechnique.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.practiceModel.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.paperPractice.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.hyperparameter.updateMany).toHaveBeenNthCalledWith(1, {
			where: { practiceName: "Original practice" },
			data: { practiceName: null },
		});
		expect(tx.practiceExample.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.metric.deleteMany).toHaveBeenCalledWith({ where: { practiceName: "Original practice" } });
		expect(tx.practice.update).toHaveBeenCalledWith({
			where: { name: "Original practice" },
			data: buildPayload().practice,
			select: { name: true },
		});
		expect(tx.practiceCategory.createMany).toHaveBeenCalledWith({
			data: [
				{ practiceName: "Updated practice", categoryName: "Evaluation" },
				{ practiceName: "Updated practice", categoryName: "Prompt Compression" },
			],
		});
		expect(tx.practicePromptTechnique.createMany).toHaveBeenCalledWith({
			data: [{ practiceName: "Updated practice", promptTechniqueName: "Few-shot" }],
		});
		expect(tx.practiceModel.createMany).toHaveBeenCalledWith({
			data: [{ practiceName: "Updated practice", modelName: "GPT-4o-mini" }],
		});
		expect(tx.paperPractice.createMany).toHaveBeenCalledWith({
			data: [{ practiceName: "Updated practice", referenceTitle: "Low-energy Prompt Engineering" }],
		});
		expect(tx.hyperparameter.updateMany).toHaveBeenNthCalledWith(2, {
			where: { id: { in: [10, 11] } },
			data: { practiceName: "Updated practice" },
		});
		expect(tx.practiceExample.createMany).toHaveBeenCalledWith({
			data: [
				{
					practiceName: "Updated practice",
					scenario: "Summarization",
					originalPrompts: "Summarize this.",
					improvedPrompts: "Summarize in five bullets.",
					observations: "Lower token use.",
				},
			],
		});
		expect(tx.metric.create).toHaveBeenCalledTimes(2);
		expect(tx.metric.create).toHaveBeenNthCalledWith(1, {
			data: expect.objectContaining({
				practiceName: "Updated practice",
				subtype: "ENERGY",
				energyMetrics: { create: buildPayload().metrics[0].energy },
				accuracyMetrics: undefined,
			}),
		});
		expect(tx.metric.create).toHaveBeenNthCalledWith(2, {
			data: expect.objectContaining({
				practiceName: "Updated practice",
				subtype: "ACCURACY",
				energyMetrics: undefined,
				accuracyMetrics: { create: buildPayload().metrics[1].accuracy },
			}),
		});
	});

	it("throws when the original practice does not exist", async () => {
		const tx = buildTx();
		tx.practice.findUnique.mockResolvedValueOnce(null);

		await expect(updateAdminPractice(tx as never, "Missing", buildPayload())).rejects.toThrow("PRACTICE_NOT_FOUND");
	});

	it("throws when a renamed practice title already exists", async () => {
		const tx = buildTx();
		tx.practice.findUnique.mockResolvedValueOnce({ name: "Original practice" }).mockResolvedValueOnce({ name: "Updated practice" });

		await expect(updateAdminPractice(tx as never, "Original practice", buildPayload())).rejects.toThrow("PRACTICE_NAME_EXISTS");
	});
});
