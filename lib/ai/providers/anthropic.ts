import Anthropic from "@anthropic-ai/sdk";
import type { AIAdapter } from "../types";

let _client: Anthropic | null = null;

const getClient = () => {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
};

export const anthropicAdapter: AIAdapter = {
  complete: async (system, messages, maxTokens = 600) => {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  },
};
