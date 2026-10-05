import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const babel = require("next/dist/compiled/babel/core");
const filename = fileURLToPath(new URL("../../src/shared/components/PricingModal.js", import.meta.url));
const code = babel.transformSync(readFileSync(filename, "utf8"), {
  filename, babelrc: false, configFile: false,
  presets: [[require("next/dist/compiled/babel/preset-react"), { runtime: "automatic" }]],
  plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs")],
}).code;

// Execute the actual component, including loading effects and rendered event
// callbacks. Only React scheduling, network, and imported catalog data are seams.
function fixture(data, metadata = {}, { fallback = false } = {}) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], (value) => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
    },
    useEffect(effect, deps) {
      const slot = cursor++;
      if (!slots[slot] || deps.some((dep, index) => !Object.is(dep, slots[slot][index]))) {
        slots[slot] = deps;
        effects.push(effect);
      }
    },
  };
  const fetch = vi.fn(async (_url, options) => ({ ok: !!options || !fallback, json: async () => data }));
  const props = { isOpen: true, onClose: vi.fn(), onSave: vi.fn() };
  const jsx = (type, props) => ({ type, props: props || {} });
  const fixtureModule = { exports: {} };
  vm.runInNewContext(code, {
    module: fixtureModule, exports: fixtureModule.exports, fetch, console,
    confirm: () => true, alert: vi.fn(),
    require(id) {
      if (id === "react") return hooks;
      if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (id === "open-sse/providers/pricing.js") return { getDefaultPricing: () => data };
      if (id === "open-sse/providers/metadata/reviewed.js") return { getReviewedModelMetadata: (provider, model) => metadata[provider]?.[model] ?? null };
      throw new Error(`Unexpected fixture import: ${id}`);
    },
  }, { filename });
  const render = () => {
    cursor = 0;
    const tree = fixtureModule.exports.default(props);
    effects.splice(0).forEach((effect) => effect());
    return tree;
  };
  return {
    fetch, props, render,
    async mount() { render(); await new Promise(setImmediate); return render(); },
    async save() { await nodes(render()).find((node) => node.type === "button" && text(node) === "Save Changes").props.onClick(); },
    payload() { return JSON.parse(fetch.mock.calls.find(([, options]) => options?.method === "PATCH")[1].body); },
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (tree == null || typeof tree === "boolean") return "";
  return typeof tree === "object" ? text(tree.props?.children) : String(tree);
}
function fields(tree, model) {
  const row = nodes(tree).find((node) => node.type === "tr" && text(node).includes(model));
  return nodes(row).filter((node) => node.type === "input");
}

const sample = () => ({ fixture: { "known-model": { input: 1.5, output: 6, cached: 0 } } });

describe("PricingModal reviewed billing behavior", () => {
  it.each([
    ["time-dependent-payg", "per_1000000_tokens", "Off-peak tariff only; peak prices differ."],
    ["plan", "subscription", "Subscription access is not a per-token debit."],
    ["media", "per_second", "Video billed per second, not per token."],
    ["estimate", "per_image", "Image estimate varies with resolution."],
  ])("discloses %s scope, native units and provenance without putting metadata in PATCH", async (kind, unit, note) => {
    const data = { ...sample(), custom: { "unreviewed-model": { input: 3 } } };
    const source = "https://example.com/official-pricing";
    const modal = fixture(data, { fixture: { "known-model": { billing: { kind, unit, currency: "USD", note, rates: { native: 0.1 } }, sources: [source] } } });
    const tree = await modal.mount();
    expect(text(tree)).toMatch(/USD per million tokens/);
    expect(text(tree)).toMatch(/estimates.*not.*upstream invoice/i);
    expect(text(tree)).toMatch(/subscriptions.*media units.*not equivalent/i);
    const row = nodes(tree).find((node) => node.type === "tr" && text(node).includes("known-model"));
    expect(text(row)).toContain(kind.replaceAll("_", " "));
    expect(text(row)).toContain(unit.replaceAll("_", " "));
    expect(text(row)).toContain(note);
    const link = nodes(row).find((node) => node.type === "a" && node.props.href === source);
    expect(link).toBeTruthy();
    expect(text(link)).toMatch(/source/i);
    expect(text(tree)).toMatch(/billing scope unverified/i);
    await modal.save();
    expect(modal.payload()).toEqual(data);
  });
  it.each([false, true])("edits immutable fetched/default rows and omits cleared tariffs without fabricating zero (fallback=%s)", async (fallback) => {
    const data = sample();
    const original = structuredClone(data);
    const modal = fixture(data, {}, { fallback });
    let tree = await modal.mount();
    fields(tree, "known-model")[0].props.onChange({ target: { value: "2.75" } });
    tree = modal.render();
    expect(fields(tree, "known-model")[0].props.value).toBe(2.75);
    expect(data).toEqual(original);
    fields(tree, "known-model")[4].props.onChange({ target: { value: "0" } });
    tree = modal.render();
    expect(fields(tree, "known-model")[4].props.value).toBe(0);
    fields(tree, "known-model")[0].props.onChange({ target: { value: "" } });
    tree = modal.render();
    expect(fields(tree, "known-model")[0].props.value).toBe("");
    fields(tree, "known-model")[1].props.onChange({ target: { value: "-1" } });
    fields(tree, "known-model")[1].props.onChange({ target: { value: "Infinity" } });
    await modal.save();
    expect(modal.payload()).toEqual({ fixture: { "known-model": { output: 6, cached: 0, cache_creation: 0 } } });
    expect(data).toEqual(original);
  });
  it("renders unspecified tariffs as blank with accessible labels and preserves absent fields on save", async () => {
    const data = sample();
    const modal = fixture(data);
    const tree = await modal.mount();
    const inputs = fields(tree, "known-model");
    expect(inputs.map((input) => input.props.value)).toEqual([1.5, 6, 0, "", ""]);
    for (const input of inputs) {
      expect(input.props.placeholder).toBe("Not specified");
      const label = nodes(tree).find((node) => node.type === "label" && (node.props.htmlFor === input.props.id && input.props.id || nodes(node).includes(input)));
      expect(text(label)).toContain("known-model");
      expect(text(label)).toMatch(/input|output|cached|reasoning|cache creation/i);
      expect(nodes(tree).some((node) => node.props.id === input.props["aria-describedby"])).toBe(true);
    }
    await modal.save();
    expect(modal.payload()).toEqual(data);
    expect(modal.payload().fixture["known-model"]).not.toHaveProperty("cache_creation");
    expect(modal.props.onSave).toHaveBeenCalledOnce();
    expect(modal.props.onClose).toHaveBeenCalledOnce();
  });
});
