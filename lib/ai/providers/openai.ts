import OpenAI from "openai";
import type { AIAdapter, AIMessage } from "../types";

let _client: OpenAI | null = null;

const getClient = () => {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

export const openaiAdapter: AIAdapter = {
  complete: async (system, messages: AIMessage[], maxTokens = 600) => {
    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
    });
    return response.choices[0]?.message?.content ?? "";
  },
};
