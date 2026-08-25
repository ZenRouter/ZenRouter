// Port of rtk src/cmds/go/go_cmd.rs filter_go_test_json + pipe go_test_wrapper (v0.45.x)
// `go test -json` NDJSON → failures-only summary.

function truncateLine(line, max) {
  if (line.length <= max) return line;
  return line.slice(0, Math.max(0, max - 1)) + "…";
}

const MAX_TEST_OUTPUT_LINES = 8;

export function goTest(output) {
  const packages = new Map();      // package → {pass,fail,skip,buildFailed,failedTests,buildErrors,packageFailed,packageFailOutput}
  const currentTestOutput = new Map(); // (pkg,test) → lines
  const buildOutput = new Map();   // importPath → error lines

  const pkgOf = (name) => {
    if (!packages.has(name)) {
      packages.set(name, {
        pass: 0, fail: 0, skip: 0, buildFailed: false, packageFailed: false,
        failedTests: [], buildErrors: [], packageFailOutput: [],
      });
    }
    return packages.get(name);
  };

  for (const raw of output.split("\n")) {
    const trimmed = raw.trim();
    if (trimmed === "") continue;
    let event;
    try { event = JSON.parse(trimmed); } catch { continue; } // skip non-JSON lines

    const action = String(event.Action || "");
    const pkgName = event.Package || "unknown";

    if (action === "build-output") {
      if (event.ImportPath && typeof event.Output === "string") {
        const text = event.Output.replace(/\n$/, "");
        if (text !== "") {
          if (!buildOutput.has(event.ImportPath)) buildOutput.set(event.ImportPath, []);
          buildOutput.get(event.ImportPath).push(text);
        }
      }
      continue;
    }
    if (action === "build-fail") continue; // handled at package-level fail

    const p = pkgOf(pkgName);

    if (action === "pass" && event.Test != null) p.pass++;
    else if (action === "fail") {
      if (event.Test != null) {
        p.fail++;
        const key = `${pkgName}\u0000${event.Test}`;
        const outs = currentTestOutput.get(key) || [];
        currentTestOutput.delete(key);
        p.failedTests.push([event.Test, outs]);
      } else if (event.FailedBuild != null) {
        p.buildFailed = true;
        if (buildOutput.has(event.FailedBuild)) {
          p.buildErrors = buildOutput.get(event.FailedBuild);
          buildOutput.delete(event.FailedBuild);
        }
      } else {
        p.packageFailed = true;
      }
    } else if (action === "skip" && event.Test != null) {
      p.skip++;
    } else if (action === "output" && typeof event.Output === "string") {
      if (event.Test != null) {
        const key = `${pkgName}\u0000${event.Test}`;
        if (!currentTestOutput.has(key)) currentTestOutput.set(key, []);
        currentTestOutput.get(key).push(event.Output.replace(/\n$/, ""));
      } else {
        const t = event.Output.trim();
        if (t !== "") p.packageFailOutput.push(t);
      }
    }
    // run / pause / cont / etc — ignored
  }

  const totalPackages = packages.size;
  let totalPass = 0, totalFail = 0, totalSkip = 0, totalBuildFail = 0, totalPkgFail = 0;
  for (const p of packages.values()) {
    totalPass += p.pass; totalFail += p.fail; totalSkip += p.skip;
    if (p.buildFailed) totalBuildFail++;
    if (p.packageFailed && p.fail === 0 && !p.buildFailed) totalPkgFail++;
  }

  const hasFailures = totalFail > 0 || totalBuildFail > 0 || totalPkgFail > 0;
  if (!hasFailures && totalPass === 0) return "Go test: No tests found";
  if (!hasFailures) return `Go test: ${totalPass} passed in ${totalPackages} packages`;

  let result = `Go test: ${totalPass} passed, ${totalFail + totalBuildFail + totalPkgFail} failed`;
  if (totalSkip > 0) result += `, ${totalSkip} skipped`;
  result += ` in ${totalPackages} packages\n`;

  for (const [name, p] of packages) {
    if (p.packageFailed && p.fail === 0 && !p.buildFailed) {
      result += `\n[PKG FAIL] ${name}\n`;
      for (const l of p.packageFailOutput.slice(0, MAX_TEST_OUTPUT_LINES)) result += `  ${truncateLine(l, 120)}\n`;
    }
    if (p.buildFailed) {
      result += `\n[BUILD FAIL] ${name}\n`;
      for (const l of p.buildErrors.slice(0, MAX_TEST_OUTPUT_LINES)) result += `  ${truncateLine(l, 120)}\n`;
    }
  }

  for (const [name, p] of packages) {
    if (p.failedTests.length === 0) continue;
    result += `\n${name}:\n`;
    for (const [test, outs] of p.failedTests) {
      result += `  [FAIL] ${truncateLine(test, 120)}\n`;
      const tail = outs.slice(-MAX_TEST_OUTPUT_LINES);
      for (const l of tail) result += `    ${truncateLine(l, 120)}\n`;
    }
  }

  return result.trim();
}
