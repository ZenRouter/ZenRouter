import { describe, expect, it } from "vitest";
import { __test__ } from "../../open-sse/executors/commandcode.js";

function response(lines) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${line}\n`));
      controller.close();
    },
  }), { status: 200 });
}

const unavailable = JSON.stringify({
  type: "error",
  error: { type: "server_error", statusCode: 503, isRetryable: true, message: "Service temporarily unavailable" },
});

describe("CommandCode embedded errors (#3468)", () => {
  it("recognizes an embedded 503 before content begins", async () => {
    const peek = await __test__.peekFirstCommandCodeFrame(response([unavailable]));
    expect(peek).toMatchObject({ isError: true, status: 503 });
  });

  it("does not turn a post-content error into a request-level failure", async () => {
    const peek = await __test__.peekFirstCommandCodeFrame(response([
      JSON.stringify({ type: "text-delta", text: "hello" }),
      unavailable,
    ]));
    expect(peek.isError).toBe(false);
  });
});
