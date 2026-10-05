import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import config from "../../eslint.config.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: config });
const components = [
  "src/app/(dashboard)/dashboard/cli-tools/components/CodexToolCard.js",
  "src/app/(dashboard)/dashboard/cli-tools/components/ClaudeToolCard.js",
  "src/shared/components/OAuthModal.js",
];

describe("React warning regressions", () => {
  it.each(components)("keeps %s free of hooks and hydration diagnostics", async (file) => {
    const results = await eslint.lintFiles([file]);
    expect(results.flatMap((result) => result.messages)).toEqual([]);
  });

  it("still detects synchronous derived state in effects", async () => {
    const results = await eslint.lintText(
      'import { useEffect, useState } from "react"; export default function Example({ value }) { const [draft, setDraft] = useState(value); useEffect(() => { setDraft(value); }, [value]); return <span>{draft}</span>; }',
      { filePath: "src/react-warning-control.jsx" },
    );
    expect(results.flatMap((result) => result.messages)).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "react-hooks/set-state-in-effect" }),
    ]));
  });
});
