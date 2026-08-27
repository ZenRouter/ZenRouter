import { randomUUID } from "crypto";
import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";
import { commandCodeToOpenAIResponse } from "../translator/response/commandcode-to-openai.js";
import { SSE_DONE } from "../utils/sseConstants.js";

/**
 * CommandCodeExecutor — talks to https://api.commandcode.ai/alpha/generate
 *
 * Auth: Bearer <user_xxx> API key (stored as the connection's apiKey).
 * Adds the per-request `x-session-id` header expected by CommandCode upstream.
 *
 * Upstream returns AI SDK v5 NDJSON (one JSON event per line, no `data:` prefix).
 * We translate each event to an OpenAI chat.completion.chunk and emit it as SSE so
 * both the streaming and non-streaming (forced SSE → JSON) downstream handlers in
 * zenrouter can consume it without further format translation.
 */
export class CommandCodeExecutor extends BaseExecutor {
  constructor() {
    super("commandcode", PROVIDERS.commandcode);
  }

  transformRequest(model, body, stream, credentials) {
    body.stream = true;
    return body;
  }

  buildHeaders(credentials, stream = true) {
    const headers = {
      "Content-Type": "application/json",
      ...(this.config.headers || {}),
      "x-session-id": randomUUID(),
    };

    const token = credentials?.apiKey || credentials?.accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (stream) headers["Accept"] = "text/event-stream";
    return headers;
  }

  async execute(opts) {
    const result = await super.execute(opts);
    if (!result?.response?.ok || !result.response.body) return result;
    const peek = await peekFirstCommandCodeFrame(result.response);
    if (peek.isError) {
      await peek.reader.cancel().catch(() => {});
      return {
        ...result,
        response: new Response(JSON.stringify({
          error: { message: peek.message, code: peek.status || "commandcode_error", type: "server_error" }
        }), {
          status: peek.status || 503,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }),
      };
    }
    result.response = wrapNdjsonAsOpenAISse(peek.consumed, peek.reader, opts.model);
    return result;
  }
}

const CONTENT_TYPES = new Set(["text-delta", "reasoning-delta", "tool-input-start", "tool-input-delta", "tool-call", "finish-step", "finish"]);

async function peekFirstCommandCodeFrame(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let consumed = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) return { isError: false, consumed, reader };
    consumed += decoder.decode(value, { stream: true });
    let newline;
    while ((newline = consumed.indexOf("\n")) !== -1) {
      const line = consumed.slice(0, newline).replace(/\r$/, "").trim();
      if (!line) { consumed = consumed.slice(newline + 1); continue; }
      let event;
      try { event = JSON.parse(line.startsWith("data:") ? line.slice(5).trim() : line); } catch { consumed = consumed.slice(newline + 1); continue; }
      if (CONTENT_TYPES.has(event?.type)) return { isError: false, consumed, reader };
      const error = event?.type === "error" ? (event.error || event) : event;
      const status = Number(error?.statusCode) || 0;
      if (event?.type === "error" && (status >= 400 || error?.type === "server_error" || error?.isRetryable === true)) {
        return { isError: true, status: status >= 400 ? status : 503, message: error.message || `CommandCode upstream error (${status || "unknown"})`, consumed, reader };
      }
      consumed = consumed.slice(newline + 1);
    }
  }
}

function wrapNdjsonAsOpenAISse(seedBuffer, reader, model) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = seedBuffer || "";
  const state = { model };

  const emitChunks = (chunks, controller) => {
    if (!chunks) return;
    const list = Array.isArray(chunks) ? chunks : [chunks];
    for (const c of list) {
      if (c == null) continue;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`));
    }
  };

  const processLine = (line, controller) => {
    const trimmed = line.trim();
    if (trimmed) emitChunks(commandCodeToOpenAIResponse(trimmed, state), controller);
  };
  return new Response(new ReadableStream({
    async start(controller) {
      try {
        let newline;
        while ((newline = buffer.indexOf("\n")) !== -1) {
          processLine(buffer.slice(0, newline), controller);
          buffer = buffer.slice(newline + 1);
        }
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) processLine(buffer, controller);
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          while ((newline = buffer.indexOf("\n")) !== -1) {
            processLine(buffer.slice(0, newline), controller);
            buffer = buffer.slice(newline + 1);
          }
        }
      } finally {
        controller.enqueue(encoder.encode(SSE_DONE));
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() { return reader.cancel().catch(() => {}); },
  }), { status: 200, statusText: "OK", headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

export default CommandCodeExecutor;

export const __test__ = { peekFirstCommandCodeFrame, wrapNdjsonAsOpenAISse };
