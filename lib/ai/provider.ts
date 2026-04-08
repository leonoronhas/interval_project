import type { AIAdapter, AIMessage } from "./types";
import { anthropicAdapter } from "./providers/anthropic";
import { openaiAdapter } from "./providers/openai";
import { geminiAdapter } from "./providers/gemini";

const ALL_ADAPTERS: Record<string, AIAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  gemini: geminiAdapter,
};

export class AllProvidersFailedError extends Error {
  constructor(public readonly causes: Array<{ provider: string; error: unknown }>) {
    super("All AI providers failed");
    this.name = "AllProvidersFailedError";
  }
}

const buildFallbackChain = (
  primary: string
): Array<{ name: string; adapter: AIAdapter }> => {
  const fallbacks = Object.entries(ALL_ADAPTERS)
    .filter(([name]) => name !== primary)
    .map(([name, adapter]) => ({ name, adapter }));
  return [{ name: primary, adapter: ALL_ADAPTERS[primary] }, ...fallbacks];
};

export const getAIProvider = (): AIAdapter => {
  const primary = process.env.AI_PROVIDER ?? "gemini";

  if (!ALL_ADAPTERS[primary]) {
    throw new Error(
      `Unknown AI_PROVIDER "${primary}". Must be "anthropic", "openai", or "gemini".`
    );
  }

  const chain = buildFallbackChain(primary);

  return {
    complete: async (
      system: string,
      messages: AIMessage[],
      maxTokens?: number
    ): Promise<string> => {
      const causes: Array<{ provider: string; error: unknown }> = [];

      for (const { name, adapter } of chain) {
        try {
          return await adapter.complete(system, messages, maxTokens);
        } catch (err) {
          causes.push({ provider: name, error: err });
        }
      }

      throw new AllProvidersFailedError(causes);
    },
  };
};
