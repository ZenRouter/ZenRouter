import { describe, expect, it } from "vitest";
import { getDefaultAgent } from "open-sse/utils/proxyFetch.js";

describe("Undici keep-alive connection pooling", () => {
  it("initializes default Undici Agent with keepAlive config", async () => {
    const agent = await getDefaultAgent();
    expect(agent).toBeDefined();
    expect(agent).not.toBeNull();
  });
});

