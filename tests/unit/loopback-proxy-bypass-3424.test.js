import { describe, expect, it } from "vitest";
import { isLoopbackTarget } from "open-sse/utils/proxyFetch.js";

describe("loopback proxy bypass (#3424)", () => {
  it.each([
    "http://localhost:11434/api/chat",
    "https://foo.localhost/v1",
    "http://127.0.0.1:8080",
    "http://127.1.2.3/api",
    "http://[::1]:1234",
    "http://[::ffff:127.0.0.1]:80",
    "http://[::ffff:7f00:1]",
  ])("recognizes loopback target %s", (url) => {
    expect(isLoopbackTarget(url)).toBe(true);
  });

  it.each([
    "http://192.168.1.10:11434/api/chat",
    "http://10.0.0.5:8080",
    "http://localhost.evil.com",
    "http://127.0.0.1.evil.com",
    "not a url",
  ])("does not bypass non-loopback target %s", (url) => {
    expect(isLoopbackTarget(url)).toBe(false);
  });
});
