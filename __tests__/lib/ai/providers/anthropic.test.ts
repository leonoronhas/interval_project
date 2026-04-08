import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  // Must use a regular function (not arrow) so `new Anthropic()` works
  default: vi.fn(function (this: { messages: { create: typeof mockCreate } }) {
    this.messages = { create: mockCreate };
  }),
}));

import { anthropicAdapter } from "@/lib/ai/providers/anthropic";

const MESSAGES = [{ role: "user" as const, content: "hello" }];

describe("anthropicAdapter.complete", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns the text from a successful response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "AI reply" }],
    });

    const result = await anthropicAdapter.complete("system prompt", MESSAGES);
    expect(result).toBe("AI reply");
  });

  it("returns empty string when the content type is not text", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "image", source: {} }],
    });

    const result = await anthropicAdapter.complete("system", MESSAGES);
    expect(result).toBe("");
  });

  it("forwards the system prompt and messages to the API", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    });

    await anthropicAdapter.complete("my system", MESSAGES);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "my system",
        messages: MESSAGES,
      })
    );
  });

  it("uses the provided maxTokens override", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    });

    await anthropicAdapter.complete("system", MESSAGES, 1500);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 1500 })
    );
  });

  it("defaults to 600 max_tokens when none specified", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
    });

    await anthropicAdapter.complete("system", MESSAGES);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ max_tokens: 600 }));
  });

  it("propagates errors from the API", async () => {
    mockCreate.mockRejectedValue(new Error("API error"));

    await expect(anthropicAdapter.complete("system", MESSAGES)).rejects.toThrow(
      "API error"
    );
  });
});
