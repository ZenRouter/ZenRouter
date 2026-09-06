import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-cli-build/**",
    "cli/app/.next-cli-build/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Data-definition modules intentionally use anonymous default exports:
  // provider registries are single-object descriptors consumed via the
  // auto-generated static import list (see open-sse/AGENTS.md), and DB
  // migrations export a single migration descriptor. Naming each one adds
  // churn with no debuggability gain, so the rule is scoped off here.
  {
    files: ["open-sse/**/*.js", "src/lib/**/*.js"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
]);

export default eslintConfig;
