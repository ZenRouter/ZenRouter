// Port of rtk src/cmds/js/vitest_cmd.rs VitestParser + pipe vitest_wrapper (v0.45.x)
// vitest JSON reporter output (or degraded regex) → compact summary.
import { CAP_WARNINGS } from "../constants.js";

function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}

/** Compact TestResult format — mirrors rtk parser/formatter.rs format_compact. */
function formatCompact(result) {
  let summary = `PASS (${result.passed}) FAIL (${result.failed})`;
  if (result.skipped > 0) summary += ` skipped (${result.skipped})`;
  const lines = [summary];

  if (result.failures.length > 0) {
    lines.push("");
    for (let i = 0; i < Math.min(result.failures.length, 5); i++) {
      const f = result.failures[i];
      lines.push(`${i + 1}. ${f.testName}`);
      for (const l of f.errorMessage.split("\n")) lines.push(`   ${l}`);
    }
    if (result.failures.length > 5) {
      lines.push(`\n... +${result.failures.length - 5} more failures`);
    }
  }

  if (result.durationMs != null) lines.push(`\nTime: ${result.durationMs}ms`);

  return lines.join("\n");
}

function extractFailuresFromJson(json) {
  const failures = [];
  for (const file of json.testResults || []) {
    for (const test of file.assertionResults || []) {
      if (test.status === "failed") {
        failures.push({
          testName: test.fullName || "",
          filePath: file.name || "",
          errorMessage: Array.isArray(test.failureMessages) ? test.failureMessages.join("\n") : "",
        });
      }
    }
  }
  return failures;
}

/** Tier 2: regex extraction when JSON parse fails ("Tests  3 failed | 120 passed"). */
const TESTS_RE = /Tests\s+(?:(\d+)\s+failed\s+\|\s+)?(\d+)\s+passed/;

function extractStatsRegex(output) {
  // find the LAST "Tests ..." line (summary)
  const matches = [...output.matchAll(new RegExp(TESTS_RE.source, "g"))];
  if (matches.length === 0) return null;
  const m = matches[matches.length - 1];
  const failed = m[1] ? +m[1] : 0;
  const passed = m[2] ? +m[2] : 0;
  return { total: passed + failed, passed, failed, skipped: 0, failures: [], durationMs: null };
}

export function vitest(input) {
  // Tier 1: locate the JSON payload (vitest may print non-JSON preamble)
  const start = input.indexOf("{");
  let result = null;
  let degradedWarnings = null;

  if (start !== -1) {
    try { var json = JSON.parse(input.slice(start)); } catch (e) { var firstErr = e; }
    if (!json) {
      // Try extracting the outermost balanced braces (JSON inside logs)
      const extracted = extractBalancedJson(input, start);
      if (extracted) { try { json = JSON.parse(extracted); } catch { json = null; } }
    }
    if (json && typeof json === "object" && ("numTotalTests" in json || "testResults" in json)) {
      result = {
        total: json.numTotalTests || 0,
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        skipped: json.numPendingTests || 0,
        failures: extractFailuresFromJson(json),
        durationMs: null,
      };
    }
  }

  if (!result && input.includes("\"testResults\"")) {
    // had JSON-ish shape but unparseable → degraded without regex
    degradedWarnings = "JSON parse failed";
  }

  if (!result) {
    // Tier 2: regex stats extraction
    const stats = extractStatsRegex(input);
    if (stats) result = stats;
  }

  if (!result) return truncatePassthrough(input);

  void degradedWarnings;
  return formatCompact(result);
}

function extractBalancedJson(text, start) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function truncatePassthrough(raw) {
  // rtk passthrough cap; keep aligned with RAW_CAP scale but bounded for pipe use
  const MAX_CHARS = 20000;
  if (raw.length <= MAX_CHARS) return raw;
  return raw.slice(0, MAX_CHARS);
}

export { CAP_WARNINGS };
