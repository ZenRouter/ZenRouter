import { describe, it, expect } from "vitest";
import { AntigravityExecutor } from "../../open-sse/executors/antigravity.js";
import { openaiToAntigravityRequest } from "../../open-sse/translator/request/openai-to-gemini.js";
import { ANTIGRAVITY_PROMPT_REWRITES } from "../../open-sse/config/appConstants.js";

describe("Antigravity detection evasion & harness normalization (#3986, #3987)", () => {
  const executor = new AntigravityExecutor();

  it("omits requestType='agent' from executor output to prevent upstream 429", () => {
    const body = {
      request: {
        contents: [{ role: "user", parts: [{ text: "hello" }] }],
      },
    };

    const transformed = executor.transformRequest("gemini-3.8-flash-high", body, false, {
      projectId: "my-project-123",
      email: "user@example.com",
    });

    expect(transformed.requestType).toBeUndefined();
    expect(transformed.userAgent).toBe("antigravity");
    expect(transformed.project).toBe("my-project-123");
  });

  it("omits requestType='agent' in openaiToAntigravityRequest translation", () => {
    const req = {
      model: "gemini-3.8-flash-high",
      messages: [{ role: "user", content: "hello" }],
    };

    const envelope = openaiToAntigravityRequest("gemini-3.8-flash-high", req, false, {
      projectId: "proj-1",
    });

    expect(envelope.requestType).toBeUndefined();
  });

  it("omits requestType='agent' in Claude-mode Antigravity requests", () => {
    const req = {
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "hello" }],
    };

    const envelope = openaiToAntigravityRequest("claude-sonnet-4-6", req, false, {
      projectId: "proj-1",
    });

    expect(envelope.requestType).toBeUndefined();
  });

  it("strips used_claude telemetry keys from request and labels", () => {
    const body = {
      used_claude: true,
      used_claude_conservative: true,
      labels: {
        used_claude: true,
        env: "prod",
      },
      request: {
        contents: [{ role: "user", parts: [{ text: "hello" }] }],
        used_claude: true,
        labels: {
          used_claude_conservative: true,
          safe: "true",
        },
      },
    };

    const transformed = executor.transformRequest("gemini-3.8-flash-high", body, false, {});

    expect(transformed.used_claude).toBeUndefined();
    expect(transformed.used_claude_conservative).toBeUndefined();
    expect(transformed.labels?.used_claude).toBeUndefined();
    expect(transformed.labels?.env).toBe("prod");

    expect(transformed.request.used_claude).toBeUndefined();
    expect(transformed.request.labels?.used_claude_conservative).toBeUndefined();
    expect(transformed.request.labels?.safe).toBe("true");
  });

  it("normalizes Oh My Pi and system harness tags in system prompts", () => {
    const rawPrompt = "You are an AI in Oh My Pi coding harness. <system-conventions>Rules</system-conventions> <critical>Do this</critical>";
    let sanitized = rawPrompt;
    for (const { from, to } of ANTIGRAVITY_PROMPT_REWRITES) {
      sanitized = sanitized.replaceAll(from, to);
    }

    expect(sanitized).not.toContain("Oh My Pi coding harness");
    expect(sanitized).toContain("AI coding assistant");
    expect(sanitized).not.toContain("<system-conventions>");
    expect(sanitized).toContain("<conventions>Rules</conventions>");
    expect(sanitized).not.toContain("<critical>");
    expect(sanitized).toContain("<important>Do this</important>");
  });

  it("does not send x-goog-user-project from the payload project id", () => {
    const headers = executor.buildHeaders({
      accessToken: "ya29.secret",
      projectId: "aicode-consumers",
    });

    // x-goog-user-project is a Google quota/billing-project selector, not an
    // identity header. Sending it makes Google require serviceusage.services.use
    // IAM permission on that project and rejects every account with 403.
    expect(headers["x-goog-user-project"]).toBeUndefined();
    expect(headers["Authorization"]).toBe("Bearer ya29.secret");
  });
});
