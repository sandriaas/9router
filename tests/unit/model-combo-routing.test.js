import { beforeEach, describe, expect, it, vi } from "vitest";

const localDbMocks = vi.hoisted(() => ({
  getComboByName: vi.fn(),
  getModelAliases: vi.fn(async () => ({})),
  getProviderNodes: vi.fn(async () => []),
}));

vi.mock("@/lib/localDb", () => localDbMocks);

const { getComboModels, getModelInfo } = await import("@/sse/services/model.js");

describe("combo model routing", () => {
  beforeEach(() => {
    localDbMocks.getComboByName.mockReset();
    localDbMocks.getComboByName.mockImplementation(async name =>
      name === "gpt-5.2"
        ? { name, models: ["cx/gpt-5.4-mini"] }
        : null
    );
  });

  it("keeps gpt-5.2 on the combo path instead of inferring OpenAI", async () => {
    await expect(getModelInfo("gpt-5.2")).resolves.toEqual({
      provider: null,
      model: "gpt-5.2",
    });
    await expect(getComboModels("gpt-5.2")).resolves.toEqual([
      "cx/gpt-5.4-mini",
    ]);
  });

  it("recognizes a provider-qualified combo name", async () => {
    await expect(getModelInfo("openai/gpt-5.2")).resolves.toEqual({
      provider: null,
      model: "gpt-5.2",
    });
    await expect(getComboModels("openai/gpt-5.2")).resolves.toEqual([
      "cx/gpt-5.4-mini",
    ]);
  });
});
