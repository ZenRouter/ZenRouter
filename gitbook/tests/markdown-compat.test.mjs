import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildSync } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requireDocs = createRequire(import.meta.url);

function renderMarkdown(content) {
  const filename = fileURLToPath(new URL("../utils/markdown.js", import.meta.url));
  const bundle = buildSync({
    entryPoints: [filename],
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    loader: { ".js": "jsx" },
    external: ["react", "react-dom", "react/jsx-runtime"],
    write: false,
  });
  const fixtureModule = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, { module: fixtureModule, exports: fixtureModule.exports, require: requireDocs, console, URL, TextEncoder, TextDecoder }, { filename });
  return renderToStaticMarkup(createElement(fixtureModule.exports.MarkdownRenderer, { content }));
}

describe("docs markdown stable compatibility", () => {
  it("renders markdown under the existing stylesheet class with react-markdown 10", () => {
    const html = renderMarkdown("# Introduction\n\n## Detail\n\n**Rendered content**");
    assert.ok(html.includes('class="markdown-content"'));
    assert.ok(html.includes('<h1 id="introduction"'));
    assert.ok(html.includes('<h2 id="detail"'));
    assert.ok(html.includes("<strong>Rendered content</strong>"));
    assert.ok(html.includes("<svg"));
  });

  it("retains GFM tables and syntax highlighting", () => {
    const html = renderMarkdown("| Name | Value |\n| --- | --- |\n| fixture | stable |\n\n```js\nconst fixture = true;\n```");
    assert.ok(html.includes("<table>"));
    assert.ok(html.includes("<td>stable</td>"));
    assert.ok(html.includes("hljs-keyword"));
  });
});
