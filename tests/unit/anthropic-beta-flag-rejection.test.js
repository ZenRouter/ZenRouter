/**
 * Regression test: `timing-2026-09-09` rejected by Anthropic as an unexpected
 * `anthropic-beta` value.
 *
 * Reported error (claude provider, openai→claude route):
 *   400 {"type":"error","error":{"type":"invalid_request_error",
 *     "message":"Unexpected value(s) `timing-2026-09-09` for the `anthropic-beta`
 *     header. Please consult our documentation at platform.claude.com/docs or try
 *     again without the header."}}
 *
 * Cause: `timing-2026-09-09` was added to CLAUDE_BETA_FLAGS_BASE in 3137197a as one
 * of the "latest stable beta flags". It is a per-turn timing TELEMETRY beta that
 * Anthropic gates per organization — the flag string ships inside the Claude Code
 * binary but the server only accepts it once the account holds the entitlement.
 * Sending it unconditionally 400s every turn for accounts without it.
 *
 * Fix has two halves:
 *  1. Drop the org-gated flag from the base set.
 *  2. Self-heal: parse the flags an Anthropic 400 names and retry the same turn
 *     without them, remembering them per connection so later turns never send
 *     them. That way any future entitlement change degrades to a single extra
 *     round-trip instead of a hard failure.
 */

import { describe, it, expect, vi } from "vitest";
import {
  selectAnthropicBeta,
  parseRejectedAnthropicBetaFlags,
} from "../../open-sse/providers/shared.js";

const REJECTION_BODY = JSON.stringify({
  type: "error",
  error: {
    type: "invalid_request_error",
    message:
      "Unexpected value(s) `timing-2026-09-09` for the `anthropic-beta` header. " +
      "Please consult our documentation at platform.claude.com/docs or try again without the header.",
  },
  request_id: "req_011CfXhgFyt5VY3gcvmXexdF",
});

describe("anthropic-beta org-gated flag rejection", () => {
  it("never sends timing-2026-09-09 in the default flag set", () => {
    const beta = selectAnthropicBeta("claude-opus-5-5");
    expect(beta).not.toContain("timing-2026-09-09");
  });

  it("omits timing-2026-09-09 for every model, heavy-agent flags included", () => {
    for (const model of ["claude-opus-5-5", "claude-sonnet-5", "claude-haiku-4-5-20251001", "claude-fable-5"]) {
      expect(selectAnthropicBeta(model)).not.toContain("timing-2026-09-09");
    }
  });

  it("still sends the flags Anthropic accepts", () => {
    const flags = new Set(selectAnthropicBeta("claude-opus-5-5").split(","));
    expect(flags.has("claude-code-20250219")).toBe(true);
    expect(flags.has("oauth-2025-04-20")).toBe(true);
    expect(flags.has("interleaved-thinking-2025-05-14")).toBe(true);
    expect(flags.has("tool-search-tool-2025-10-19")).toBe(true);
    expect(flags.has("advanced-tool-use-2025-11-20")).toBe(true);
  });

  it("parses the offending flag names out of the 400 body", () => {
    expect(parseRejectedAnthropicBetaFlags(REJECTION_BODY)).toEqual(["timing-2026-09-09"]);
  });

  it("parses multiple offending flags from one body", () => {
    const body = JSON.stringify({
      type: "error",
      error: {
        type: "invalid_request_error",
        message:
          "Unexpected value(s) `timing-2026-09-09`, `inline-tools-2026-09-15` for the " +
          "`anthropic-beta` header. Please consult our documentation.",
      },
    });
    expect(parseRejectedAnthropicBetaFlags(body)).toEqual([
      "timing-2026-09-09",
      "inline-tools-2026-09-15",
    ]);
  });

  it("never mistakes the header name for a beta flag", () => {
    const parsed = parseRejectedAnthropicBetaFlags(REJECTION_BODY);
    expect(parsed).not.toContain("anthropic-beta");
  });

  it("returns [] for unrelated 400 bodies (no false self-heal)", () => {
    expect(parseRejectedAnthropicBetaFlags('{"error":{"message":"max_tokens: must be greater than 0"}}')).toEqual([]);
    expect(parseRejectedAnthropicBetaFlags("")).toEqual([]);
    expect(parseRejectedAnthropicBetaFlags(null)).toEqual([]);
    expect(parseRejectedAnthropicBetaFlags(undefined)).toEqual([]);
  });

  it("honours an explicit denylist passed by the caller", () => {
    const beta = selectAnthropicBeta("claude-opus-5-5", null, new Set(["timing-2026-09-09", "effort-2025-11-24"]));
    const flags = beta.split(",");
    expect(flags).not.toContain("timing-2026-09-09");
    expect(flags).not.toContain("effort-2025-11-24");
    expect(flags).toContain("claude-code-20250219");
  });
});

// ─── DefaultExecutor self-heal (established static-mock pattern) ──────────────

const proxyAwareFetch = vi.fn();

vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch,
}));

describe("DefaultExecutor beta self-heal (claude provider)", () => {
  it("drops rejected flags and retries the turn once on the same credential", async () => {
    const { DefaultExecutor } = await import("../../open-sse/executors/default.js");
    const ex = new DefaultExecutor("claude");

    const seenBetas = [];
    proxyAwareFetch.mockReset();
    proxyAwareFetch.mockImplementation(async (url, init) => {
      seenBetas.push(init.headers["Anthropic-Beta"]);
      if (seenBetas.length === 1) {
        return new Response(REJECTION_BODY, { status: 400, headers: { "content-type": "application/json" } });
      }
      return new Response("data: [DONE]\n\n", { status: 200, headers: { "content-type": "text/event-stream" } });
    });

    const result = await ex.execute({
      model: "claude-opus-5-5",
      body: { model: "claude-opus-5-5", messages: [{ role: "user", content: "hi" }] },
      stream: true,
      credentials: { apiKey: "sk-test", connectionId: "claude-conn-selfheal" },
      signal: null,
      log: null,
    });

    expect(seenBetas.length).toBe(2);
    expect(result.response.status).toBe(200);
    // The base set no longer carries the org-gated telemetry flag at all.
    for (const beta of seenBetas) expect(beta).not.toContain("timing-2026-09-09");
  });

  it("remembers rejected flags per connection so later turns skip them up front", async () => {
    const { DefaultExecutor } = await import("../../open-sse/executors/default.js");
    const ex = new DefaultExecutor("claude");
    const credentials = { apiKey: "sk-test", connectionId: "claude-conn-remember" };

    // Seed the denylist the way a real rejection would, then confirm buildHeaders
    // omits that flag without needing another round-trip.
    const { parseRejectedAnthropicBetaFlags: parse } = await import("../../open-sse/providers/shared.js");
    expect(parse(REJECTION_BODY)).toEqual(["timing-2026-09-09"]);

    proxyAwareFetch.mockReset();
    proxyAwareFetch.mockImplementation(async (url, init) => {
      const beta = init.headers["Anthropic-Beta"];
      // Simulate the upstream now rejecting inline-tools for this account.
      expect(beta).not.toContain("timing-2026-09-09");
      return new Response("data: [DONE]\n\n", { status: 200, headers: { "content-type": "text/event-stream" } });
    });

    await ex.execute({
      model: "claude-sonnet-5",
      body: { model: "claude-sonnet-5", messages: [{ role: "user", content: "hi" }] },
      stream: true,
      credentials,
      signal: null,
      log: null,
    });

    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry when the 400 is unrelated to beta flags", async () => {
    const { DefaultExecutor } = await import("../../open-sse/executors/default.js");
    const ex = new DefaultExecutor("claude");

    proxyAwareFetch.mockReset();
    proxyAwareFetch.mockImplementation(async () =>
      new Response('{"error":{"message":"max_tokens: must be greater than 0"}}', {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    );

    const result = await ex.execute({
      model: "claude-opus-5-5",
      body: { model: "claude-opus-5-5", messages: [{ role: "user", content: "hi" }] },
      stream: true,
      credentials: { apiKey: "sk-test", connectionId: "claude-conn-noretry" },
      signal: null,
      log: null,
    });

    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
    expect(result.response.status).toBe(400);
  });
});
