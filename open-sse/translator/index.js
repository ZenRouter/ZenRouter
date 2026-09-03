import { FORMATS } from "./formats.js";
import { ensureToolCallIds, fixMissingToolResponses } from "./concerns/toolCall.js";
import { prepareClaudeRequest } from "./formats/claude.js";
import { cloakClaudeTools, decloakStreamChunk } from "../utils/claudeCloaking.js";
import { compressToolNames, decloakOpenAIChunk } from "../utils/toolCompressor.js";
import { filterToOpenAIFormat } from "./formats/openai.js";
import { stripUnsupportedChatExtensions } from "./concerns/paramSupport.js";
import { normalizeThinkingConfig } from "../services/provider.js";
import { applyThinking, captureThinking } from "./concerns/thinkingUnified.js";
import { captureSessionId } from "../utils/sessionManager.js";
import { AntigravityExecutor } from "../executors/antigravity.js";
import { PROVIDERS } from "../providers/index.js";

// Registry for translators. Lazy-init guards against circular-import order:
// translator modules call register() (side-effect) before this module's body runs.
// var (not let): hoisted as undefined so register() can run during circular import (no TDZ).
var requestRegistry;
var responseRegistry;

// Register translator
export function register(from, to, requestFn, responseFn) {
  requestRegistry ??= new Map();
  responseRegistry ??= new Map();
  const key = `${from}:${to}`;
  if (requestFn) {
    requestRegistry.set(key, requestFn);
  }
  if (responseFn) {
    responseRegistry.set(key, responseFn);
  }
}

// No-op: translators self-register via the static imports at the bottom of this file.
function ensureInitialized() {}

// Strip specific content types from messages (explicit opt-in via strip[] in PROVIDER_MODELS)
function stripContentTypes(body, stripList = []) {
  if (!stripList.length || !body.messages || !Array.isArray(body.messages)) return;
  const imageTypes = new Set(["image_url", "image"]);
  const audioTypes = new Set(["audio_url", "input_audio"]);
  const shouldStrip = (type) => {
    if (imageTypes.has(type)) return stripList.includes("image");
    if (audioTypes.has(type)) return stripList.includes("audio");
    return false;
  };
  for (const msg of body.messages) {
    if (!Array.isArray(msg.content)) continue;
    msg.content = msg.content.filter(part => !shouldStrip(part.type));
    if (msg.content.length === 0) msg.content = "";
  }
}

// Translate request: source -> openai -> target
export function translateRequest(sourceFormat, targetFormat, model, body, stream = true, credentials = null, provider = null, reqLogger = null, stripList = [], connectionId = null, clientTool = null) {
  ensureInitialized();
  let result = body;

  // Compress tool names > 64 chars to prevent provider INVALID_ARGUMENT rejection (#3622)
  const { body: compressedBody, toolNameMap: compressedMap } = compressToolNames(sourceFormat, result);
  result = compressedBody;
  if (compressedMap?.size > 0) {
    result._toolNameMap = compressedMap;
  }

  // Strip explicit content types (opt-in via strip[] in PROVIDER_MODELS entry)
  stripContentTypes(result, stripList);

  // Normalize thinking config: remove if lastMessage is not user
  normalizeThinkingConfig(result);

  // Always ensure tool_calls have id (some providers require it)
  ensureToolCallIds(result);
  
  // Kiro performs stricter source-aware reconciliation after session replay.
  // The generic helper inserts OpenAI `role: tool` messages, which a direct
  // Claude→Kiro translator cannot consume and which cannot repair partial
  // parallel tool results.
  if (targetFormat !== FORMATS.KIRO) {
    fixMissingToolResponses(result);
  }

  // Capture thinking intent from the original (pre-translation) body, before any
  // format conversion strips/renames the fields. Applied after translation.
  const thinkingIntent = captureThinking(result);

  // Capture session id from the original body (envelope still intact, e.g. antigravity request.sessionId)
  const clientSessionId = captureSessionId(result, credentials, connectionId, targetFormat);
  // Expose to downstream translators (gemini-cli/antigravity envelopes) that run after envelope is stripped
  if (credentials) credentials._clientSessionId = clientSessionId;

  // If same format, skip translation steps
  if (sourceFormat !== targetFormat) {
    // Direct route: if a translator is registered for this exact source:target
    // pair, use it instead of pivoting through OpenAI. This is lossless for
    // pairs like claude:kiro (avoids the claude->openai->kiro double-hop).
    const directFn = requestRegistry.get(`${sourceFormat}:${targetFormat}`);
    if (directFn) {
      result = directFn(model, result, stream, credentials);
    } else {
      // Step 1: source -> openai (if source is not openai)
      if (sourceFormat !== FORMATS.OPENAI) {
        const toOpenAI = requestRegistry.get(`${sourceFormat}:${FORMATS.OPENAI}`);
        if (toOpenAI) {
          result = toOpenAI(model, result, stream, credentials);
          // Log OpenAI intermediate format
          reqLogger?.logOpenAIRequest?.(result);
        }
      }

      // Step 2: openai -> target (if target is not openai)
      if (targetFormat !== FORMATS.OPENAI) {
        const fromOpenAI = requestRegistry.get(`${FORMATS.OPENAI}:${targetFormat}`);
        if (fromOpenAI) {
          result = fromOpenAI(model, result, stream, credentials);
        }
      }
    }
  }

  // Normalize thinking to the target provider-native format (config-driven, capability-aware).
  // Kiro's GenerateAssistantResponse request does not accept the generic top-level
  // `thinking` field; its translators map thinking intent to KAS-compatible
  // systemPrompt/additionalModelRequestFields instead.
  const kiroThinkingMappedByTranslator =
    targetFormat === FORMATS.KIRO &&
    (sourceFormat === FORMATS.OPENAI || sourceFormat === FORMATS.CLAUDE);
  if (!kiroThinkingMappedByTranslator) {
    applyThinking(targetFormat, model, result, provider, thinkingIntent);
  }

  // Always normalize to clean OpenAI format when target is OpenAI
  // This handles hybrid requests (e.g., OpenAI messages + Claude tools)
  if (targetFormat === FORMATS.OPENAI) {
    result = filterToOpenAIFormat(result, {
      preserveCacheControl: !!PROVIDERS[provider]?.quirks?.preserveCacheControl,
    });
    // Chat clients have always had prompt_cache_key forwarded verbatim (executors such
    // as opencode read it post-translation for session affinity). Only the
    // Responses→Chat hop newly exposes the field, so scope the strict-endpoint guard
    // to that direction; providers opt in via the preservePromptCacheKey quirk.
    if (sourceFormat === FORMATS.OPENAI_RESPONSES) {
      stripUnsupportedChatExtensions(provider, result);
    }
  }

  // Final step: prepare request for Claude format endpoints
  if (targetFormat === FORMATS.CLAUDE) {
    const apiKey = credentials?.accessToken || credentials?.apiKey || null;
    result = prepareClaudeRequest(result, provider, apiKey, connectionId, credentials?.rawHeaders, clientSessionId);
  }

  // Claude cloaking: rename client tools with CLAUDE_TOOL_SUFFIX (anti-ban)
  // quirk: only providers flagged cloakToolsOnOAuth, and only with an OAuth token
  if (PROVIDERS[provider]?.quirks?.cloakToolsOnOAuth) {
    const apiKey = credentials?.accessToken || credentials?.apiKey || null;
    if (apiKey?.includes("sk-ant-oat")) {
      const { body: cloakedBody, toolNameMap } = cloakClaudeTools(result);
      result = cloakedBody;
      if (toolNameMap?.size > 0) {
        if (result._toolNameMap) {
          const merged = new Map(result._toolNameMap);
          for (const [suffixed, orig] of toolNameMap) {
            const trueOriginal = result._toolNameMap.get(orig) || orig;
            merged.set(suffixed, trueOriginal);
          }
          result._toolNameMap = merged;
        } else {
          result._toolNameMap = toolNameMap;
        }
      }
    }
  }

  // Antigravity cloaking disabled
  // if (provider === FORMATS.ANTIGRAVITY && body.userAgent !== FORMATS.ANTIGRAVITY) {
  //   const { cloakedBody, toolNameMap } = AntigravityExecutor.cloakTools(result);
  //   result = cloakedBody;
  //   if (toolNameMap?.size > 0) {
  //     result._toolNameMap = toolNameMap;
  //   }
  // }

  return result;
}

// Translate response chunk: target -> openai -> source
export function translateResponse(targetFormat, sourceFormat, chunk, state) {
  ensureInitialized();
  // If same format, return as-is — except the tool name may still be cloaked or compressed:
  // translateRequest() suffixes client tools for OAuth-cloaked Claude providers and compresses
  // long tool names for Gemini/Vertex/OpenAI, so streamed tool_use blocks must be decloaked here.
  if (sourceFormat === targetFormat) {
    if (sourceFormat === FORMATS.CLAUDE) {
      return [decloakStreamChunk(chunk, state?.toolNameMap)];
    }
    if (sourceFormat === FORMATS.OPENAI || sourceFormat === FORMATS.OPENAI_RESPONSES) {
      return [decloakOpenAIChunk(chunk, state?.toolNameMap)];
    }
    return [chunk];
  }

  let results = [chunk];
  let openaiResults = null; // Store OpenAI intermediate results

  // Direct route: if a response translator is registered for this exact
  // target:source pair, use it instead of pivoting through OpenAI. Mirrors the
  // request-side direct route (e.g. kiro:claude — KiroExecutor already emits
  // OpenAI-shaped chunks, so this converts them straight to Claude SSE).
  const directFn = responseRegistry.get(`${targetFormat}:${sourceFormat}`);
  if (directFn) {
    const converted = directFn(chunk, state);
    return converted ? (Array.isArray(converted) ? converted : [converted]) : [];
  }

  // Step 1: target -> openai (if target is not openai)
  if (targetFormat !== FORMATS.OPENAI) {
    const toOpenAI = responseRegistry.get(`${targetFormat}:${FORMATS.OPENAI}`);
    if (toOpenAI) {
      results = [];
      const converted = toOpenAI(chunk, state);
      if (converted) {
        results = Array.isArray(converted) ? converted : [converted];
        openaiResults = results; // Store OpenAI intermediate
      }
    }
  }

  // Step 2: openai -> source (if source is not openai)
  if (sourceFormat !== FORMATS.OPENAI) {
    const fromOpenAI = responseRegistry.get(`${FORMATS.OPENAI}:${sourceFormat}`);
    if (fromOpenAI) {
      const finalResults = [];
      for (const r of results) {
        const converted = fromOpenAI(r, state);
        if (converted) {
          finalResults.push(...(Array.isArray(converted) ? converted : [converted]));
        }
      }
      results = finalResults;
    }
  }

  // Attach OpenAI intermediate results for logging
  if (openaiResults && sourceFormat !== FORMATS.OPENAI && targetFormat !== FORMATS.OPENAI) {
    results._openaiIntermediate = openaiResults;
  }

  // Decloak tool names on final translated chunks if toolNameMap was used
  if (state?.toolNameMap?.size > 0) {
    if (sourceFormat === FORMATS.CLAUDE) {
      results = results.map((r) => decloakStreamChunk(r, state.toolNameMap));
    } else if (sourceFormat === FORMATS.OPENAI || sourceFormat === FORMATS.OPENAI_RESPONSES) {
      results = results.map((r) => decloakOpenAIChunk(r, state.toolNameMap));
    }
  }

  return results;
}

// Check if translation needed
export function needsTranslation(sourceFormat, targetFormat) {
  return sourceFormat !== targetFormat;
}

// Initialize state for streaming response based on format
export function initState(sourceFormat) {
  // Base state for all formats
  const base = {
    messageId: null,
    model: null,
    textBlockStarted: false,
    thinkingBlockStarted: false,
    inThinkingBlock: false,
    currentBlockIndex: null,
    toolCalls: new Map(),
    finishReason: null,
    finishReasonSent: false,
    usage: null,
    contentBlockIndex: -1
  };

  // Add openai-responses specific fields
  if (sourceFormat === FORMATS.OPENAI_RESPONSES) {
    return {
      ...base,
      seq: 0,
      responseId: `resp_${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      started: false,
      msgTextBuf: {},
      msgItemAdded: {},
      msgContentAdded: {},
      msgItemDone: {},
      reasoningId: "",
      reasoningIndex: -1,
      reasoningBuf: "",
      reasoningPartAdded: false,
      reasoningDone: false,
      inThinking: false,
      funcArgsBuf: {},
      funcNames: {},
      funcCallIds: {},
      funcItemAdded: {},
      funcArgsDone: {},
      funcItemDone: {},
      customToolNames: new Set(),
      completedSent: false
    };
  }

  return base;
}

// Kept for backward compatibility; translators are already registered at import time.
export function initTranslators() {
  ensureInitialized();
}

// Static side-effect imports: each module calls register() at load (works in ESM + bundler).
import "./request/claude-to-openai.js";
import "./request/openai-to-claude.js";
import "./request/gemini-to-openai.js";
import "./request/openai-to-gemini.js";
import "./request/openai-to-vertex.js";
import "./request/antigravity-to-openai.js";
import "./request/openai-responses.js";
import "./request/openai-to-kiro.js";
import "./request/openai-to-cursor.js";
import "./request/openai-to-ollama.js";
import "./request/openai-to-commandcode.js";
import "./request/claude-to-kiro.js";
import "./response/claude-to-openai.js";
import "./response/openai-to-claude.js";
import "./response/gemini-to-openai.js";
import "./response/openai-to-antigravity.js";
import "./response/openai-responses.js";
import "./response/kiro-to-openai.js";
import "./response/cursor-to-openai.js";
import "./response/ollama-to-openai.js";
import "./response/commandcode-to-openai.js";
import "./response/kiro-to-claude.js";
