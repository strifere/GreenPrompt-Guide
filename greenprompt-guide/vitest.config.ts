import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html", "lcov"],
      provider: "v8",
      exclude: [
        "app/admin/requests/[requestId]/llm-analysis-panel.tsx",
        "node_modules/",
        "tests/",
        "prisma.config.ts",
        "vitest.config.ts",
          "vitest.setup.ts",
          "eslint.config.mjs",
        "fonts.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  css: {
    modules: {
      generateScopedName: "[name]__[local]",
    },
  },
});
