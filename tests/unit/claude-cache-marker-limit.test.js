// Anthropic allows at most 4 cache_control markers per request (#3795).
// anchorClaudeCache must strip client markers and re-anchor its own so the
// translated body never exceeds the limit, even when the client already
// sends the maximum of 4.
import { describe, it, expect } from "vitest";
import { anchorClaudeCache } from "../../open-sse/translator/formats/claude.js";

const MARK = { type: "text", text: "x", cache_control: { type: "ephemeral" } };

function countMarkers(body) {
  let n = 0;
  for (const block of body.system || []) if (block?.cache_control) n += 1;
  for (const tool of body.tools || []) if (tool?.cache_control) n += 1;
  for (const msg of body.messages || []) {
    for (const block of msg.content || []) if (block?.cache_control) n += 1;
  }
  return n;
}

describe("anchorClaudeCache marker budget (#3795)", () => {
  it("never exceeds 4 markers when the client already sends 4", () => {
    const body = {
      system: [{ ...MARK }, { ...MARK }],
      tools: [
        { name: "a", cache_control: { type: "ephemeral" } },
        { name: "b", cache_control: { type: "ephemeral" } },
      ],
      messages: [
        { role: "user", content: [{ type: "text", text: "hi" }] },
        { role: "assistant", content: [{ type: "text", text: "ok" }] },
      ],
    };
    expect(countMarkers(body)).toBe(4);
    const out = anchorClaudeCache(body);
    expect(countMarkers(out)).toBeLessThanOrEqual(4);
  });

  it("re-anchors system + tools + last assistant within budget", () => {
    const out = anchorClaudeCache({
      system: [{ type: "text", text: "sys" }],
      tools: [{ name: "a" }, { name: "b" }],
      messages: [
        { role: "user", content: [{ type: "text", text: "hi" }] },
        { role: "assistant", content: [{ type: "text", text: "ok" }] },
      ],
    });
    expect(countMarkers(out)).toBe(3);
  });
});
