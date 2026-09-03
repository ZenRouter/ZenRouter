import { describe, it, expect, beforeEach } from "vitest";
import { addCustomModel, getCustomModels, deleteCustomModel } from "@/lib/db/repos/aliasRepo.js";
import { GET as getModels } from "@/app/api/models/route.js";
import { POST as postCustomModel, DELETE as deleteCustomApi } from "@/app/api/models/custom/route.js";

describe("Custom Model Capabilities & Upsert (#3752)", () => {
  const providerAlias = "test-oai-prov";
  const modelId = `test-model-${Date.now()}`;

  beforeEach(async () => {
    await deleteCustomModel({ providerAlias, id: modelId, type: "llm" });
  });

  it("adds a custom model with vision and reasoning capabilities and upserts cleanly", async () => {
    // 1. Initial creation with vision=true, reasoning=false
    const addedFirst = await addCustomModel({
      providerAlias,
      id: modelId,
      type: "llm",
      name: "Test Custom Model",
      caps: { vision: true, reasoning: false },
    });
    expect(addedFirst).toBe(true);

    let allCustom = await getCustomModels();
    let found = allCustom.find((m) => m.providerAlias === providerAlias && m.id === modelId);
    expect(found).toBeDefined();
    expect(found.caps).toEqual({ vision: true, reasoning: false });

    // 2. Upsert: re-adding with updated capabilities reasoning=true updates in-place
    const addedSecond = await addCustomModel({
      providerAlias,
      id: modelId,
      type: "llm",
      caps: { reasoning: true },
    });
    expect(addedSecond).toBe(true);

    allCustom = await getCustomModels();
    const matching = allCustom.filter((m) => m.providerAlias === providerAlias && m.id === modelId);
    expect(matching.length).toBe(1);
    expect(matching[0].caps.reasoning).toBe(true);
    expect(matching[0].caps.vision).toBe(true); // preserved

    // Cleanup
    await deleteCustomModel({ providerAlias, id: modelId, type: "llm" });
  });

  it("POST /api/models/custom sanitizes caps to booleans and upserts", async () => {
    const fakeRequest = {
      json: async () => ({
        providerAlias,
        id: modelId,
        type: "llm",
        caps: { vision: true, reasoning: "not-a-bool", invalidProp: 123 },
      }),
    };

    const res = await postCustomModel(fakeRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const allCustom = await getCustomModels();
    const found = allCustom.find((m) => m.providerAlias === providerAlias && m.id === modelId);
    expect(found).toBeDefined();
    // Only valid boolean keys from CAPACITY_META should be retained
    expect(found.caps).toEqual({ vision: true });
    expect(found.caps.invalidProp).toBeUndefined();

    // Cleanup
    await deleteCustomModel({ providerAlias, id: modelId, type: "llm" });
  });

  it("GET /api/models includes custom models with their custom caps", async () => {
    await addCustomModel({
      providerAlias,
      id: modelId,
      type: "llm",
      name: "My Custom Vision Model",
      caps: { vision: true, reasoning: true },
    });

    const res = await getModels();
    expect(res.status).toBe(200);
    const { models } = await res.json();

    const entry = models.find((m) => m.fullModel === `${providerAlias}/${modelId}`);
    expect(entry).toBeDefined();
    expect(entry.caps.vision).toBe(true);
    expect(entry.caps.reasoning).toBe(true);

    // Cleanup
    await deleteCustomModel({ providerAlias, id: modelId, type: "llm" });
  });
});
