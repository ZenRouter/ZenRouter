import { describe, it, expect, beforeEach } from "vitest";
import {
  AntigravityExecutor,
  resolveAntigravityProjectId,
  _resetAntigravityProjectCache,
} from "../../open-sse/executors/antigravity.js";

// Regression: transformRequest used to mint a FRESH RANDOM `project` on every
// request when the connection had no stored projectId
// (credentials?.projectId || this.generateProjectId()). Google evaluates
// quota/eligibility per project, so a random-per-request id looks abusive,
// breaks project-scoped checks, and makes logs undebuggable. The fallback
// must now be ONE stable id per connection identity.
describe("Antigravity stable fallback project id", () => {
  beforeEach(() => {
    _resetAntigravityProjectCache();
  });

  it("prefers the real stored projectId when present", () => {
    const creds = { connectionId: "conn-1", projectId: "real-gcp-project-9" };
    expect(resolveAntigravityProjectId(creds, () => "fake")).toBe("real-gcp-project-9");
    expect(resolveAntigravityProjectId(creds, () => "fake")).toBe("real-gcp-project-9");
  });

  it("returns the same generated id for the same connection across calls", () => {
    let calls = 0;
    const gen = () => `gen-${++calls}`;
    const creds = { connectionId: "conn-stable", accessToken: "tok" };
    const first = resolveAntigravityProjectId(creds, gen);
    const second = resolveAntigravityProjectId(creds, gen);
    expect(second).toBe(first);
    expect(calls).toBe(1);
  });

  it("keys by email when connectionId is absent", () => {
    const a = resolveAntigravityProjectId({ email: "a@x.test" }, () => "id-a");
    const b = resolveAntigravityProjectId({ email: "a@x.test" }, () => "id-b");
    expect(a).toBe("id-a");
    expect(b).toBe("id-a");
  });

  it("gives different connections different ids", () => {
    const a = resolveAntigravityProjectId({ connectionId: "conn-a" }, () => "id-a");
    const b = resolveAntigravityProjectId({ connectionId: "conn-b" }, () => "id-b");
    expect(a).not.toBe(b);
  });

  it("is stable for anonymous credentials too (better than random per request)", () => {
    const first = resolveAntigravityProjectId({}, () => "anon-1");
    const second = resolveAntigravityProjectId(undefined, () => "anon-2");
    expect(first).toBe("anon-1");
    expect(second).toBe("anon-1");
  });

  it("transformRequest reuses one project across requests for the same connection", () => {
    const ex = new AntigravityExecutor();
    const creds = { connectionId: "conn-tf", accessToken: "tok" };
    const body = () => ({ request: { contents: [{ role: "user", parts: [{ text: "hi" }] }] } });
    const out1 = ex.transformRequest("gemini-3.5-flash", body(), false, creds);
    const out2 = ex.transformRequest("gemini-3.5-flash", body(), false, creds);
    expect(out1.project).toBeTruthy();
    expect(out2.project).toBe(out1.project);
  });

  it("transformRequest uses the stored projectId verbatim when available", () => {
    const ex = new AntigravityExecutor();
    const creds = { connectionId: "conn-real", projectId: "real-proj-1" };
    const out = ex.transformRequest(
      "gemini-3.5-flash",
      { request: { contents: [{ role: "user", parts: [{ text: "hi" }] }] } },
      false,
      creds
    );
    expect(out.project).toBe("real-proj-1");
  });
});
