import type { AIAdapter } from "./types";
import { anthropicAdapter } from "./providers/anthropic";
import { openaiAdapter } from "./providers/openai";
import { geminiAdapter } from "./providers/gemini";

const adapters: Record<string, AIAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  gemini: geminiAdapter,
};

export const getAIProvider = (): AIAdapter => {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  const adapter = adapters[provider];

  if (!adapter) {
    throw new Error(
      `Unknown AI_PROVIDER "${provider}". Must be "anthropic", "openai", or "gemini".`
    );
  }

  return adapter;
};
