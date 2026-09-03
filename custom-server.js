const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const origCreate = http.createServer.bind(http);

// Per-process secret proving x-zen-real-ip was stamped below rather than sent by the client.
// A bare `next start` / `next dev` never loads this file, so it cannot produce a matching
// header even though the env var is inherited by child processes.
const PEER_TOKEN = crypto.randomBytes(24).toString("hex");
process.env.ZENROUTER_PEER_TOKEN = PEER_TOKEN;
process.env.NINEROUTER_PEER_TOKEN = PEER_TOKEN;

let backgroundRefreshStarted = false;

function startBackgroundTokenRefreshFromCustomServer() {
  if (backgroundRefreshStarted) return;
  backgroundRefreshStarted = true;
  // Prefer source path (repo / standalone that still has src). Fail-open if missing
  // — initializeApp also starts the same scheduler when the Next app boots.
  const modPath = path.join(__dirname, "src", "sse", "services", "backgroundTokenRefresh.js");
  import(pathToFileURL(modPath).href)
    .then((m) => {
      try {
        m.startBackgroundTokenRefresh();
      } catch (e) {
        console.error("[BackgroundTokenRefresh] start failed:", e && e.message ? e.message : e);
      }
      const stop = () => {
        try {
          m.stopBackgroundTokenRefresh();
        } catch {
          /* ignore */
        }
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    })
    .catch((e) => {
      // Expected in published CLI standalone (src/ not on disk). App bootstrap covers it.
      if (process.env.DEBUG_BACKGROUND_TOKEN_REFRESH) {
        console.error("[BackgroundTokenRefresh] import failed:", e && e.message ? e.message : e);
      }
    });
}

// Wrap Next standalone HTTP server: derive client IP from the TCP socket
// (unspoofable) and strip client-supplied forwarding headers so downstream
// rate-limiting keys on the real peer address instead of attacker-controlled XFF.
http.createServer = (...args) => {
  const handler = args.find((a) => typeof a === "function");
  const rest = args.filter((a) => typeof a !== "function");
  if (!handler) return origCreate(...args);
  const wrapped = (req, res) => {
    // Static Asset URL Normalizer: fix encoded dynamic segments in _next/static
    // e.g. /_next/static/chunks/app/(dashboard)/dashboard/providers/%5Bid%5D/page-*.js
    // Browser encodes [ ] ( ) but disk files are decoded. Without this, ChunkLoadError 2134.
    // Whitelist-only decode to avoid %2F/%2E path-traversal over-decode.
    if (req.url && req.url.includes("%") && req.url.includes("/_next/static/")) {
      try {
        const url = new URL(req.url, "http://localhost");
        if (url.pathname.startsWith("/_next/static/") && url.pathname.includes("%")) {
          // Only decode brackets/parens/curly that Next uses for route groups/dynamic segments
          const decodedPath = url.pathname.replace(/%(2F|2E|28|29|5B|5D|7B|7D)/gi, (m) => {
            try {
              return decodeURIComponent(m);
            } catch {
              return m;
            }
          });
          // Guard against traversal after decode
          if (decodedPath !== url.pathname && !decodedPath.includes("..") && !decodedPath.includes("//")) {
            req.url = decodedPath + url.search;
          } else if (decodedPath !== url.pathname) {
            // Fallback to safe 4-code replace if traversal detected
            const safe = url.pathname
              .replace(/%28/gi, "(")
              .replace(/%29/gi, ")")
              .replace(/%5B/gi, "[")
              .replace(/%5D/gi, "]");
            if (safe !== url.pathname) req.url = safe + url.search;
          }
        }
      } catch {
        // Fallback for malformed URI — handle known encodings only, preserve query
        const qIdx = req.url.indexOf("?");
        const pathOnly = qIdx === -1 ? req.url : req.url.slice(0, qIdx);
        const search = qIdx === -1 ? "" : req.url.slice(qIdx);
        if (pathOnly.startsWith("/_next/static/")) {
          const decoded = pathOnly
            .replace(/%28/gi, "(")
            .replace(/%29/gi, ")")
            .replace(/%5B/gi, "[")
            .replace(/%5D/gi, "]");
          if (decoded !== pathOnly) req.url = decoded + search;
        }
      }
    }

    // Low-latency streaming tuning: disable Nagle's algorithm (TCP_NODELAY) and enable TCP Keep-Alive
    if (req.socket) {
      if (typeof req.socket.setNoDelay === "function") req.socket.setNoDelay(true);
      if (typeof req.socket.setKeepAlive === "function") req.socket.setKeepAlive(true, 30000);
      // Log unexpected client socket errors without leaking listeners across requests
      const onSocketError = (err) => {
        if (err && err.code !== "ECONNRESET" && err.code !== "EPIPE") {
          console.error("[Socket] Client socket error:", err.message);
        }
      };
      req.socket.once("error", onSocketError);
      if (typeof res.once === "function") {
        res.once("finish", () => {
          if (req.socket && typeof req.socket.removeListener === "function") {
            req.socket.removeListener("error", onSocketError);
          }
        });
      }
    }

    // NOTE: Client abort is handled natively via request.signal (see src/sse/handlers/chat.js
    // and open-sse/handlers/chatCore.js clientSignal.addEventListener('abort')).
    // Do NOT attach destructive req.once('close', () => res.destroy()) here because IncomingMessage
    // emits 'close' as soon as the request body stream finishes reading, which prematurely terminates
    // pending POST bodies (e.g. login and chat completions) before request.json() can parse them.

    const socketIp = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";
    const xff = req.headers["x-forwarded-for"];
    const xRealIp = req.headers["x-real-ip"];
    const viaProxy = !!(xff || xRealIp);
    const isLoopbackProxy = socketIp === "127.0.0.1" || socketIp === "::1" || socketIp === "::ffff:127.0.0.1";
    // Trust forwarding headers only when the TCP peer is a local reverse proxy.
    // Direct/public sockets remain keyed by the unspoofable peer address.
    const proxyIp = xRealIp || (xff ? String(xff).split(",")[0].trim() : "");
    const ip = isLoopbackProxy && proxyIp ? proxyIp : socketIp;
    delete req.headers["x-zen-real-ip"];
    delete req.headers["x-zen-real-ip"];
    delete req.headers["x-forwarded-for"];
    delete req.headers["x-zen-via-proxy"];
    delete req.headers["x-zen-via-proxy"];
    delete req.headers["x-zen-peer-token"];
    delete req.headers["x-zen-peer-token"];
    req.headers["x-zen-real-ip"] = ip;
    req.headers["x-zen-real-ip"] = ip;
    req.headers["x-zen-peer-token"] = PEER_TOKEN;
    req.headers["x-zen-peer-token"] = PEER_TOKEN;
    if (viaProxy) {
      req.headers["x-zen-via-proxy"] = "1";
      req.headers["x-zen-via-proxy"] = "1";
    }

    return handler(req, res);
  };
  const server = origCreate(...rest, wrapped);
  // Increase HTTP keep-alive timeout to prevent stale connection resets during agent idle periods.
  // Default Node keepAliveTimeout is 5s, which causes "error sending request" after idle.
  // See decolua/9router#3709.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.once("listening", () => {
    startBackgroundTokenRefreshFromCustomServer();
  });
  const origEmit = server.emit;
  // JBR 25 sends h2c upgrades that the HTTP/1.1 server would otherwise close.
  server.emit = function (event, ...eventArgs) {
    const [req, socket, head] = eventArgs;
    if (event !== "upgrade" || String(req.headers.upgrade || "").toLowerCase() !== "h2c") {
      return origEmit.call(this, event, ...eventArgs);
    }

    const contentLength = Number(req.headers["content-length"] || 0);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      socket.destroy();
      return true;
    }
    const chunks = [head];
    let received = head.length;
    const serve = () => {
      // Replay the upgraded request through the existing HTTP/1.1 handler.
      const replay = new http.IncomingMessage(socket);
      Object.assign(replay, { method: req.method, url: req.url, headers: req.headers, complete: true });
      if (received) replay.push(Buffer.concat(chunks, received).subarray(0, contentLength));
      replay.push(null);
      const res = new http.ServerResponse(replay);
      res.shouldKeepAlive = false;
      res.assignSocket(socket);
      res.once("finish", () => socket.end());
      Promise.resolve().then(() => wrapped(replay, res)).catch((error) => {
        console.error("Failed to downgrade h2c request", error);
        socket.destroy();
      });
    };
    if (received >= contentLength) serve();
    else {
      socket.on("data", function readBody(chunk) {
        chunks.push(chunk);
        received += chunk.length;
        if (received < contentLength) return;
        socket.off("data", readBody);
        serve();
      });
      socket.resume();
    }
    delete req.headers.upgrade;
    delete req.headers["http2-settings"];
    req.headers.connection = "close";
    return true;
  };
  return server;
};

if (require.main === module) {
  const standalone = path.join(__dirname, "server.js");
  if (fs.existsSync(standalone)) {
    require(standalone);
  } else {
    // Repo checkout has no standalone build next to us. `next start` builds its HTTP
    // server in-process, so the wrapper above still sanitizes every request.
    const nextBin = require.resolve("next/dist/bin/next");
    process.argv = [process.argv[0], nextBin, "start", ...process.argv.slice(2)];
    require(nextBin);
  }
}
