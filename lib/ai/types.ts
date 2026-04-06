export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AIAdapter = {
  complete: (
    system: string,
    messages: AIMessage[],
    maxTokens?: number
  ) => Promise<string>;
};
