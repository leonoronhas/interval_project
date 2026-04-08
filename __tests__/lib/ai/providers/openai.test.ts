import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  // Must use a regular function (not arrow) so `new OpenAI()` works
  default: vi.fn(function (this: {
    chat: { completions: { create: typeof mockCreate } };
  }) {
    this.chat = { completions: { create: mockCreate } };
  }),
}));

import { openaiAdapter } from "@/lib/ai/providers/openai";

const MESSAGES = [{ role: "user" as const, content: "hello" }];

describe("openaiAdapter.complete", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns the message content from a successful response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "OpenAI reply" } }],
    });

    const result = await openaiAdapter.complete("system prompt", MESSAGES);
    expect(result).toBe("OpenAI reply");
  });

  it("returns empty string when choices array is empty", async () => {
    mockCreate.mockResolvedValue({ choices: [] });

    const result = await openaiAdapter.complete("system", MESSAGES);
    expect(result).toBe("");
  });

  it("returns empty string when message content is null", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await openaiAdapter.complete("system", MESSAGES);
    expect(result).toBe("");
  });

  it("prepends the system message to the messages array", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    });

    await openaiAdapter.complete("my system", MESSAGES);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: "system", content: "my system" },
          { role: "user", content: "hello" },
        ]),
      })
    );
  });

  it("uses the provided maxTokens override", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    });

    await openaiAdapter.complete("system", MESSAGES, 1200);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 1200 })
    );
  });

  it("defaults to 600 max_tokens when none specified", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    });

    await openaiAdapter.complete("system", MESSAGES);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 600 }));
  });

  it("propagates errors from the API", async () => {
    mockCreate.mockRejectedValue(new Error("OpenAI down"));

    await expect(openaiAdapter.complete("system", MESSAGES)).rejects.toThrow(
      "OpenAI down"
    );
  });
});
