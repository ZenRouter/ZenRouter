import { beforeAll, describe, expect, it } from "vitest";
import { FORMATS } from "open-sse/translator/formats.js";
import { initState, initTranslators, translateResponse } from "open-sse/translator/index.js";

function run(chunks) {
  const state = initState(FORMATS.CLAUDE);
  const events = [];
  for (const chunk of chunks) events.push(...(translateResponse(FORMATS.OPENAI, FORMATS.CLAUDE, chunk, state) || []));
  events.push(...(translateResponse(FORMATS.OPENAI, FORMATS.CLAUDE, null, state) || []));
  return events;
}

const chunk = (delta, finish_reason = null) => ({ id: "chatcmpl-1", choices: [{ index: 0, delta, finish_reason }] });

describe("OpenAI to Claude repeated finish (#3520)", () => {
  beforeAll(async () => { await initTranslators(); });

  it("emits buffered tool JSON and terminal events only once", () => {
    const events = run([
      chunk({ tool_calls: [{ index: 0, id: "call_1", function: { name: "Bash", arguments: '{"command":"ls"}' } }] }),
      chunk({}, "tool_calls"),
      { ...chunk({}, "tool_calls"), usage: { prompt_tokens: 5, completion_tokens: 2 } },
    ]);
    const inputDeltas = events.filter((event) => event.type === "content_block_delta" && event.delta?.type === "input_json_delta");
    expect(inputDeltas).toHaveLength(1);
    expect(() => JSON.parse(inputDeltas.map((event) => event.delta.partial_json).join(""))).not.toThrow();
    expect(events.filter((event) => event.type === "message_stop")).toHaveLength(1);
  });

  it("closes a plain text response only once", () => {
    const events = run([chunk({ content: "ok" }), chunk({}, "stop"), chunk({}, "stop")]);
    expect(events.filter((event) => event.type === "message_stop")).toHaveLength(1);
    expect(events.filter((event) => event.type === "content_block_stop")).toHaveLength(1);
  });
});