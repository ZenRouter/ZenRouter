import { describe, expect, it } from "vitest";
import { OpenCodeExecutor, OPENCODE_DECOY_RESPONSES_TOOLS, OPENCODE_DECOY_CHAT_TOOLS } from "../../open-sse/executors/opencode.js";

const FREE_13 = "muse-spark-1.3-contributor-free";
const CHAT_MODEL = "big-pickle";
const CREDS = { connectionId: "opencode-decoy-test" };

describe("OpenCode decoy tools injection (#4101, #4146, #4165)", () => {
  it("injects bash and read into empty Responses tools", () => {
    const body = { model: FREE_13, input: [{ type: "message", role: "user", content: "hi" }] };
    const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
    expect(out.tools).toHaveLength(2);
    expect(out.tools.map((t) => t.name)).toEqual(["bash", "read"]);
    expect(out.tool_choice).toBe("auto");
  });

  it("appends bash and read to Responses custom tools", () => {
    const customTool = {
      type: "function",
      name: "get_weather",
      description: "Get weather",
      parameters: { type: "object", properties: {} },
    };
    const body = {
      model: FREE_13,
      input: [{ type: "message", role: "user", content: "hi" }],
      tools: [customTool],
    };
    const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
    expect(out.tools).toHaveLength(3);
    expect(out.tools.map((t) => t.name)).toEqual(["get_weather", "bash", "read"]);
  });

  it("preserves exact tool names when user provides Bash/Read with different case", () => {
    const userTool = {
      type: "function",
      name: "Bash",
      description: "User bash",
      parameters: { type: "object", properties: {} },
    };
    const body = {
      model: FREE_13,
      input: [{ type: "message", role: "user", content: "hi" }],
      tools: [userTool],
    };
    const out = new OpenCodeExecutor().transformRequest(FREE_13, body, true, CREDS);
    // User tool Bash preserved, lowercase bash and read appended
    expect(out.tools.map((t) => t.name)).toEqual(["Bash", "bash", "read"]);
  });

  it("injects chat decoy tools into chat models without tools", () => {
    const body = { model: CHAT_MODEL, messages: [{ role: "user", content: "hi" }] };
    const out = new OpenCodeExecutor().transformRequest(CHAT_MODEL, body, true, CREDS);
    expect(out.tools).toHaveLength(2);
    expect(out.tools.map((t) => t.function.name)).toEqual(["bash", "read"]);
    expect(out.tool_choice).toBe("none");
  });
});
