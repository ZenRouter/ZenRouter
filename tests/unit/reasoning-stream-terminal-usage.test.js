import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ trackPendingRequest: vi.fn(), appendRequestLog: vi.fn(async () => {}) }));
vi.mock('@/lib/usageDb.js', () => db);
import { FORMATS as F } from '../../open-sse/translator/formats.js';
import { createSSEStream } from '../../open-sse/utils/stream.js';
import { convertResponsesStreamToJson } from '../../open-sse/transformer/streamToJsonConverter.js';
import { extractUsage, canonicalizeUsage, filterUsageForFormat } from '../../open-sse/utils/usageTracking.js';
import { openaiResponsesObjectToCompletion } from '../../open-sse/translator/response/openai-responses.js';
import { handleComboChat, peekStreamForContent } from '../../open-sse/services/combo.js';
it('budget Gemini thoughts count once in canonical streamed completion', () => {
  for (const wrap of [u => ({ usageMetadata: u }), u => ({ response: { usageMetadata: u } })]) {
    const raw = wrap({ promptTokenCount: 12, candidatesTokenCount: 3, thoughtsTokenCount: 16, totalTokenCount: 31 });
    expect(canonicalizeUsage(extractUsage(raw))).toMatchObject({ prompt_tokens: 12, completion_tokens: 19, total_tokens: 31, reasoning_tokens: 16 });
  }
});
for (const [name, chunks] of [
  ['paid reasoning', [{ choices: [{ delta: { reasoning_content: 'Thinking' }, finish_reason: 'stop' }] }, { choices: [], usage: { prompt_tokens: 12, completion_tokens: 16 } }]],
  ['refusal', [{ choices: [{ delta: { refusal: 'Cannot comply' }, finish_reason: 'stop' }] }]],
  ['usage only', [{ choices: [], usage: { prompt_tokens: 12, completion_tokens: 16 } }]],
  ['Responses incomplete', [{ type: 'response.incomplete', response: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] } }]],
]) {
  it(`budget combo agrees with peek for ${name} and never replays a paid stream`, async () => {
    const peek = await peekStreamForContent(upstream(chunks));
    expect(peek.hasContent).toBe(true);
    await new Response(peek.body).text();
    const single = vi.fn().mockImplementationOnce(() => upstream(chunks)).mockImplementation(() => Response.json({ answer: 'fallback' }));
    const log = { info() {}, warn() {}, debug() {} };
    const result = await handleComboChat({ body: { stream: true, messages: [] }, models: ['offline/a', 'offline/b'], handleSingleModel: single, log, comboName: 'offline-budget', comboStrategy: 'fallback', autoSwitch: false });
    await result.text();
    expect(single).toHaveBeenCalledTimes(1);
  });
}
it('budget full zero trailer wins over prior counters before one Responses terminal', async () => {
  const chunks = [
    { choices: [{ delta: { content: 'Partial' }, finish_reason: null }], usage: actual },
    { choices: [{ delta: {}, finish_reason: 'length' }] },
    { choices: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } },
  ];
  const { events, complete } = await run(chunks, F.OPENAI, F.OPENAI_RESPONSES);
  const terminals = events.filter(e => e.type === 'response.incomplete');
  expect(terminals).toHaveLength(1);
  expect(terminals[0].response.usage).toEqual({ input_tokens: 0, output_tokens: 0, total_tokens: 0 });
  expect(complete.mock.calls[0][1]).toMatchObject({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
});
it('budget native incomplete unterminated data tail is still terminal and billed', async () => {
  const complete = vi.fn();
  const input = new Response(`event: response.incomplete\ndata: ${JSON.stringify(incomplete)}`);
  const wire = await new Response(input.body.pipeThrough(createSSEStream({ targetFormat: F.OPENAI_RESPONSES, sourceFormat: F.OPENAI_RESPONSES, onStreamComplete: complete }))).text();
  expect(wire).not.toContain('stream_disconnected');
  expect(complete.mock.calls[0][1]).toMatchObject(actual);
});
it('budget Responses native object keeps incomplete length and detailed reasoning usage', () => {
  const result = openaiResponsesObjectToCompletion(incomplete.response);
  expect(result.choices[0].finish_reason).toBe('length');
  expect(result.usage).toEqual(actual);
  expect(filterUsageForFormat(nativeUsage, F.OPENAI_RESPONSES)).toEqual(nativeUsage);
});
it('budget combo recognizes input-only incurred usage without treating genuine empty transport as paid', async () => {
  const paid = [{ choices: [], usage: { prompt_tokens: 12, completion_tokens: 0, total_tokens: 12 } }];
  const peek = await peekStreamForContent(upstream(paid));
  expect(peek.hasContent).toBe(true);
  await new Response(peek.body).text();
  const empty = await peekStreamForContent(upstream([{ choices: [{ delta: { role: 'assistant' }, finish_reason: 'stop' }] }]));
  expect(empty.hasContent).toBe(false);
});
it('budget usage trailer finalizes accounting before Responses clients cancel on incomplete', async () => {
  let upstreamController;
  const input = new ReadableStream({ start(controller) { upstreamController = controller; } });
  const complete = vi.fn();
  const reader = input.pipeThrough(createSSEStream({ targetFormat: F.OPENAI, sourceFormat: F.OPENAI_RESPONSES, onStreamComplete: complete })).getReader();
  upstreamController.enqueue(new TextEncoder().encode(sse(chatChunks())));
  let wire = '';
  try {
    while (!wire.includes('event: response.incomplete')) wire += new TextDecoder().decode((await reader.read()).value);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0][1]).toMatchObject(actual);
  } finally {
    upstreamController.close();
    await reader.cancel();
  }
});
it('budget Claude split terminal zero replaces the startup output placeholder without losing cache', async () => {
  const chunks = [
    { type: 'message_start', message: { id: 'msg_offline', usage: { input_tokens: 12, output_tokens: 1, cache_read_input_tokens: 4 } } },
    { type: 'message_delta', delta: { stop_reason: 'max_tokens' }, usage: { output_tokens: 0 } },
    { type: 'message_stop' },
  ];
  const { complete } = await run(chunks, F.CLAUDE, F.OPENAI);
  expect(canonicalizeUsage(complete.mock.calls[0][1])).toMatchObject({ prompt_tokens: 16, completion_tokens: 0, cached_tokens: 4 });
});
it('budget zero usage on final Chat chunk survives EOF in Responses terminal', async () => {
  const { events } = await run([{ choices: [{ delta: { content: 'Partial' }, finish_reason: 'length' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }], F.OPENAI, F.OPENAI_RESPONSES);
  expect(events.find(e => e.type === 'response.incomplete').response.usage).toEqual({ input_tokens: 0, output_tokens: 0, total_tokens: 0 });
});
const chatChunks = (usage = actual) => [
  { choices: [{ delta: { reasoning_content: 'Thinking', content: 'Partial' }, finish_reason: null }] },
  { choices: [{ delta: {}, finish_reason: 'length' }] },
  { choices: [], usage },
];
const actual = { prompt_tokens: 12, completion_tokens: 16, total_tokens: 28, completion_tokens_details: { reasoning_tokens: 16 } };
const nativeUsage = { input_tokens: 12, output_tokens: 16, total_tokens: 28, output_tokens_details: { reasoning_tokens: 16 } };
const output = [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Partial' }] }];
const incomplete = { type: 'response.incomplete', response: { id: 'resp_budget', object: 'response', model: 'offline', status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output, usage: nativeUsage } };
const sse = chunks => chunks.map(c => `${c.type ? `event: ${c.type}\n` : ''}data: ${JSON.stringify(c)}\n\n`).join('');
const upstream = chunks => new Response(sse(chunks), { headers: { 'content-type': 'text/event-stream' } });
const parse = wire => wire.split('\n').filter(l => l.startsWith('data: {')).map(l => JSON.parse(l.slice(6)));
const network = vi.fn(() => { throw new Error('offline-only test'); });
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', network); });
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
async function run(chunks, targetFormat = F.OPENAI_RESPONSES, sourceFormat = targetFormat, mode = 'translate') {
  const complete = vi.fn();
  const wire = await new Response(upstream(chunks).body.pipeThrough(createSSEStream({ mode, targetFormat, sourceFormat, provider: 'offline', model: 'offline', body: {}, onStreamComplete: complete }))).text();
  return { wire, events: parse(wire), complete };
}
it('budget terminal native incomplete survives forced JSON with complete terminal output and usage', async () => {
  const result = await convertResponsesStreamToJson(upstream([incomplete]).body);
  expect(result).toMatchObject(incomplete.response);
});
it('budget terminal native incomplete closes live SSE without a fabricated disconnect and records actual reasoning', async () => {
  const { wire, complete } = await run([incomplete]);
  expect(wire).not.toContain('stream_disconnected');
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][1]).toMatchObject(actual);
  expect(complete.mock.calls[0][3].failed).toBe(false);
});
it('budget terminal native incomplete translates to Chat length with actual usage', async () => {
  const { events } = await run([incomplete], F.OPENAI_RESPONSES, F.OPENAI);
  expect(events.find(e => e.choices?.[0]?.finish_reason)?.choices[0].finish_reason).toBe('length');
  expect(events.find(e => e.usage)?.usage).toMatchObject(actual);
});
it('budget Chat length emits one Responses incomplete after its actual usage trailer', async () => {
  const { events, complete } = await run(chatChunks(), F.OPENAI, F.OPENAI_RESPONSES);
  const terminals = events.filter(e => ['response.completed', 'response.incomplete'].includes(e.type));
  expect(terminals).toHaveLength(1);
  expect(terminals[0]).toMatchObject({ type: 'response.incomplete', response: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, usage: nativeUsage } });
  expect(terminals[0].response.output.some(item => item.content?.[0]?.text === 'Partial')).toBe(true);
  expect(complete.mock.calls[0][1]).toMatchObject(actual);
});
for (const mode of ['passthrough', 'translate']) {
  it(`budget actual trailer replaces estimate without emitting buffered client usage in ${mode}`, async () => {
    const { events, complete } = await run(chatChunks(), F.OPENAI, F.OPENAI, mode);
    expect(complete.mock.calls[0][1]).toMatchObject(actual);
    expect(events.filter(e => e.usage).every(e => e.usage.prompt_tokens === 12 && !e.usage.estimated)).toBe(true);
  });
  it(`budget all-zero actual trailer suppresses estimates in ${mode}`, async () => {
    const zero = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const { complete } = await run(chatChunks(zero), F.OPENAI, F.OPENAI, mode);
    expect(complete.mock.calls[0][1]).toMatchObject(zero);
    expect(complete.mock.calls[0][1].estimated).toBeUndefined();
  });
}
