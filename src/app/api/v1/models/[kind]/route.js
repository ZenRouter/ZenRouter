import { buildModelsList } from "../route.js";

// URL slug → service kind(s). `web` covers both webSearch and webFetch.
const KIND_SLUG_MAP = {
  "image": ["image"],
  "tts": ["tts"],
  "stt": ["stt"],
  "embedding": ["embedding"],
  "image-to-text": ["imageToText"],
  "web": ["webSearch", "webFetch"],
};

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

/**
 * GET /v1/models/{kind_or_id} - OpenAI-compatible models list filtered by capability,
 * or retrieve a single model object when queried by model ID (e.g. Claude Code interactive check).
 */
export async function GET(_request, { params }) {
  try {
    const { kind: kindOrId } = await params;
    const kindFilter = KIND_SLUG_MAP[kindOrId];

    if (kindFilter) {
      const data = await buildModelsList(kindFilter);
      return Response.json({ object: "list", data }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // Single model ID lookup (fixes Claude Code CLI interactive mode & SDK lookups)
    const allModels = await buildModelsList();
    const decodedId = decodeURIComponent(kindOrId);
    const found = allModels.find(m => m.id === decodedId || m.id === kindOrId);

    if (found) {
      return Response.json(found, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    return Response.json(
      {
        error: {
          message: `Model '${kindOrId}' not found in catalog`,
          type: "invalid_request_error",
          code: "model_not_found"
        },
      },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.log("Error fetching model by kind/id:", error);
    return Response.json(
      { error: { message: error.message, type: "server_error" } },
      { status: 500 }
    );
  }
}
