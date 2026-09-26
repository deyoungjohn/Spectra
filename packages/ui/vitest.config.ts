import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    root: path.resolve(import.meta.dirname, "."),
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
