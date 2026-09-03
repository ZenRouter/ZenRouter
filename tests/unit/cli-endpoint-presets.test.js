import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readPresets,
  upsertPreset,
  deletePreset,
  readKeyPresets,
  upsertKeyPreset,
  deleteKeyPreset,
  rememberEndpoint,
} from "@/app/(dashboard)/dashboard/cli-tools/components/cliEndpointPresets";

describe("cliEndpointPresets store", () => {
  let store = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("endpoints store", () => {
    it("upserts and reads an endpoint preset", () => {
      upsertPreset("http://custom-host:8080/", "My Custom Node");
      const presets = readPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]).toEqual({
        name: "My Custom Node",
        baseUrl: "http://custom-host:8080",
      });
    });

    it("deletes an endpoint preset by name", () => {
      upsertPreset("http://node-1:8080", "Node 1");
      upsertPreset("http://node-2:8080", "Node 2");
      deletePreset("Node 1");
      const presets = readPresets();
      expect(presets.map(p => p.name)).toEqual(["Node 2"]);
    });

    it("does not remember built-in endpoints", () => {
      const stored = rememberEndpoint("http://127.0.0.1:20128/v1");
      expect(stored).toBeNull();
      expect(readPresets()).toHaveLength(0);
    });
  });

  describe("apiKeys store", () => {
    it("upserts and reads an API key preset", () => {
      upsertKeyPreset("sk-custom-secret-key", "Prod Key");
      const presets = readKeyPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]).toEqual({
        name: "Prod Key",
        key: "sk-custom-secret-key",
      });
    });

    it("deletes an API key preset by name", () => {
      upsertKeyPreset("sk-key-1", "Key 1");
      upsertKeyPreset("sk-key-2", "Key 2");
      deleteKeyPreset("Key 1");
      const presets = readKeyPresets();
      expect(presets.map(p => p.name)).toEqual(["Key 2"]);
    });
  });
});
