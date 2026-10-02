"use server";

import { NextResponse } from "next/server";
import dns from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";
import { getEnvProxyUrl } from "open-sse/utils/proxyFetch.js";
import { assertNotCloudMetadata, assertPublicUrl, fetchPublic } from "@/shared/utils/ssrfGuard.js";
import { isLocalRequest } from "@/dashboardGuard";

const TIMEOUT_MS = 8000;

// Local callers may reach self-hosted/private servers, but not cloud metadata.
// Check the actual connector DNS answers so this exception cannot rebind to IMDS.
async function fetchLocalMcp(url, init) {
  let currentUrl = new URL(url);
  let currentInit = { ...init, headers: new Headers(init.headers) };
  for (let hop = 0; ; hop++) {
    assertNotCloudMetadata(currentUrl);
    // A proxy resolves target DNS itself, bypassing the guarded connector.
    // Do not silently evade configured egress policy by connecting directly.
    if (getEnvProxyUrl(currentUrl)) {
      throw new Error("Blocked URL: proxied local MCP cannot validate metadata targets; configure NO_PROXY for this trusted MCP server");
    }
    const agent = new Agent({
      connect: {
        lookup(host, options, callback) {
          dns.promises.lookup(host, { all: true, verbatim: true }).then((addresses) => {
            try {
              if (!addresses.length) throw new Error("Blocked URL: DNS returned no addresses");
              for (const { address, family } of addresses) {
                assertNotCloudMetadata(`http://${family === 6 ? `[${address}]` : address}/`);
              }
              const candidates = options.family ? addresses.filter((entry) => entry.family === options.family) : addresses;
              if (!candidates.length) throw new Error("Blocked URL: DNS returned no compatible addresses");
              if (options.all) callback(null, candidates);
              else callback(null, candidates[0].address, candidates[0].family);
            } catch (error) {
              callback(error);
            }
          }, (error) => callback(error));
        },
      },
    });
    let response;
    const onAbort = () => { void agent.destroy().catch(() => {}); };
    currentInit.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      response = await undiciFetch(currentUrl, { ...currentInit, dispatcher: agent, redirect: "manual" });
    } catch (error) {
      currentInit.signal?.removeEventListener("abort", onAbort);
      await agent.destroy().catch(() => {});
      throw error;
    }
    // Graceful close waits for the outstanding HTTP body; never destroy a live
    // caller stream just because headers have arrived.
    const closed = agent.close().catch(() => {}).finally(() => currentInit.signal?.removeEventListener("abort", onAbort));
    const location = [301, 302, 303, 307, 308].includes(response.status) ? response.headers.get("location") : null;
    if (!location) return response;
    await response.body?.cancel();
    await closed;
    if (hop >= 5) throw new Error("Blocked URL: too many redirects");
    const nextUrl = new URL(location, currentUrl);
    const method = (currentInit.method || "GET").toUpperCase();
    if (((response.status === 301 || response.status === 302) && method === "POST") ||
        (response.status === 303 && method !== "GET" && method !== "HEAD")) {
      currentInit = { ...currentInit, method: "GET", body: undefined };
      for (const header of ["content-encoding", "content-language", "content-location", "content-type", "content-length"]) {
        currentInit.headers.delete(header);
      }
    }
    if (nextUrl.origin !== currentUrl.origin) {
      if (currentInit.body != null) throw new Error("Blocked URL: cross-origin body redirect");
      for (const header of ["authorization", "proxy-authorization", "cookie", "cookie2", "mcp-session-id", "host"]) {
        currentInit.headers.delete(header);
      }
    }
    currentUrl = nextUrl;
  }
}

// Probe MCP server: initialize + tools/list. No auth header — works for authless servers.
// OAuth servers return 401, signal client to skip tool listing.
async function probeMcp(url, local) {
  const requestMcp = local ? fetchLocalMcp : fetchPublic;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "MCP-Protocol-Version": "2025-06-18",
  };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    // Step 1: initialize
    const initRes = await requestMcp(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "zenrouter", version: "1" } },
      }),
      signal: ac.signal,
    });
    if (initRes.status === 401 || initRes.status === 403) {
      await initRes.body?.cancel();
      return { requiresAuth: true, tools: [] };
    }
    if (!initRes.ok) {
      await initRes.body?.cancel();
      return { error: `init ${initRes.status}`, tools: [] };
    }
    const sessionId = initRes.headers.get("mcp-session-id") || "";
    await initRes.text().catch(() => {});

    const listHeaders = { ...headers };
    if (sessionId) listHeaders["mcp-session-id"] = sessionId;

    // Step 2: notifications/initialized (required by spec before tools/list)
    const notificationRes = await requestMcp(url, {
      method: "POST",
      headers: listHeaders,
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
      signal: ac.signal,
    });
    await notificationRes.body?.cancel();

    // Step 3: tools/list
    const listRes = await requestMcp(url, {
      method: "POST",
      headers: listHeaders,
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
      signal: ac.signal,
    });
    if (listRes.status === 401 || listRes.status === 403) {
      await listRes.body?.cancel();
      return { requiresAuth: true, tools: [] };
    }
    const ct = listRes.headers.get("content-type") || "";
    let parsed;
    if (ct.includes("text/event-stream")) {
      // Parse SSE: each "data: {...}" line is a JSON-RPC message
      const text = await listRes.text();
      const dataLines = text.split("\n").filter((l) => l.startsWith("data:"));
      for (const line of dataLines) {
        try {
          const obj = JSON.parse(line.replace(/^data:\s*/, ""));
          if (obj?.id === 2 && obj.result) { parsed = obj; break; }
        } catch { /* skip */ }
      }
    } else {
      parsed = await listRes.json().catch(() => null);
    }
    const tools = parsed?.result?.tools || [];
    return {
      tools: tools.map((t) => ({ name: t.name, description: t.description || "" })),
    };
  } catch (e) {
    return { error: e.name === "AbortError" ? "timeout" : e.message, tools: [] };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    const local = isLocalRequest(request);
    // Local peers keep private self-hosted MCP access, but never metadata.
    // Remote calls use DNS-pinned validation on every handshake and redirect.
    try {
      assertNotCloudMetadata(url);
      if (!local) assertPublicUrl(url);
    } catch {
      return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
    }
    const result = await probeMcp(url, local);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message, tools: [] }, { status: 500 });
  }
}
