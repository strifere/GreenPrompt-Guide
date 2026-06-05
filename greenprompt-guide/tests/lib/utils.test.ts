import { secureTrim } from "@/lib/utils";
import { describe, expect, it } from "vitest";

  describe("lib/utils", () => {
    describe("secureTrim", () => {
        it("should trim whitespace from a string", () => {
            expect(secureTrim("  hello world  ")).toBe("hello world");
        });

        it("should return an empty string for a string with only whitespace", () => {
            expect(secureTrim("   ")).toBe("");
        });

        it("should return an empty string for a non-string value", () => {
            expect(secureTrim(123)).toBe("");
            expect(secureTrim({})).toBe("");
            expect(secureTrim([])).toBe("");
        });

        it("should return an empty string for null or undefined", () => {
            expect(secureTrim(null)).toBe("");
            expect(secureTrim(undefined)).toBe("");
        });

        it("should return the string if it has no leading/trailing whitespace", () => {
            expect(secureTrim("no-whitespace")).toBe("no-whitespace");
        });
    });
  });