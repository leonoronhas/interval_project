import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIAdapter, AIMessage } from "../types";

let _client: GoogleGenerativeAI | null = null;
const getClient = () => {
  if (!_client) _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return _client;
};

export const geminiAdapter: AIAdapter = {
  complete: async (system, messages: AIMessage[], maxTokens = 600) => {
    const model = getClient().getGenerativeModel({
      model: "gemini-2.5-pro-preview-03-25",
      systemInstruction: system,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  },
};
