import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  // Patterns are `**/`-prefixed so nested Next.js workspaces (e.g. gitbook/)
  // have their build output ignored too — a bare `.next/**` only matches the
  // repo root, which let generated turbopack chunks fail the lint run.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/.next-cli-build/**",
    "**/out/**",
    "**/build/**",
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
