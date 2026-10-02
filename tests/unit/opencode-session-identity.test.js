import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenCodeExecutor, _resetOpencodeSessionCache } from "../../open-sse/executors/opencode.js";
import { clearSessionStore } from "../../open-sse/utils/sessionManager.js";

const CHILD_SESSION = "ses_019a01234567AbCdEf01234567";
const PARENT_SESSION = "ses_019a01234567Parent01234567";
const OTHER_SESSION = "ses_019a01234567Other012345678";
const CANONICAL_SESSION = /^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/;
const UPSTREAM_RESPONSE = {
  id: "chatcmpl-session-test",
  object: "chat.completion",
  choices: [{ index: 0, message: { role: "assistant", content: "Session accepted" }, finish_reason: "stop" }],
};

let requests;

beforeEach(() => {
  clearSessionStore();
  _resetOpencodeSessionCache();
  requests = [];
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    requests.push({ url, headers: new Headers(options.headers), body: JSON.parse(options.body) });
    return Response.json(UPSTREAM_RESPONSE);
  }));
});

afterEach(() => vi.unstubAllGlobals());

async function execute(executor, rawHeaders, extraBody = {}) {
  const result = await executor.execute({
    model: "big-pickle",
    body: { model: "big-pickle", messages: [{ role: "user", content: "Continue the child task" }], ...extraBody },
    stream: false,
    credentials: { connectionId: "opencode-session-test", rawHeaders },
  });
  expect(await result.response.json()).toEqual(UPSTREAM_RESPONSE);
  return requests[requests.length - 1];
}

describe("OpenCode upstream session identity", () => {
  it("preserves a namespaced native child session over a translated cache key and sends both parent aliases", async () => {
    const request = await execute(new OpenCodeExecutor(), {
      "User-Agent": "opencode/1.18.34",
      "X-OpenCode-Session-Id": CHILD_SESSION,
      "X-OpenCode-Parent-Session-Id": PARENT_SESSION,
      "x-opencode-request": "msg_native_child_turn",
    }, { prompt_cache_key: "translated-cache-session" });

    expect(request.headers.get("x-opencode-session-id")).toBe(CHILD_SESSION);
    expect(request.headers.get("x-opencode-session")).toBe(CHILD_SESSION);
    expect(request.headers.get("x-opencode-parent-session-id")).toBe(PARENT_SESSION);
    expect(request.headers.get("x-parent-session-id")).toBe(PARENT_SESSION);
    expect(request.headers.get("x-opencode-request")).toBe("msg_native_child_turn");
  });

  it("uses one canonical session for legacy native clients and does not invent a parent", async () => {
    const executor = new OpenCodeExecutor();
    const headers = { "user-agent": "opencode/1.18.34", "x-opencode-session": "legacy-child-session" };
    const first = await execute(executor, headers);
    const second = await execute(executor, headers);
    const session = first.headers.get("x-opencode-session");

    expect(session).toMatch(CANONICAL_SESSION);
    expect(first.headers.get("x-opencode-session-id")).toBe(session);
    expect(second.headers.get("x-opencode-session-id")).toBe(session);
    expect(second.headers.get("x-opencode-session")).toBe(session);
    expect(second.headers.get("x-opencode-request")).toBe(first.headers.get("x-opencode-request"));
    expect(first.headers.has("x-opencode-parent-session-id")).toBe(false);
    expect(first.headers.has("x-parent-session-id")).toBe(false);
  });

  it("treats the current namespaced identity as authoritative when native legacy aliases conflict", async () => {
    const request = await execute(new OpenCodeExecutor(), {
      "user-agent": "opencode/1.18.34",
      "x-opencode-session-id": CHILD_SESSION,
      "x-opencode-session": OTHER_SESSION,
      "x-opencode-parent-session-id": PARENT_SESSION,
      "x-parent-session-id": OTHER_SESSION,
    });

    expect(request.headers.get("x-opencode-session-id")).toBe(CHILD_SESSION);
    expect(request.headers.get("x-opencode-session")).toBe(CHILD_SESSION);
    expect(request.headers.get("x-opencode-parent-session-id")).toBe(PARENT_SESSION);
    expect(request.headers.get("x-parent-session-id")).toBe(PARENT_SESSION);
  });

  it("accepts a native legacy parent without leaking it into the next independent request", async () => {
    const executor = new OpenCodeExecutor();
    const child = await execute(executor, {
      "user-agent": "opencode/1.18.34",
      "x-opencode-session-id": CHILD_SESSION,
      "x-parent-session-id": PARENT_SESSION,
    });
    const independent = await execute(executor, {
      "user-agent": "opencode/1.18.34",
      "x-opencode-session-id": OTHER_SESSION,
    });

    expect(child.headers.get("x-opencode-parent-session-id")).toBe(PARENT_SESSION);
    expect(child.headers.get("x-parent-session-id")).toBe(PARENT_SESSION);
    expect(independent.headers.get("x-opencode-session-id")).toBe(OTHER_SESSION);
    expect(independent.headers.get("x-opencode-session")).toBe(OTHER_SESSION);
    expect(independent.headers.has("x-opencode-parent-session-id")).toBe(false);
    expect(independent.headers.has("x-parent-session-id")).toBe(false);
  });

  it("does not overlay another client's resolved session or fingerprint with native-only headers", async () => {
    const executor = new OpenCodeExecutor();
    const body = { metadata: { user_id: "user_session_12345678-1234-1234-1234-123456789abc" } };
    const baseline = await execute(executor, { "user-agent": "claude-code/2.1.0" }, body);
    const request = await execute(executor, {
      "user-agent": "claude-code/2.1.0",
      "x-opencode-session-id": CHILD_SESSION,
      "x-opencode-session": CHILD_SESSION,
      "x-opencode-parent-session-id": PARENT_SESSION,
      "x-parent-session-id": PARENT_SESSION,
      "x-opencode-request": "msg_unrelated_turn",
      "x-opencode-project": "unrelated-project",
      "x-opencode-client": "unrelated-client",
    }, body);

    expect(request.headers.get("x-opencode-session-id")).toBe(baseline.headers.get("x-opencode-session-id"));
    expect(request.headers.get("x-opencode-session")).toBe(baseline.headers.get("x-opencode-session"));
    expect(request.headers.get("x-opencode-session-id")).toMatch(CANONICAL_SESSION);
    expect(request.headers.get("x-opencode-session-id")).not.toBe(CHILD_SESSION);
    expect(request.headers.get("x-opencode-request")).toBe(baseline.headers.get("x-opencode-request"));
    expect(request.headers.get("x-opencode-project")).toBe(baseline.headers.get("x-opencode-project"));
    expect(request.headers.get("x-opencode-client")).toBe(baseline.headers.get("x-opencode-client"));
    expect(request.headers.has("x-opencode-parent-session-id")).toBe(false);
    expect(request.headers.has("x-parent-session-id")).toBe(false);
  });
});
