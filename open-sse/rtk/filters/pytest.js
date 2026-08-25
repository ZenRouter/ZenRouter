// Port of rtk src/cmds/python/pytest_cmd.rs filter_pytest_output (v0.45.x)
// pytest output → compact counts + failures only.
import { CAP_WARNINGS, MAX_PYTEST_FAILURES, MAX_XFAIL } from "../constants.js";

function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}

const STATE = { HEADER: 0, TEST_PROGRESS: 1, FAILURES: 2, SUMMARY: 3 };

function parseSummaryLine(summary) {
  // e.g. "5 failed, 1698 passed, 2 skipped, 1 xfailed in 108.89s"
  const counts = { passed: 0, failed: 0, skipped: 0, xfailed: 0, xpassed: 0 };
  if (!summary) return counts;
  const passed = summary.match(/(\d+) passed/);
  const failed = summary.match(/(\d+) failed/);
  const skipped = summary.match(/(\d+) skipped/);
  const xfailed = summary.match(/(\d+) xfailed/);
  const xpassed = summary.match(/(\d+) xpassed/);
  if (passed) counts.passed = +passed[1];
  if (failed) counts.failed = +failed[1];
  if (skipped) counts.skipped = +skipped[1];
  if (xfailed) counts.xfailed = +xfailed[1];
  if (xpassed) counts.xpassed = +xpassed[1];
  return counts;
}

export function pytest(output) {
  let state = STATE.HEADER;
  const testFiles = [];
  const failures = [];
  let currentFailure = [];
  const xfailLines = [];
  let summaryLine = "";

  for (const line of output.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("===") && trimmed.includes("test session starts")) {
      state = STATE.HEADER; continue;
    } else if (trimmed.startsWith("===") && trimmed.includes("FAILURES")) {
      state = STATE.FAILURES; continue;
    } else if (trimmed.startsWith("===") && trimmed.includes("short test summary")) {
      state = STATE.SUMMARY;
      if (currentFailure.length > 0) { failures.push(currentFailure.join("\n")); currentFailure = []; }
      continue;
    } else if (trimmed.startsWith("===")
      && (trimmed.includes("passed") || trimmed.includes("failed") || trimmed.includes("skipped"))) {
      summaryLine = trimmed; continue;
    // quiet mode (-q): bare summary without === wrapper
    } else if (summaryLine === ""
      && !trimmed.startsWith("===") && !trimmed.startsWith("FAILED") && !trimmed.startsWith("ERROR")
      && (trimmed.includes(" passed") || trimmed.includes(" failed") || trimmed.includes(" skipped"))
      && trimmed.includes(" in ")) {
      summaryLine = trimmed; continue;
    }

    switch (state) {
      case STATE.HEADER:
        if (trimmed.startsWith("collected")) state = STATE.TEST_PROGRESS;
        break;
      case STATE.TEST_PROGRESS:
        if (trimmed !== "" && !trimmed.startsWith("===") && (trimmed.includes(".py") || trimmed.includes("%]"))) {
          testFiles.push(trimmed);
        }
        break;
      case STATE.FAILURES:
        if (trimmed.startsWith("___")) {
          if (currentFailure.length > 0) { failures.push(currentFailure.join("\n")); currentFailure = []; }
          currentFailure.push(trimmed);
        } else if (trimmed !== "" && !trimmed.startsWith("===")) {
          currentFailure.push(trimmed);
        }
        break;
      case STATE.SUMMARY:
        if (trimmed.startsWith("FAILED") || trimmed.startsWith("ERROR")) {
          failures.push(trimmed);
        } else if (trimmed.startsWith("XFAIL") || trimmed.startsWith("XPASS")) {
          xfailLines.push(trimmed);
        }
        break;
    }
  }
  if (currentFailure.length > 0) failures.push(currentFailure.join("\n"));

  const counts = parseSummaryLine(summaryLine);
  const { passed, failed, skipped, xfailed, xpassed } = counts;

  if (passed === 0 && failed === 0 && skipped === 0 && xfailed === 0 && xpassed === 0) {
    return "Pytest: No tests collected";
  }

  const extrasPresent = skipped > 0 || xfailed > 0 || xpassed > 0 || xfailLines.length > 0;
  if (failed === 0 && passed > 0 && !extrasPresent) {
    return `Pytest: ${passed} passed`;
  }

  let result = `Pytest: ${passed} passed, ${failed} failed`;
  if (skipped > 0) result += `, ${skipped} skipped`;
  if (xfailed > 0) result += `, ${xfailed} xfailed`;
  if (xpassed > 0) result += `, ${xpassed} xpassed`;
  result += "\n";

  if (xfailLines.length > 0) {
    result += "\nExpected-failure outcomes:\n";
    for (let i = 0; i < Math.min(xfailLines.length, MAX_XFAIL); i++) {
      result += `  ${truncateLine(xfailLines[i], 120)}\n`;
    }
    if (xfailLines.length > MAX_XFAIL) result += `  … +${xfailLines.length - MAX_XFAIL} more\n`;
  }

  if (failures.length === 0) return result.trim();

  result += "\nFailures:\n";

  for (let i = 0; i < Math.min(failures.length, MAX_PYTEST_FAILURES); i++) {
    const failure = failures[i];
    const lines = failure.split("\n");
    const firstLine = lines[0];

    if (firstLine && firstLine.startsWith("___")) {
      result += `${i + 1}. [FAIL] ${firstLine.replaceAll("_", "").trim()}\n`;
    } else if (firstLine && firstLine.startsWith("FAILED")) {
      // Summary format: "FAILED tests/test_foo.py::test_bar - AssertionError"
      const parts = firstLine.split(" - ");
      if (parts[0] != null) {
        result += `${i + 1}. [FAIL] ${parts[0].replace(/^FAILED /, "")}\n`;
      }
      if (parts.length > 1) result += `     ${truncateLine(parts[1], 100)}\n`;
      continue;
    }

    // Relevant error lines (assertions, errors, file locations)
    let relevantLines = 0;
    for (let k = 1; k < lines.length; k++) {
      const l = lines[k];
      const lower = l.toLowerCase();
      const relevant = l.trim().startsWith(">")
        || l.trim().startsWith("E")
        || lower.includes("assert")
        || lower.includes("error")
        || l.includes(".py:");
      if (relevant && relevantLines < 3) {
        result += `     ${truncateLine(l, 100)}\n`;
        relevantLines++;
      }
    }

    if (i < failures.length - 1) result += "\n";
  }

  if (failures.length > MAX_PYTEST_FAILURES) {
    result += `\n… +${failures.length - MAX_PYTEST_FAILURES} more failures\n`;
  }

  return result.trim();
}
