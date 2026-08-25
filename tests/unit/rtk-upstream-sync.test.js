// Sync tests for the upstream rtk pipe filters ported from rtk-ai/rtk v0.45.x.
// Fixtures mirror upstream behavior (failures-only + compact summaries).
import { describe, it, expect } from "vitest";
import { cargoTest } from "../../open-sse/rtk/filters/cargoTest.js";
import { pytest } from "../../open-sse/rtk/filters/pytest.js";
import { goTest } from "../../open-sse/rtk/filters/goTest.js";
import { mypy } from "../../open-sse/rtk/filters/mypy.js";
import { vitest } from "../../open-sse/rtk/filters/vitest.js";
import { autoDetectFilter } from "../../open-sse/rtk/autodetect.js";
import { resolveFilter } from "../../open-sse/rtk/registry.js";

describe("cargo-test filter", () => {
  it("aggregates all-passing suites into one compact line", () => {
    const out = cargoTest([
      "   Compiling app v0.1.0",
      "    Finished test [unoptimized] target(s) in 2.11s",
      "     Running unittests src/main.rs",
      "test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s",
      "     Running tests/integration.rs",
      "test result: ok. 8 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 1.50s",
    ].join("\n"));
    expect(out).toBe("cargo test: 23 passed, 2 ignored (2 suites, 1.51s)");
  });

  it("keeps failures and caps at 10 with overflow marker", () => {
    const lines = ["running 12 tests"];
    for (let i = 0; i < 12; i++) lines.push(`test bad_case_${i} ... FAILED`);
    lines.push("failures:", "");
    for (let i = 0; i < 12; i++) {
      lines.push(`---- bad_case_${i} stdout ----`, "    panicked at 'boom'", "");
    }
    lines.push("test result: FAILED. 0 passed; 12 failed; 0 ignored; 0 measured; 0 filtered out");
    const out = cargoTest(lines.join("\n"));
    expect(out).toContain("FAILURES (12):");
    expect(out).toContain("… +2 more failures");
    expect(out).toContain("test result: FAILED. 0 passed; 12 failed");
    expect(out).not.toContain("Compiling");
  });
});

describe("pytest filter", () => {
  it("all passing → single line", () => {
    const out = pytest([
      "=== test session starts ===",
      "collected 5 items",
      "tests/test_a.py .....  [100%]",
      "=== 5 passed in 0.05s ===",
    ].join("\n"));
    expect(out).toBe("Pytest: 5 passed");
  });

  it("failure output keeps test name + key error lines", () => {
    const out = pytest([
      "=== test session starts ===",
      "collected 2 items",
      "=== FAILURES ===",
      "___ TestAdd ___",
      ">       assert add(1, 1) == 3",
      "E       assert 2 == 3",
      "test_a.py:10: AssertionError",
      "=== short test summary info ===",
      "FAILED test_a.py::TestAdd",
      "=== 1 failed, 1 passed in 0.10s ===",
    ].join("\n"));
    expect(out).toContain("Pytest: 1 passed, 1 failed");
    expect(out).toContain("[FAIL] TestAdd");
    expect(out).toContain("assert 2 == 3");
  });

  it("quiet mode bare summary is recognized", () => {
    expect(pytest("5 failed, 1698 passed, 2 skipped in 108.89s")).toContain("Pytest: 1698 passed, 5 failed, 2 skipped");
  });

  it("no tests collected", () => {
    expect(pytest("=== no tests ran in 0.01s ===")).toBe("Pytest: No tests collected");
  });
});

describe("go test filter", () => {
  it("all passing → counts only", () => {
    const out = goTest([
      JSON.stringify({ Action: "pass", Package: "example.com/app", Test: "TestA" }),
      JSON.stringify({ Action: "pass", Package: "example.com/app", Test: "TestB" }),
      JSON.stringify({ Action: "pass", Package: "example.com/app" }),
    ].join("\n"));
    expect(out).toBe("Go test: 2 passed in 1 packages");
  });

  it("failed test surfaces name + tail output", () => {
    const events = [
      { Action: "run", Package: "p", Test: "TestX" },
      { Action: "output", Package: "p", Test: "TestX", Output: "    x_test.go:9: got 1 want 2\n" },
      { Action: "fail", Package: "p", Test: "TestX" },
      { Action: "pass", Package: "p", Test: "TestY" },
      { Action: "fail", Package: "p" },
    ].map((e) => JSON.stringify(e)).join("\n");
    const out = goTest(events);
    expect(out).toContain("Go test: 1 passed, 1 failed in 1 packages");
    expect(out).toContain("[FAIL] TestX");
    expect(out).toContain("got 1 want 2");
  });

  it("build failure shows build errors", () => {
    const events = [
      { Action: "build-output", ImportPath: "example.com/broken", Output: "./main.go:7:2: undefined: Foo\n" },
      { Action: "build-fail", ImportPath: "example.com/broken" },
      { Action: "fail", Package: "example.com/broken", FailedBuild: "example.com/broken" },
    ].map((e) => JSON.stringify(e)).join("\n");
    const out = goTest(events);
    expect(out).toContain("[BUILD FAIL] example.com/broken");
    expect(out).toContain("undefined: Foo");
  });
});

describe("mypy filter", () => {
  it("groups errors by file with top codes", () => {
    const out = mypy([
      "src/a.py:10: error: Bad thing [assignment]",
      "src/a.py:20: error: Other [index]",
      "src/a.py:20: note: context here",
      "src/b.py:5: error: Worse [assignment]",
      "Found 3 errors in 2 files (checked 10 source files)",
    ].join("\n"));
    expect(out).toContain("mypy: 3 errors in 2 files");
    expect(out).toContain("Top codes: assignment (2x), index (1x)");
    expect(out).toContain("src/a.py (2 errors)");
    expect(out).toContain("L20: [index] Other");
    expect(out).toContain("    context here"); // note attached
    expect(out).not.toContain("Found 3 errors in 2 files (checked"); // summary dropped
  });

  it("success line collapses", () => {
    expect(mypy("Success: no issues found in 5 source files")).toBe("mypy: No issues found");
  });

  it("no file cap: all files listed even when many", () => {
    const lines = [];
    for (let i = 1; i <= 15; i++) lines.push(`file${i}.py:${i}: error: Error in file ${i}.  [assignment]`);
    lines.push("Found 15 errors in 15 files");
    const out = mypy(lines.join("\n"));
    expect(out).toContain("15 errors in 15 files");
    for (let i = 1; i <= 15; i++) expect(out).toContain(`file${i}.py`);
  });
});

describe("vitest filter", () => {
  it("parses JSON reporter output", () => {
    const json = {
      numTotalTests: 4, numPassedTests: 3, numFailedTests: 1, numPendingTests: 0,
      testResults: [{
        name: "tests/app.test.js",
        assertionResults: [
          { fullName: "adds numbers", status: "passed" },
          { fullName: "fails hard", status: "failed", failureMessages: ["expect(1).toBe(2)"] },
          { fullName: "b", status: "passed" },
          { fullName: "c", status: "passed" },
        ],
      }],
    };
    const out = vitest("some preamble\n" + JSON.stringify(json));
    expect(out).toContain("PASS (3) FAIL (1)");
    expect(out).toContain("1. fails hard");
    expect(out).toContain("expect(1).toBe(2)");
  });

  it("regex fallback for human reporter", () => {
    const out = vitest(" Tests  3 failed | 120 passed (123)\n");
    expect(out).toContain("PASS (120) FAIL (3)");
  });
});

describe("autodetect routing (upstream order)", () => {
  it("routes cargo test before generic build-output", () => {
    const text = "   Compiling app v0.1.0\ntest result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.1s";
    expect(autoDetectFilter(text)).toBe(cargoTest);
  });

  it("routes pytest session", () => {
    expect(autoDetectFilter("=== test session starts ===\ncollected 3 items")).toBe(pytest);
  });

  it("routes go NDJSON", () => {
    expect(autoDetectFilter('{"Action":"pass","Package":"p","Test":"T"}')).toBe(goTest);
  });

  it("routes mypy diagnostics", () => {
    expect(autoDetectFilter("src/x.py:1: error: boom [misc]")).toBe(mypy);
  });

  it("routes vitest JSON after grep check", () => {
    expect(autoDetectFilter('{"numTotalTests": 3, "testResults": []}')).toBe(vitest);
  });

  it("registry resolves upstream names incl. aliases", () => {
    for (const [name, fn] of Object.entries({
      "cargo-test": cargoTest, cargo: cargoTest, pytest, "go-test": goTest,
      mypy, vitest, rg: resolveFilter("grep"), fd: resolveFilter("find"),
    })) {
      expect(resolveFilter(name), name).toBe(fn);
    }
  });
});

describe("json filter (port of json_cmd.rs)", () => {
  it("compacts nested objects with sorted keys and value truncation", async () => {
    const { jsonFilter } = await import("../../open-sse/rtk/filters/jsonCompact.js");
    const big = "x".repeat(200);
    const out = jsonFilter(JSON.stringify({ zeta: 1, alpha: big, list: [1, 2, 3, 4, 5, 6, 7] }));
    expect(out).toContain('alpha: "xxx');
    expect(out).toContain('..."');
    expect(out).toContain("[1, ... +6 more]");
    const keyOrder = out.indexOf("alpha") < out.indexOf("zeta");
    expect(keyOrder).toBe(true); // keys sorted
  });

  it("returns null for non-JSON input", async () => {
    const { jsonFilter } = await import("../../open-sse/rtk/filters/jsonCompact.js");
    expect(jsonFilter("this is not json")).toBeNull();
  });
});

describe("env filter (post-hoc env_cmd port + redaction)", () => {
  it("redacts secret-looking values, truncates long ones, caps listing", async () => {
    const { envFilter } = await import("../../open-sse/rtk/filters/env.js");
    const lines = [
      "API_KEY=super-secret-value-1234567890",
      "DATABASE_URL=postgres://u:p@host/db",
      `LONG_VAR=${"v".repeat(300)}`,
      "HOME=/home/me",
    ];
    for (let i = 0; i < 25; i++) lines.push(`VAR_${i}=x`);
    const out = envFilter(lines.join("\n"));
    expect(out).toContain("29 env vars:");
    expect(out).toContain("API_KEY=<redacted:29 chars>");
    expect(out).not.toContain("super-secret-value");
    expect(out).toContain(`LONG_VAR=${"v".repeat(50)}... (300 chars)`);
    expect(out).toContain("+9 more vars");
  });

  it("returns null when a line is not KEY=VALUE", async () => {
    const { envFilter } = await import("../../open-sse/rtk/filters/env.js");
    expect(envFilter(["A=1", "B=2", "C=3", "D=4", "not an assignment"].join("\n"))).toBeNull();
  });
});

describe("autodetect routes json/env before generic fallbacks", () => {
  it("large JSON blob → json filter", async () => {
    const { autoDetectFilter } = await import("../../open-sse/rtk/autodetect.js");
    const { jsonFilter } = await import("../../open-sse/rtk/filters/jsonCompact.js");
    const blob = JSON.stringify({ data: Array.from({ length: 50 }, (_, i) => ({ i, pad: "y".repeat(20) })) });
    expect(blob.length).toBeGreaterThan(500);
    expect(autoDetectFilter(blob)).toBe(jsonFilter);
  });

  it("env dump → env filter", async () => {
    const { autoDetectFilter } = await import("../../open-sse/rtk/autodetect.js");
    const { envFilter } = await import("../../open-sse/rtk/filters/env.js");
    const dump = Array.from({ length: 10 }, (_, i) => `SOME_VAR_${i}=${"value".repeat(10)}${i}`).join("\n");
    expect(autoDetectFilter(dump)).toBe(envFilter);
  });
});
