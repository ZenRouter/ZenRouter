import { describe, it, expect } from "vitest";
import {
  pipeWithDisconnect,
  createStreamController,
} from "open-sse/utils/streamHandler.js";

// Regression: a stall/TTFT timeout must actually kill the upstream request
// (via the controller AbortSignal wired into fetch) — never just stop the
// local promise while the socket keeps streaming in the background.
// Downstream closes gracefully; the cause is delivered via onError.
// (Real timers with tiny budgets: fake timers deadlock against pending
// ReadableStream pulls.)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("pipeWithDisconnect — timeout aborts upstream, fires once", () => {
  function setup() {
    let upstreamCtrl;
    const upstreamBody = new ReadableStream({
      start(c) { upstreamCtrl = c; },
      cancel() {},
    });
    const providerResponse = { body: upstreamBody };
    const transformStream = new TransformStream();
    const errors = [];
    const controller = createStreamController({
      provider: "claude",
      model: "claude-opus-5-5",
      onError: (e) => errors.push(e),
    });
    // Faithful fetch simulation: aborting the signal destroys the socket,
    // which errors the response body (this is what unblocks a hung pull).
    controller.signal.addEventListener("abort", () => {
      try { upstreamCtrl.error(new Error("fetch aborted")); } catch {}
    });
    const stream = pipeWithDisconnect(
      providerResponse, transformStream, controller,
      null, 60, 30, 0, "openai"
    );
    return { upstreamCtrl, providerResponse, controller, errors, stream };
  }

  it("TTFT timeout aborts the controller signal and reports once", async () => {
    const { controller, errors, stream } = setup();
    const reader = stream.getReader();
    const readP = reader.read();

    await sleep(120);

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("TTFT timeout (30ms)");
    // load-bearing: the AbortSignal handed to fetch is aborted → socket dies
    expect(controller.signal.aborted).toBe(true);
    // downstream sees a graceful close, not a silent hang
    await expect(readP).resolves.toMatchObject({ done: true });

    // no duplicate firing, no orphan re-arm
    await sleep(150);
    expect(errors.length).toBe(1);
    reader.releaseLock();
  }, 10_000);

  it("inter-chunk stall timeout aborts after activity then silence", async () => {
    const { upstreamCtrl, controller, errors, stream } = setup();
    const reader = stream.getReader();

    upstreamCtrl.enqueue(new TextEncoder().encode('data: {"a":1}\n\n'));
    const first = await reader.read();
    expect(first.done).toBe(false);

    await sleep(30);
    expect(errors.length).toBe(0); // activity re-armed the watchdog

    const hungRead = reader.read();
    await sleep(120);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("stream stall timeout (60ms)");
    expect(controller.signal.aborted).toBe(true);
    await expect(hungRead).resolves.toMatchObject({ done: true });

    await sleep(150);
    expect(errors.length).toBe(1);
    reader.releaseLock();
  }, 10_000);
});
