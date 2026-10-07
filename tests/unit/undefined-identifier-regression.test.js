// Regression: these identifiers were referenced but never defined/imported, so the
// dashboard routes threw ReferenceError at runtime while the existing lint config
// (no-undef is not enabled by eslint-config-next) reported a clean run.
import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import config from "../../eslint.config.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: config });

// Files that shipped a runtime ReferenceError from an undefined identifier.
const AFFECTED = [
  "src/app/(dashboard)/dashboard/providers/components/ModelsCard.js",
  "src/app/(dashboard)/dashboard/combos/page.js",
  "src/app/(dashboard)/dashboard/cli-tools/components/ClineToolCard.js",
  "src/sse/handlers/chat.js",
];

describe("dashboard/app sources have no undefined identifiers", () => {
  it.each(AFFECTED)("%s", async (file) => {
    const results = await eslint.lintFiles([file]);
    const undef = results.flatMap((r) => r.messages).filter((m) => m.ruleId === "no-undef");
    expect(undef.map((m) => `${m.line}:${m.message}`)).toEqual([]);
  });
});

describe("eslint config enforces no-undef for app sources", () => {
  it("reports an undefined identifier in an app-scoped file", async () => {
    const results = await eslint.lintText(
      "export default function Example() { return missingIdentifier; }",
      { filePath: "src/shared/no-undef-fixture.js" }
    );
    const undef = results.flatMap((r) => r.messages).filter((m) => m.ruleId === "no-undef");
    expect(undef).toHaveLength(1);
  });
});