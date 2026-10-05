import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import config from "../../eslint.config.mjs";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../..", import.meta.url));
const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: config });

async function messages(source, file = "src/lint-policy-fixture.jsx") {
  const results = await eslint.lintText(source, { filePath: file });
  return results.flatMap((result) => result.messages);
}

describe("ESLint stable-toolchain policy", () => {
  it("uses the installed ESLint 10 stable major", () => {
    expect(require("eslint/package.json").version.split(".")[0]).toBe("10");
  });

  it("keeps Next image guidance and accessibility diagnostics active", async () => {
    const findings = await messages('export default function Example() { return <img src="/fixture.png" />; }');
    expect(findings.some((message) => message.fatal)).toBe(false);
    expect(findings.map((message) => message.ruleId)).toEqual(expect.arrayContaining([
      "@next/next/no-img-element", "jsx-a11y/alt-text",
    ]));
  });

  it("keeps React hooks enforcement active with the compatibility shim", async () => {
    const findings = await messages('import { useState } from "react"; export default function Example({ enabled }) { if (enabled) useState(0); return null; }');
    expect(findings.some((message) => message.fatal)).toBe(false);
    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "react-hooks/rules-of-hooks", severity: 2 }),
    ]));
  });

  it("keeps anonymous default export policy outside the existing data-module exemption", async () => {
    const findings = await messages("export default {};", "src/shared/lint-policy-fixture.js");
    expect(findings.map((message) => message.ruleId)).toContain("import/no-anonymous-default-export");
    const exempt = await messages("export default {};", "open-sse/lint-policy-fixture.js");
    expect(exempt.map((message) => message.ruleId)).not.toContain("import/no-anonymous-default-export");
  });

  it("accepts the CLI's CommonJS top-level return without weakening ESM parsing", async () => {
    const cli = await messages("const fs = require('node:fs'); if (!fs) return;", "cli/cli.js");
    expect(cli.some((message) => message.fatal)).toBe(false);
    const esm = await messages("return; export default {};", "src/shared/lint-policy-fixture.js");
    expect(esm.some((message) => message.fatal)).toBe(true);
  });
});
