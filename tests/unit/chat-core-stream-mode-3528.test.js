import { describe, expect, it } from "vitest";
import { clientRequestedStreaming } from "../../open-sse/handlers/chatCore/streamMode.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("clientRequestedStreaming (#3528 / #3492)", () => {
  it("returns false when stream key is absent", () => {
    expect(clientRequestedStreaming({ messages: [] }, FORMATS.OPENAI)).toBe(false);
  });

  it("returns true when stream key is explicitly true", () => {
    expect(clientRequestedStreaming({ stream: true }, FORMATS.OPENAI)).toBe(true);
  });

  it("returns false when stream key is explicitly false", () => {
    expect(clientRequestedStreaming({ stream: false }, FORMATS.OPENAI)).toBe(false);
  });

  it("returns true for Gemini formats even when stream is omitted", () => {
    expect(clientRequestedStreaming({}, FORMATS.GEMINI)).toBe(true);
    expect(clientRequestedStreaming({}, FORMATS.GEMINI_CLI)).toBe(true);
  });

  it("returns true for Antigravity even when stream is omitted", () => {
    expect(clientRequestedStreaming({}, FORMATS.ANTIGRAVITY)).toBe(true);
  });

  it("returns false for OpenAI/Claude/anthropic-format when stream is omitted", () => {
    expect(clientRequestedStreaming({}, FORMATS.CLAUDE)).toBe(false);
    expect(clientRequestedStreaming({}, FORMATS.OPENAI_RESPONSES)).toBe(false);
  });

  it("handles null or non-object body gracefully", () => {
    expect(clientRequestedStreaming(null, FORMATS.OPENAI)).toBe(false);
    expect(clientRequestedStreaming(undefined, FORMATS.OPENAI)).toBe(false);
  });

  it("explicit false overrides Gemini surface default", () => {
    expect(clientRequestedStreaming({ stream: false }, FORMATS.GEMINI)).toBe(false);
  });
});
