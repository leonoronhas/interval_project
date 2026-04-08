import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIAdapter, AIMessage } from "../types";

let _client: GoogleGenerativeAI | null = null;

const getClient = () => {
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return _client;
};

const isRetryable = (err: unknown): boolean => {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    return status === 503 || status === 429;
  }
  if (err instanceof Error) {
    return /503|429|overload|unavailable|quota/i.test(err.message);
  }
  return false;
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxAttempts - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastErr;
};

export const geminiAdapter: AIAdapter = {
  complete: async (system, messages: AIMessage[], maxTokens = 600) => {
    const model = getClient().getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: system,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await withRetry(() => chat.sendMessage(lastMessage));
    return result.response.text();
  },
};
