import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSendMessage = vi.hoisted(() => vi.fn());
const mockStartChat = vi.hoisted(() =>
  vi.fn().mockReturnValue({ sendMessage: mockSendMessage })
);
const mockGetGenerativeModel = vi.hoisted(() =>
  vi.fn().mockReturnValue({ startChat: mockStartChat })
);

vi.mock("@google/generative-ai", () => ({
  // Must use a regular function (not arrow) so `new GoogleGenerativeAI()` works
  GoogleGenerativeAI: vi.fn(function (this: {
    getGenerativeModel: typeof mockGetGenerativeModel;
  }) {
    this.getGenerativeModel = mockGetGenerativeModel;
  }),
}));

import { geminiAdapter } from "@/lib/ai/providers/gemini";

const MESSAGES = [{ role: "user" as const, content: "hello" }];
const MULTI_MESSAGES = [
  { role: "user" as const, content: "first" },
  { role: "assistant" as const, content: "reply" },
  { role: "user" as const, content: "follow-up" },
];

describe("geminiAdapter.complete — happy path", () => {
  beforeEach(() => {
    mockSendMessage.mockReset();
    mockStartChat.mockReset().mockReturnValue({ sendMessage: mockSendMessage });
    mockGetGenerativeModel.mockReset().mockReturnValue({ startChat: mockStartChat });
  });

  it("returns the response text on success", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "Gemini reply" },
    });

    const result = await geminiAdapter.complete("system", MESSAGES);
    expect(result).toBe("Gemini reply");
  });

  it("passes system instruction to getGenerativeModel", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "ok" },
    });

    await geminiAdapter.complete("my system", MESSAGES);

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ systemInstruction: "my system" })
    );
  });

  it("uses the provided maxTokens", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "ok" },
    });

    await geminiAdapter.complete("system", MESSAGES, 1000);

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: { maxOutputTokens: 1000 },
      })
    );
  });

  it("sends the last message as the active message", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "ok" },
    });

    await geminiAdapter.complete("system", MULTI_MESSAGES);

    expect(mockSendMessage).toHaveBeenCalledWith("follow-up");
  });

  it("builds history from all messages except the last", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "ok" },
    });

    await geminiAdapter.complete("system", MULTI_MESSAGES);

    expect(mockStartChat).toHaveBeenCalledWith({
      history: [
        { role: "user", parts: [{ text: "first" }] },
        { role: "model", parts: [{ text: "reply" }] },
      ],
    });
  });

  it("maps assistant role to 'model' in history", async () => {
    mockSendMessage.mockResolvedValue({
      response: { text: () => "ok" },
    });

    await geminiAdapter.complete("system", MULTI_MESSAGES);

    const call = mockStartChat.mock.calls[0][0];
    expect(call.history[1].role).toBe("model");
  });
});

describe("geminiAdapter.complete — retry logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSendMessage.mockReset();
    mockStartChat.mockReset().mockReturnValue({ sendMessage: mockSendMessage });
    mockGetGenerativeModel.mockReset().mockReturnValue({ startChat: mockStartChat });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on a 503 status error and succeeds", async () => {
    mockSendMessage
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue({ response: { text: () => "recovered" } });

    const promise = geminiAdapter.complete("system", MESSAGES);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("recovered");
    expect(mockSendMessage).toHaveBeenCalledTimes(2);
  });

  it("retries on a 429 status error and succeeds", async () => {
    mockSendMessage
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue({ response: { text: () => "ok after 429" } });

    const promise = geminiAdapter.complete("system", MESSAGES);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("ok after 429");
  });

  it("retries on an Error with 'overloaded' message", async () => {
    mockSendMessage
      .mockRejectedValueOnce(new Error("model overloaded"))
      .mockResolvedValue({ response: { text: () => "ok" } });

    const promise = geminiAdapter.complete("system", MESSAGES);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("ok");
  });

  it("retries on an Error with 'quota' message", async () => {
    mockSendMessage
      .mockRejectedValueOnce(new Error("quota exceeded"))
      .mockResolvedValue({ response: { text: () => "ok" } });

    const promise = geminiAdapter.complete("system", MESSAGES);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("ok");
  });

  it("retries on an Error with 'unavailable' message", async () => {
    mockSendMessage
      .mockRejectedValueOnce(new Error("service unavailable"))
      .mockResolvedValue({ response: { text: () => "ok" } });

    const promise = geminiAdapter.complete("system", MESSAGES);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
  });

  it("does not retry on a non-retryable error", async () => {
    mockSendMessage.mockRejectedValue({ status: 400 });

    await expect(geminiAdapter.complete("system", MESSAGES)).rejects.toEqual({
      status: 400,
    });
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting all 3 retry attempts", async () => {
    mockSendMessage.mockRejectedValue({ status: 503 });

    // Attach a handler immediately so Node does not fire unhandledRejection
    // while fake-timer advancement is in progress.
    let thrownError: unknown;
    const settled = geminiAdapter.complete("system", MESSAGES).catch((e) => {
      thrownError = e;
    });

    await vi.runAllTimersAsync();
    await settled;

    expect(thrownError).toEqual({ status: 503 });
    expect(mockSendMessage).toHaveBeenCalledTimes(3);
  });

  it("does not retry for an unknown non-Error object", async () => {
    mockSendMessage.mockRejectedValue("plain string error");

    await expect(geminiAdapter.complete("system", MESSAGES)).rejects.toBe(
      "plain string error"
    );
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
