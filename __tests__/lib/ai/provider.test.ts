import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/providers/anthropic", () => ({
  anthropicAdapter: { complete: vi.fn() },
}));
vi.mock("@/lib/ai/providers/openai", () => ({
  openaiAdapter: { complete: vi.fn() },
}));
vi.mock("@/lib/ai/providers/gemini", () => ({
  geminiAdapter: { complete: vi.fn() },
}));

import { getAIProvider, AllProvidersFailedError } from "@/lib/ai/provider";
import { anthropicAdapter } from "@/lib/ai/providers/anthropic";
import { openaiAdapter } from "@/lib/ai/providers/openai";
import { geminiAdapter } from "@/lib/ai/providers/gemini";

const MESSAGES = [{ role: "user" as const, content: "prompt" }];

describe("getAIProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(anthropicAdapter.complete).mockReset();
    vi.mocked(openaiAdapter.complete).mockReset();
    vi.mocked(geminiAdapter.complete).mockReset();
  });

  it("throws a descriptive error for an unknown provider", () => {
    vi.stubEnv("AI_PROVIDER", "grok");
    expect(() => getAIProvider()).toThrowError(/Unknown AI_PROVIDER "grok"/);
  });

  it("error message lists all valid provider names", () => {
    vi.stubEnv("AI_PROVIDER", "llama");
    expect(() => getAIProvider()).toThrowError(/anthropic.*openai.*gemini/);
  });

  it("calls the primary provider (anthropic by default) when it succeeds", async () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.mocked(anthropicAdapter.complete).mockResolvedValue("anthropic response");

    const result = await getAIProvider().complete("system", MESSAGES);

    expect(result).toBe("anthropic response");
    expect(anthropicAdapter.complete).toHaveBeenCalledOnce();
    expect(openaiAdapter.complete).not.toHaveBeenCalled();
    expect(geminiAdapter.complete).not.toHaveBeenCalled();
  });

  it("uses the configured primary provider first", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.mocked(openaiAdapter.complete).mockResolvedValue("openai first");

    await getAIProvider().complete("system", MESSAGES);

    expect(openaiAdapter.complete).toHaveBeenCalledOnce();
    expect(anthropicAdapter.complete).not.toHaveBeenCalled();
  });

  it("falls back to the next provider when the primary fails", async () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.mocked(anthropicAdapter.complete).mockRejectedValue(new Error("Anthropic down"));
    vi.mocked(openaiAdapter.complete).mockResolvedValue("openai fallback");

    const result = await getAIProvider().complete("system", MESSAGES);

    expect(result).toBe("openai fallback");
    expect(anthropicAdapter.complete).toHaveBeenCalledOnce();
    expect(openaiAdapter.complete).toHaveBeenCalledOnce();
  });

  it("tries all providers before giving up", async () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.mocked(anthropicAdapter.complete).mockRejectedValue(new Error("Anthropic down"));
    vi.mocked(openaiAdapter.complete).mockRejectedValue(new Error("OpenAI down"));
    vi.mocked(geminiAdapter.complete).mockResolvedValue("gemini fallback");

    const result = await getAIProvider().complete("system", MESSAGES);

    expect(result).toBe("gemini fallback");
    expect(anthropicAdapter.complete).toHaveBeenCalledOnce();
    expect(openaiAdapter.complete).toHaveBeenCalledOnce();
    expect(geminiAdapter.complete).toHaveBeenCalledOnce();
  });

  it("throws AllProvidersFailedError when every provider fails", async () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.mocked(anthropicAdapter.complete).mockRejectedValue(new Error("Anthropic down"));
    vi.mocked(openaiAdapter.complete).mockRejectedValue(new Error("OpenAI down"));
    vi.mocked(geminiAdapter.complete).mockRejectedValue(new Error("Gemini down"));

    await expect(getAIProvider().complete("system", MESSAGES)).rejects.toThrow(
      AllProvidersFailedError
    );
  });

  it("AllProvidersFailedError captures each provider's failure reason", async () => {
    vi.stubEnv("AI_PROVIDER", "anthropic");
    const anthropicErr = new Error("Anthropic 500");
    const openaiErr = new Error("OpenAI 500");
    const geminiErr = new Error("Gemini 500");
    vi.mocked(anthropicAdapter.complete).mockRejectedValue(anthropicErr);
    vi.mocked(openaiAdapter.complete).mockRejectedValue(openaiErr);
    vi.mocked(geminiAdapter.complete).mockRejectedValue(geminiErr);

    try {
      await getAIProvider().complete("system", MESSAGES);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AllProvidersFailedError);
      const { causes } = err as AllProvidersFailedError;
      expect(causes).toHaveLength(3);
      expect(causes[0]).toEqual({ provider: "anthropic", error: anthropicErr });
      expect(causes[1].provider).toMatch(/openai|gemini/);
      expect(causes[2].provider).toMatch(/openai|gemini/);
    }
  });
});
