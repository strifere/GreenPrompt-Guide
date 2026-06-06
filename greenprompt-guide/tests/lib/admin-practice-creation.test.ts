import {
    normalizeAdminPracticePayload,
    normalizeAdminPracticeUpdatePayload,
    createAdminPractice,
    updateAdminPractice,
  } from "@/lib/admin-practice-creation";
  import { describe, it, expect, vi } from "vitest";
  
  describe("admin-practice-creation", () => {
    const validPracticePayload = {
      practice: {
        name: "Test Practice",
        description: "A description",
        greenScore: 50,
        tactic: "GREEN_PRACTICE",
      },
      categoryNames: ["Category 1"],
      reference: {
        mode: "new",
        title: "Reference Title",
        authors: "An Author",
        year: 2023,
        studyType: "Case Study",
        link: "http://example.com",
      },
      examples: [],
    };
  
    describe("normalizeAdminPracticePayload", () => {
      it("should normalize a valid payload", () => {
        const result = normalizeAdminPracticePayload(validPracticePayload);
        expect(result.error).toBeUndefined();
        expect(result.value).toBeDefined();
      });
  
      it("should return an error for missing practice details", () => {
        const result = normalizeAdminPracticePayload({ ...validPracticePayload, practice: {} });
        expect(result.error).toBe("Practice title, description, green score, and tactic are required");
      });
  
      it("should return an error for invalid green score", () => {
        const result = normalizeAdminPracticePayload({ ...validPracticePayload, practice: { ...validPracticePayload.practice, greenScore: 101 } });
        expect(result.error).toBe("Green score must be between 0 and 100");
      });
  
      it("should return an error for no categories", () => {
        const result = normalizeAdminPracticePayload({ ...validPracticePayload, categoryNames: [] });
        expect(result.error).toBe("At least one category selection or a new category is required");
      });
  
      it("should return an error for missing reference title", () => {
        const result = normalizeAdminPracticePayload({ ...validPracticePayload, reference: { ...validPracticePayload.reference, title: "" } });
        expect(result.error).toBe("A reference title is required");
      });
  
      it("should return an error for incomplete new reference", () => {
        const result = normalizeAdminPracticePayload({ ...validPracticePayload, reference: { ...validPracticePayload.reference, authors: "" } });
        expect(result.error).toBe("Reference authors, year, study type, and link are required for a new reference");
      });

      it("should handle existing reference mode", () => {
        const payload = { ...validPracticePayload, reference: { mode: "existing", title: "Existing Ref" } };
        const result = normalizeAdminPracticePayload(payload as any);
        expect(result.error).toBeUndefined();
        expect((result.value as any).reference.mode).toBe("existing");
      });

      it("should handle new category", () => {
        const payload = { ...validPracticePayload, categoryNames: [], newCategory: { name: "New Cat", tactic: "GREEN_PRACTICE" } };
        const result = normalizeAdminPracticePayload(payload as any);
        expect(result.error).toBeUndefined();
        expect((result.value as any).newCategory.name).toBe("New Cat");
      });

      it("should return an error for invalid example", () => {
        const payload = { ...validPracticePayload, examples: [{ scenario: "incomplete" }] };
        const result = normalizeAdminPracticePayload(payload as any);
        expect(result.error).toBe("Each practice example must include a scenario, original prompts, improved prompts, and observations");
      });
    });
  
    const validUpdatePayload = {
      practice: {
        name: "Test Practice",
        description: "A description",
        greenScore: 50,
        tactic: "GREEN_PRACTICE",
      },
      categoryNames: ["Category 1"],
      metrics: [],
      examples: [],
    };
  
    describe("normalizeAdminPracticeUpdatePayload", () => {
      it("should normalize a valid update payload", () => {
        const result = normalizeAdminPracticeUpdatePayload(validUpdatePayload);
        expect(result.error).toBeUndefined();
        expect(result.value).toBeDefined();
      });
  
      it("should return an error for missing practice details", () => {
        const result = normalizeAdminPracticeUpdatePayload({ ...validUpdatePayload, practice: {} });
        expect(result.error).toBe("Practice title, description, green score, and tactic are required");
      });
  
      it("should return an error for no categories", () => {
        const result = normalizeAdminPracticeUpdatePayload({ ...validUpdatePayload, categoryNames: [] });
        expect(result.error).toBe("At least one category is required");
      });
  
      it("should return an error for incomplete metrics", () => {
        const result = normalizeAdminPracticeUpdatePayload({
          ...validUpdatePayload,
          metrics: [{ subtype: "GENERIC", title: "metric" }],
        });
        expect(result.error).toBe("Each metric must include a title, value, and confidence");
      });

      it("should normalize energy metrics", () => {
        const payload = { ...validUpdatePayload, metrics: [{
            subtype: "ENERGY",
            title: "Energy Metric",
            value: "10",
            confidence: 0.8,
            energy: { type: "COMPUTATIONAL_EFFICIENCY", bestGuessValue: 10, unit: "J" }
        }]};
        const result = normalizeAdminPracticeUpdatePayload(payload as any);
        expect(result.error).toBeUndefined();
        expect((result.value as any).metrics[0].subtype).toBe("ENERGY");
      });

      it("should return an error for incomplete energy metric", () => {
        const payload = { ...validUpdatePayload, metrics: [{
            subtype: "ENERGY",
            title: "Energy Metric",
            value: "10",
            confidence: 0.8,
            energy: { unit: "J" }
        }]};
        const result = normalizeAdminPracticeUpdatePayload(payload as any);
        expect(result.error).toBe("Energy metrics must include a type and best guess value");
      });
    });
  
    describe("createAdminPractice", () => {
        const mockTx = {
            category: { findUnique: vi.fn(), create: vi.fn() },
            reference: { findUnique: vi.fn(), create: vi.fn() },
            practice: { create: vi.fn() },
        };

        it("should create a practice with new category and reference", async () => {
            const { value: payload } = normalizeAdminPracticePayload(validPracticePayload);
            mockTx.category.findUnique.mockImplementation((query: any) => {
                if (query.where.name === 'Category 1') {
                    return Promise.resolve({ name: 'Category 1' });
                }
                return Promise.resolve(null);
            });
            mockTx.reference.findUnique.mockResolvedValue(null);
            mockTx.practice.create.mockResolvedValue({ name: "Test Practice" });

            await createAdminPractice(mockTx as any, payload as any);

            expect(mockTx.practice.create).toHaveBeenCalled();
        });

        it("should throw if new category exists", async () => {
            const payload = { ...validPracticePayload, newCategory: { name: "Existing Cat" } };
            const { value: normalizedPayload } = normalizeAdminPracticePayload(payload as any);
            mockTx.category.findUnique.mockResolvedValue({ name: "Existing Cat" });
            
            await expect(createAdminPractice(mockTx as any, normalizedPayload as any)).rejects.toThrow("That category already exists");
        });
    });

    describe("updateAdminPractice", () => {
        const mockTx = {
            practice: { findUnique: vi.fn(), update: vi.fn() },
            practiceCategory: { deleteMany: vi.fn(), createMany: vi.fn() },
            practicePromptTechnique: { deleteMany: vi.fn(), createMany: vi.fn() },
            practiceModel: { deleteMany: vi.fn(), createMany: vi.fn() },
            paperPractice: { deleteMany: vi.fn(), createMany: vi.fn() },
            hyperparameter: { updateMany: vi.fn() },
            practiceExample: { deleteMany: vi.fn(), createMany: vi.fn() },
            metric: { deleteMany: vi.fn(), create: vi.fn() },
        };
        const { value: updatePayload } = normalizeAdminPracticeUpdatePayload(validUpdatePayload);

        it("should update a practice", async () => {
            mockTx.practice.findUnique.mockResolvedValue({ name: "Test Practice" });
            mockTx.practice.update.mockResolvedValue({ name: "Test Practice" });
            
            await updateAdminPractice(mockTx as any, "Test Practice", updatePayload as any);

            expect(mockTx.practice.update).toHaveBeenCalled();
            expect(mockTx.practiceCategory.deleteMany).toHaveBeenCalled();
            expect(mockTx.practiceCategory.createMany).toHaveBeenCalled();
        });

        it("should throw if practice not found", async () => {
            mockTx.practice.findUnique.mockResolvedValue(null);
            await expect(updateAdminPractice(mockTx as any, "Non-existent", updatePayload as any)).rejects.toThrow("PRACTICE_NOT_FOUND");
        });

        it("should throw if new practice name exists", async () => {
            mockTx.practice.findUnique
                .mockResolvedValueOnce({ name: "Test Practice" })
                .mockResolvedValueOnce({ name: "New Name" });
            const payload = { ...updatePayload, practice: { ...updatePayload?.practice, name: "New Name" } };
            await expect(updateAdminPractice(mockTx as any, "Test Practice", payload as any)).rejects.toThrow("PRACTICE_NAME_EXISTS");
        });
    });
  });
  