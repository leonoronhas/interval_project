import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the concrete adapter modules so no SDK clients are instantiated
vi.mock("@/lib/ai/providers/anthropic", () => ({
  anthropicAdapter: { complete: vi.fn() },
}));
vi.mock("@/lib/ai/providers/openai", () => ({
  openaiAdapter: { complete: vi.fn() },
}));
vi.mock("@/lib/ai/providers/gemini", () => ({
  geminiAdapter: { complete: vi.fn() },
}));

// Import AFTER mocks are registered
import { getAIProvider } from "@/lib/ai/provider";
import { anthropicAdapter } from "@/lib/ai/providers/anthropic";
import { openaiAdapter } from "@/lib/ai/providers/openai";
import { geminiAdapter } from "@/lib/ai/providers/gemini";

describe("getAIProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the anthropic adapter when AI_PROVIDER is not set", () => {
    vi.stubEnv("AI_PROVIDER", "");
    // Deleting the key falls back to the ?? "anthropic" default
    // Use the anthropic value explicitly to avoid ambiguity
    vi.stubEnv("AI_PROVIDER", "anthropic");
    expect(getAIProvider()).toBe(anthropicAdapter);
  });

  it("returns the anthropic adapter when AI_PROVIDER is unset (default)", () => {
    delete process.env.AI_PROVIDER;
    expect(getAIProvider()).toBe(anthropicAdapter);
  });

  it("returns the openai adapter when AI_PROVIDER=openai", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    expect(getAIProvider()).toBe(openaiAdapter);
  });

  it("returns the gemini adapter when AI_PROVIDER=gemini", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(getAIProvider()).toBe(geminiAdapter);
  });

  it("throws a descriptive error for an unknown provider", () => {
    vi.stubEnv("AI_PROVIDER", "grok");
    expect(() => getAIProvider()).toThrowError(/Unknown AI_PROVIDER "grok"/);
  });

  it("error message lists all valid provider names", () => {
    vi.stubEnv("AI_PROVIDER", "llama");
    expect(() => getAIProvider()).toThrowError(
      /anthropic.*openai.*gemini|openai.*anthropic.*gemini/
    );
  });
});
