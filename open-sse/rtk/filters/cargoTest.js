// Port of rtk src/cmds/rust/cargo_cmd.rs filter_cargo_test (v0.45.x)
// cargo test output → failures only + aggregated summary.
import { CAP_WARNINGS } from "../constants.js";

const AGG_RE = /test result: (\w+)\.\s+(\d+) passed;\s+(\d+) failed;\s+(\d+) ignored;\s+(\d+) measured;\s+(\d+) filtered out(?:;\s+finished in ([\d.]+)s)?/;

function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}

class AggregatedTestResult {
  constructor() {
    this.passed = 0; this.failed = 0; this.ignored = 0;
    this.measured = 0; this.filtered_out = 0;
    this.suites = 0; this.duration_secs = 0; this.has_duration = false;
  }
  static parseLine(line) {
    const m = AGG_RE.exec(line);
    if (!m) return null;
    // Only aggregate when the suite status is "ok"
    if (m[1] !== "ok") return null;
    const agg = new AggregatedTestResult();
    agg.passed = +m[2]; agg.failed = +m[3]; agg.ignored = +m[4];
    agg.measured = +m[5]; agg.filtered_out = +m[6];
    if (m[7] != null) { agg.duration_secs = parseFloat(m[7]); agg.has_duration = true; }
    agg.suites = 1;
    return agg;
  }
  merge(other) {
    this.passed += other.passed; this.failed += other.failed;
    this.ignored += other.ignored; this.measured += other.measured;
    this.filtered_out += other.filtered_out; this.suites += other.suites;
    if (other.has_duration) { this.duration_secs += other.duration_secs; this.has_duration = true; }
  }
  formatCompact() {
    const parts = [`${this.passed} passed`];
    if (this.ignored > 0) parts.push(`${this.ignored} ignored`);
    if (this.filtered_out > 0) parts.push(`${this.filtered_out} filtered out`);
    const counts = parts.join(", ");
    const suiteText = this.suites === 1 ? "1 suite" : `${this.suites} suites`;
    return this.has_duration
      ? `cargo test: ${counts} (${suiteText}, ${this.duration_secs.toFixed(2)}s)`
      : `cargo test: ${counts} (${suiteText})`;
  }
}

export function cargoTest(output) {
  const failures = [];
  const summaryLines = [];
  let inFailureSection = false;
  let currentFailure = [];

  for (const line of output.split("\n")) {
    const t = line.trimStart();
    // Skip compilation noise
    if (t.startsWith("Compiling") || t.startsWith("Downloading")
      || t.startsWith("Downloaded") || t.startsWith("Finished")) continue;

    // Skip "running N tests" and individual "test ... ok" lines
    if (line.startsWith("running ") || (line.startsWith("test ") && line.endsWith("... ok"))) continue;

    if (line === "failures:") { inFailureSection = true; continue; }

    if (inFailureSection) {
      if (line.startsWith("test result:")) {
        inFailureSection = false;
        summaryLines.push(line);
      } else if (line.startsWith("    ") || line.startsWith("---- ")) {
        currentFailure.push(line);
      } else if (line.trim() === "" && currentFailure.length > 0) {
        failures.push(currentFailure.join("\n"));
        currentFailure = [];
      } else if (line.trim() !== "") {
        currentFailure.push(line);
      }
    }

    if (!inFailureSection && line.startsWith("test result:")) summaryLines.push(line);
  }
  if (currentFailure.length > 0) failures.push(currentFailure.join("\n"));

  let result = "";

  if (failures.length === 0 && summaryLines.length > 0) {
    // All passed — try compact aggregation across suites
    let aggregated = null;
    let allParsed = true;
    for (const line of summaryLines) {
      const parsed = AggregatedTestResult.parseLine(line);
      if (parsed) { if (aggregated) aggregated.merge(parsed); else aggregated = parsed; }
      else { allParsed = false; break; }
    }
    if (allParsed && aggregated && aggregated.suites > 0) return aggregated.formatCompact();
    // Fallback: original summary lines
    return summaryLines.join("\n").trim();
  }

  if (failures.length > 0) {
    result += `FAILURES (${failures.length}):\n`;
    for (let i = 0; i < Math.min(failures.length, CAP_WARNINGS); i++) {
      result += `${i + 1}. ${truncateLine(failures[i], 200)}\n`;
    }
    if (failures.length > CAP_WARNINGS) {
      result += `\n… +${failures.length - CAP_WARNINGS} more failures\n`;
    }
    result += "\n";
  }

  for (const line of summaryLines) result += line + "\n";

  if (result.trim() === "") {
    // Fallback: last meaningful lines (compile errors etc.)
    const meaningful = output.split("\n").filter((l) => l.trim() !== "" && !l.trimStart().startsWith("Compiling"));
    for (const line of meaningful.slice(-5)) result += line + "\n";
  }

  return result.trim();
}
