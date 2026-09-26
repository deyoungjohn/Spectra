// eslint.config.js
//
// ESLint flat config with financial math lint rules.
// Reference: Spectra.md §5.2.2
//
// These rules prevent floating-point arithmetic on financial values.

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Block parseFloat and Number globals to prevent floating-point
      // financial math. Use parseToFixed18() and BigInt instead.
      "no-restricted-globals": [
        "error",
        {
          name: "parseFloat",
          message: "Use parseToFixed18() from @spectra/core/normalize. Never use floating-point for financial values.",
        },
        {
          name: "Number",
          message: "Use BigInt and fixed-point math from @spectra/core/normalize for financial values.",
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      "**/node_modules/**",
      ".git/**",
    ],
  },
);
