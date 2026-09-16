import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/tests/test-utils";

const requireAdminMock = vi.hoisted(() => vi.fn());
const normalizeAdminPracticePayloadMock = vi.hoisted(() => vi.fn());
const createAdminPracticeMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
	$transaction: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
	requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/admin-practice-creation", () => ({
	createAdminPractice: createAdminPracticeMock,
	normalizeAdminPracticePayload: normalizeAdminPracticePayloadMock,
}));

vi.mock("@/lib/prisma", () => ({
	prisma: prismaMock,
}));

import { POST } from "@/app/api/admin/practices/route";

describe("POST /api/admin/practices", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		prismaMock.$transaction.mockImplementation((callback) => callback("tx"));
	});

	it("creates a standalone practice for an admin user", async () => {
		const normalizedPayload = {
			practice: {
				name: "Constraint-first prompting",
				description: "Ask the model to satisfy constraints before drafting.",
				greenScore: 80,
				tactic: "GREEN_PRACTICE",
			},
			category: {
				mode: "existing",
				name: "Prompting",
				description: null,
				tactic: null,
			},
			examples: [],
			reference: {
				title: "Prompting paper",
				authors: "Ana",
				abstract: null,
				keywords: null,
				year: 2026,
				studyType: "Case study",
				domain: null,
				task: null,
				venue: null,
				toolAvailability: null,
				link: "https://example.com/paper",
			},
		};

		requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
		normalizeAdminPracticePayloadMock.mockReturnValueOnce({ value: normalizedPayload });
		createAdminPracticeMock.mockResolvedValueOnce({ name: "Constraint-first prompting" });

		const response = await POST(
			createJsonRequest("/api/admin/practices", { practice: { name: "Constraint-first prompting" } }),
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ practice: { name: "Constraint-first prompting" } });
		expect(createAdminPracticeMock).toHaveBeenCalledWith("tx", normalizedPayload);
	});

	it("returns validation errors before creating a practice", async () => {
		requireAdminMock.mockResolvedValueOnce({ ok: true, username: "victor" });
		normalizeAdminPracticePayloadMock.mockReturnValueOnce({ error: "Practice title, description, green score, and tactic are required" });

		const response = await POST(createJsonRequest("/api/admin/practices", {}));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Practice title, description, green score, and tactic are required" });
		expect(prismaMock.$transaction).not.toHaveBeenCalled();
	});

	it("requires an admin user", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		requireAdminMock.mockResolvedValueOnce({ ok: false, response: authResponse });

		const response = await POST(createJsonRequest("/api/admin/practices", {}));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "Forbidden" });
		expect(normalizeAdminPracticePayloadMock).not.toHaveBeenCalled();
		expect(prismaMock.$transaction).not.toHaveBeenCalled();
	});
});
