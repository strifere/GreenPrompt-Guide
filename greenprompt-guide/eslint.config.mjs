import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "vitest.setup.ts",
    "eslint.config.mjs",
  ]),
  {
    files: ["**/*.{ts,tsx}"], // Apply to all TypeScript and TypeScript React files
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_"
        }
      ]
    },
  },
  // Allow explicit any in test files for mocking purposes
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // This rule is already defined above, so it will override it
      // or simply be redundant if the patterns are the same.
      // Keeping it here for clarity of previous intent.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_"
        }
      ]
    },
  },
]);

export default eslintConfig;
