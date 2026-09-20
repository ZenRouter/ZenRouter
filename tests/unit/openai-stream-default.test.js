import { describe, expect, it } from "vitest";
import { clientRequestedStreaming } from "../../open-sse/handlers/chatCore/streamMode.js";
import { detectFormatByEndpoint, FORMATS } from "../../open-sse/translator/formats.js";

describe("OpenAI default stream mode (#4122)", () => {
  it("detects /v1/chat/completions as FORMATS.OPENAI regardless of input presence", () => {
    expect(detectFormatByEndpoint("/v1/chat/completions", {})).toBe(FORMATS.OPENAI);
    expect(detectFormatByEndpoint("/api/v1/chat/completions", { messages: [] })).toBe(FORMATS.OPENAI);
  });

  it("treats omitted stream as non-streaming (false) for OpenAI format", () => {
    const bodyWithoutStream = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
    };
    expect(clientRequestedStreaming(bodyWithoutStream, FORMATS.OPENAI)).toBe(false);
  });

  it("treats explicit stream: false as false", () => {
    const bodyWithFalse = {
      model: "gpt-4o",
      stream: false,
      messages: [{ role: "user", content: "hi" }],
    };
    expect(clientRequestedStreaming(bodyWithFalse, FORMATS.OPENAI)).toBe(false);
  });

  it("treats explicit stream: true as true", () => {
    const bodyWithTrue = {
      model: "gpt-4o",
      stream: true,
      messages: [{ role: "user", content: "hi" }],
    };
    expect(clientRequestedStreaming(bodyWithTrue, FORMATS.OPENAI)).toBe(true);
  });
});
