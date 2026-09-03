import initializeApp from "./initializeApp.js";

// Fix #3744: suppress SOCKS5 and SQLite ExperimentalWarning early in process lifecycle
if (typeof process !== "undefined") {
  const origEmit = process.emit;
  if (typeof origEmit === "function") {
    process.emit = function (name, data, ...rest) {
      if (
        name === "warning" &&
        data?.name === "ExperimentalWarning" &&
        /(?:SOCKS5|SQLite)/i.test(data?.message || String(data || ""))
      ) {
        return false;
      }
      return origEmit.call(process, name, data, ...rest);
    };
  }
  if (typeof process.emitWarning === "function") {
    const origEmitWarning = process.emitWarning.bind(process);
    process.emitWarning = (warning, type, ...args) => {
      if (
        (type === "ExperimentalWarning" || (typeof warning === "object" && warning?.name === "ExperimentalWarning")) &&
        /(?:SOCKS5|SQLite)/i.test(typeof warning === "string" ? warning : warning?.message || "")
      ) {
        return;
      }
      return origEmitWarning(warning, type, ...args);
    };
  }
}

// Skip during Next.js build/prerender — bootstrap would download cloudflared, init DNS, etc.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"
  || process.env.NEXT_PHASE === "phase-export"
  || process.env.NEXT_PHASE === "phase-static";

// Server-only singleton: guard via global so HMR / re-imports don't double-init
if (typeof window === "undefined" && !isBuildPhase && !global.__appBootstrapped) {
  global.__appBootstrapped = true;
  initializeApp().catch((e) => console.error("[Bootstrap] init failed:", e.message));
}
