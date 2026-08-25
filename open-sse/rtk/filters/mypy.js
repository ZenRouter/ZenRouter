// Port of rtk src/cmds/python/mypy_cmd.rs filter_mypy_output (v0.45.x)
// mypy diagnostics → grouped by file with top error codes.
function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}

// file.py:12: error: Message [code]  |  file.py:12:5: error: Message [code]
const MYPY_DIAG = /^(.+?):(\d+)(?::\d+)?: (error|warning|note): (.+?)(?:\s+\[(.+)\])?$/;

export function mypy(output) {
  const lines = output.split("\n");
  const errors = [];
  const filelessLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip mypy's own summary / success lines
    if (line.startsWith("Found ") && line.includes(" error")) { i++; continue; }
    if (line.startsWith("Success:")) { i++; continue; }

    const caps = MYPY_DIAG.exec(line);
    if (caps) {
      const severity = caps[3];
      const file = caps[1];
      const lineNum = parseInt(caps[2], 10) || 0;
      const message = caps[4];
      const code = caps[5] || "";

      if (severity === "note") {
        // Attach note to preceding error if same file
        const last = errors[errors.length - 1];
        if (last && last.file === file) { last.contextLines.push(message); i++; continue; }
        filelessLines.push(line); i++; continue;
      }

      const err = { file, line: lineNum, code, message, contextLines: [] };

      // Capture continuation note lines for the same file
      i++;
      while (i < lines.length) {
        const nextCaps = MYPY_DIAG.exec(lines[i]);
        if (nextCaps && nextCaps[3] === "note" && nextCaps[1] === err.file) {
          err.contextLines.push(nextCaps[4]); i++; continue;
        }
        break;
      }

      errors.push(err);
    } else if (line.includes("error:") && line.trim() !== "") {
      // File-less error (config errors, import errors)
      filelessLines.push(line); i++;
    } else {
      i++;
    }
  }

  if (errors.length === 0 && filelessLines.length === 0) {
    return "mypy: No issues found";
  }

  let result = "";
  for (const l of filelessLines) result += l + "\n";
  if (filelessLines.length > 0 && errors.length > 0) result += "\n";

  if (errors.length > 0) {
    const byFile = new Map();
    const byCode = new Map();
    for (const e of errors) {
      if (!byFile.has(e.file)) byFile.set(e.file, []);
      byFile.get(e.file).push(e);
      if (e.code) byCode.set(e.code, (byCode.get(e.code) || 0) + 1);
    }

    result += `mypy: ${errors.length} errors in ${byFile.size} files\n`;

    // Top error codes summary (only when 2+ distinct codes)
    const codeCounts = [...byCode.entries()].sort((a, b) => b[1] - a[1]);
    if (codeCounts.length > 1) {
      const codesStr = codeCounts.slice(0, 5).map(([c, n]) => `${c} (${n}x)`).join(", ");
      result += `Top codes: ${codesStr}\n\n`;
    }

    // Files sorted by error count (most errors first)
    const filesSorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [file, fileErrors] of filesSorted) {
      result += `${file} (${fileErrors.length} errors)\n`;
      for (const err of fileErrors) {
        result += err.code === ""
          ? `  L${err.line}: ${truncateLine(err.message, 120)}\n`
          : `  L${err.line}: [${err.code}] ${truncateLine(err.message, 120)}\n`;
        for (const ctx of err.contextLines) result += `    ${truncateLine(ctx, 120)}\n`;
      }
      result += "\n";
    }
  }

  return result.trim();
}
