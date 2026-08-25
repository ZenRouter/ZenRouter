import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// GetUsableModels travels over a raw HTTP/2 Connect call (node:http2), not
// global fetch — mock the h2 client instead.
const h2 = vi.hoisted(() => ({
  payload: new Uint8Array(),
  status: 200,
  requests: [],
}));

vi.mock("http2", () => ({
  default: {
    connect: vi.fn(() => {
      const client = {};
      client.on = vi.fn();
      client.close = vi.fn();
      const req = {
        on(event, cb) {
          if (event === "response") queueMicrotask(() => cb({ ":status": h2.status }));
          else if (event === "data") queueMicrotask(() => cb(Buffer.from(h2.payload)));
          else if (event === "end") queueMicrotask(() => cb());
          return req;
        },
        end: vi.fn(),
      };
      client.request = vi.fn((headers) => {
        h2.requests.push(headers);
        return req;
      });
      return client;
    }),
  },
}));

import {
  clearCursorModelCache,
  parseCursorUsableModels,
  resolveCursorModels,
} from "../../open-sse/services/cursorModels.js";

const originalFetch = global.fetch;

function varint(value) {
  const bytes = [];
  while (value >= 0x80) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value);
  return Uint8Array.from(bytes);
}

function field(fieldNumber, value) {
  return Uint8Array.from([(fieldNumber << 3) | 2, ...varint(value.length), ...value]);
}

function text(value) {
  return new TextEncoder().encode(value);
}

function concat(...parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function model(id, name) {
  return field(1, concat(field(1, text(id)), field(4, text(name))));
}

describe("Cursor live model catalog", () => {
  beforeEach(() => {
    clearCursorModelCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearCursorModelCache();
  });

  it("decodes the GetUsableModels protobuf response", () => {
    const payload = concat(
      model("default", "Auto"),
      model("gpt-5.3-codex", "GPT 5.3 Codex"),
      model("gpt-5.3-codex", "Duplicate"),
    );

    expect(parseCursorUsableModels(payload)).toEqual([
      { id: "default", name: "Auto" },
      { id: "gpt-5.3-codex", name: "GPT 5.3 Codex" },
    ]);
  });

  it("fetches the account-specific catalog and caches it", async () => {
    const payload = concat(model("claude-4.6-opus", "Claude 4.6 Opus"));
    h2.payload = payload;
    h2.status = 200;
    h2.requests.length = 0;
    const credentials = {
      accessToken: "cursor-token",
      providerSpecificData: { machineId: "machine-id" },
    };

    await expect(resolveCursorModels(credentials)).resolves.toEqual({
      models: [{ id: "claude-4.6-opus", name: "Claude 4.6 Opus" }],
    });
    await expect(resolveCursorModels(credentials)).resolves.toEqual({
      models: [{ id: "claude-4.6-opus", name: "Claude 4.6 Opus" }],
    });

    // One HTTP/2 call; the second resolve is served from the cache.
    expect(h2.requests).toHaveLength(1);
    expect(h2.requests[0][":path"]).toBe("/agent.v1.AgentService/GetUsableModels");
    expect(h2.requests[0]["content-type"]).toBe("application/proto");
  });

  it("fails open when the Cursor catalog request fails", async () => {
    h2.payload = new Uint8Array();
    h2.status = 403;

    await expect(resolveCursorModels({
      accessToken: "cursor-token",
      providerSpecificData: { machineId: "machine-id" },
    })).resolves.toBeNull();
  });
});
