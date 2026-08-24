import { describe, expect, it } from "vitest";
import selfhostedTts from "open-sse/providers/registry/selfhosted-tts.js";
import selfhostedStt from "open-sse/providers/registry/selfhosted-stt.js";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import { withConnectionBaseUrl } from "@/shared/utils/connectionBaseUrl";

describe("self-hosted media Base URL (#3467)", () => {
  it.each([
    ["selfhosted-tts", selfhostedTts],
    ["selfhosted-stt", selfhostedStt],
  ])("exposes %s Base URL configuration to the dashboard", (id, registry) => {
    expect(registry.connectionBaseUrl?.placeholder).toMatch(/^http/);
    expect(AI_PROVIDERS[id].connectionBaseUrl).toEqual(registry.connectionBaseUrl);
  });

  it("merges and trims Base URL without mutating other settings", () => {
    const existing = { connectionProxyEnabled: true };
    expect(withConnectionBaseUrl(existing, " http://tts:8880 ")).toEqual({
      connectionProxyEnabled: true,
      baseUrl: "http://tts:8880",
    });
    expect(existing).toEqual({ connectionProxyEnabled: true });
  });

  it("removes only Base URL when the field is cleared", () => {
    expect(withConnectionBaseUrl({ baseUrl: "http://old", region: "us" }, " ")).toEqual({ region: "us" });
  });
});