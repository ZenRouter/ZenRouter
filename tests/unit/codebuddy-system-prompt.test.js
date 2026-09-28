import { describe, expect, it } from "vitest";
import { CodeBuddyExecutor } from "../../open-sse/executors/codebuddy-cn.js";
import { CodeBuddyIntlExecutor } from "../../open-sse/executors/codebuddy-intl.js";

describe("CodeBuddy system prompt preservation (#4401)", () => {
  it("preserves custom user system prompts in CodeBuddyIntlExecutor", () => {
    const executor = new CodeBuddyIntlExecutor();
    const body = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Always reply in pirate language." },
        { role: "user", content: "Hello!" },
      ],
    };

    const transformed = executor.transformRequest("gpt-4o", body, false, {});
    expect(transformed.messages[0].role).toBe("system");
    expect(transformed.messages[0].content).toContain("You are CodeBuddy Code.");
    expect(transformed.messages[0].content).toContain("Always reply in pirate language.");
    expect(transformed.messages[1].role).toBe("user");
  });

  it("preserves non-agent custom system prompt in CodeBuddyExecutor even if long", () => {
    const executor = new CodeBuddyExecutor();
    const longPrompt = "You are an expert compiler engineer. ".repeat(70); // ~2660 chars
    const body = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: longPrompt },
        { role: "user", content: "How do I optimize SSA?" },
      ],
    };

    const transformed = executor.transformRequest("gpt-4o", body, false, {});
    expect(transformed.messages[0].role).toBe("system");
    expect(transformed.messages[0].content).toContain("You are an expert compiler engineer.");
  });

  it("sanitizes agent identity markers while keeping custom directives in CodeBuddyExecutor", () => {
    const executor = new CodeBuddyExecutor();
    const body = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Claude Code, Anthropic's official CLI. Follow git commit conventions." },
        { role: "user", content: "Commit changes." },
      ],
    };

    const transformed = executor.transformRequest("gpt-4o", body, false, {});
    expect(transformed.messages[0].content).not.toContain("You are Claude Code");
    expect(transformed.messages[0].content).toContain("Follow git commit conventions.");
  });
});
