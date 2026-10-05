import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";
import * as espree from "espree";
const eslintConfig = defineConfig([
  // Preserve Next/React/accessibility policy while adapting legacy rule APIs
  // removed in ESLint 10. Peer overrides in package.json cover only these
  // shimmed plugins; installation must not use force or legacy-peer-deps.
  ...fixupConfigRules(nextVitals),
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      // This repo is plain JS/JSX. Next's bundled Babel scope manager still
      // targets ESLint 9; Espree supplies the compatible ESLint 10 scope tree.
      parser: espree,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true, globalReturn: false },
      },
    },
  },
  {
    // The CommonJS launcher intentionally returns early at top level. Keep
    // that exception here, not across the ESM app and engine.
    files: ["cli/cli.js"],
    languageOptions: {
      sourceType: "commonjs",
      parserOptions: { sourceType: "script", ecmaFeatures: { globalReturn: true } },
    },
  },
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
  {
    plugins: {
      "react-hooks": fixupPluginRules(reactHooks),
    },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
