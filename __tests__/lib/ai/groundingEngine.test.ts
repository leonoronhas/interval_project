import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Customer } from "@/lib/db/schema";
import type { AIMessage } from "@/lib/ai/types";

// Mock the provider so no real AI calls are made
vi.mock("@/lib/ai/provider", () => ({
  getAIProvider: vi.fn(),
}));

import { generateGuarded, generateUnguarded } from "@/lib/ai/groundingEngine";
import { getAIProvider } from "@/lib/ai/provider";

const mockCustomer: Customer = {
  id: "uuid-1",
  accountId: "ACC-001",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  plan: "Premium Plus",
  amountDue: "250.00",
  dueDate: "2026-04-15",
  status: "pending",
  createdAt: new Date("2026-01-01"),
};

const noViolationsJson = JSON.stringify({ violations: [] });
const withViolationsJson = JSON.stringify({
  violations: [{ field: "amountDue", expected: "$250.00", found: "$350.00" }],
});

describe("generateGuarded", () => {
  let mockComplete: ReturnType<
    typeof vi.fn<
      (system: string, messages: AIMessage[], maxTokens?: number) => Promise<string>
    >
  >;

  beforeEach(() => {
    mockComplete =
      vi.fn<
        (system: string, messages: AIMessage[], maxTokens?: number) => Promise<string>
      >();
    vi.mocked(getAIProvider).mockReturnValue({ complete: mockComplete });
  });

  it("returns the generated text from the AI response", async () => {
    mockComplete
      .mockResolvedValueOnce("Dear Jane, your balance of $250.00 is due.")
      .mockResolvedValueOnce(noViolationsJson);

    const result = await generateGuarded(mockCustomer, "email");

    expect(result.text).toBe("Dear Jane, your balance of $250.00 is due.");
  });

  it("sets verified:true and empty violations when none are found", async () => {
    mockComplete
      .mockResolvedValueOnce("Clean generated text.")
      .mockResolvedValueOnce(noViolationsJson);

    const result = await generateGuarded(mockCustomer, "email");

    expect(result.verified).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("sets verified:false and returns violations when the AI flags errors", async () => {
    mockComplete
      .mockResolvedValueOnce("Your balance is $350.00 due on April 15.")
      .mockResolvedValueOnce(withViolationsJson);

    const result = await generateGuarded(mockCustomer, "email");

    expect(result.verified).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].field).toBe("amountDue");
    expect(result.violations[0].expected).toBe("$250.00");
    expect(result.violations[0].found).toBe("$350.00");
  });

  it("embeds the customer's accountId in the system prompt", async () => {
    mockComplete.mockResolvedValueOnce("text").mockResolvedValueOnce(noViolationsJson);

    await generateGuarded(mockCustomer, "email");

    const systemPrompt = mockComplete.mock.calls[0][0] as string;
    expect(systemPrompt).toContain("ACC-001");
  });

  it("embeds the customer's full name in the system prompt", async () => {
    mockComplete.mockResolvedValueOnce("text").mockResolvedValueOnce(noViolationsJson);

    await generateGuarded(mockCustomer, "email");

    const systemPrompt = mockComplete.mock.calls[0][0] as string;
    expect(systemPrompt).toContain("Jane Doe");
  });

  it("embeds the amount due in the system prompt", async () => {
    mockComplete.mockResolvedValueOnce("text").mockResolvedValueOnce(noViolationsJson);

    await generateGuarded(mockCustomer, "email");

    const systemPrompt = mockComplete.mock.calls[0][0] as string;
    expect(systemPrompt).toContain("250.00");
  });

  it("calls complete exactly twice — once to generate, once to verify", async () => {
    mockComplete
      .mockResolvedValueOnce("Generated content.")
      .mockResolvedValueOnce(noViolationsJson);

    await generateGuarded(mockCustomer, "sms");

    expect(mockComplete).toHaveBeenCalledTimes(2);
  });

  it("passes the outreach type to the generation prompt", async () => {
    mockComplete
      .mockResolvedValueOnce("call script content")
      .mockResolvedValueOnce(noViolationsJson);

    await generateGuarded(mockCustomer, "call_script");

    const generationMessages = mockComplete.mock.calls[0][1] as Array<{
      role: string;
      content: string;
    }>;
    expect(generationMessages[0].content).toContain("call_script");
  });

  it("falls back to verified:true when the verify response is unparseable JSON", async () => {
    mockComplete
      .mockResolvedValueOnce("Some text.")
      .mockResolvedValueOnce("not valid json at all!!!");

    const result = await generateGuarded(mockCustomer, "email");

    expect(result.verified).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("handles markdown-wrapped JSON from the verify call", async () => {
    const markdownJson = "```json\n" + withViolationsJson + "\n```";
    mockComplete.mockResolvedValueOnce("Some text.").mockResolvedValueOnce(markdownJson);

    const result = await generateGuarded(mockCustomer, "email");

    expect(result.violations).toHaveLength(1);
  });
});

describe("generateUnguarded", () => {
  let mockComplete: ReturnType<
    typeof vi.fn<
      (system: string, messages: AIMessage[], maxTokens?: number) => Promise<string>
    >
  >;

  beforeEach(() => {
    mockComplete =
      vi.fn<
        (system: string, messages: AIMessage[], maxTokens?: number) => Promise<string>
      >();
    vi.mocked(getAIProvider).mockReturnValue({ complete: mockComplete });
  });

  it("returns the generated text", async () => {
    mockComplete
      .mockResolvedValueOnce("Unguarded generated content.")
      .mockResolvedValueOnce(noViolationsJson);

    const result = await generateUnguarded(mockCustomer, "email");

    expect(result.text).toBe("Unguarded generated content.");
  });

  it("still runs verification and returns violations", async () => {
    mockComplete
      .mockResolvedValueOnce("Wrong amount $999.00")
      .mockResolvedValueOnce(withViolationsJson);

    const result = await generateUnguarded(mockCustomer, "email");

    expect(result.verified).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it("does NOT embed the full structured customer record in the system prompt", async () => {
    mockComplete.mockResolvedValueOnce("text").mockResolvedValueOnce(noViolationsJson);

    await generateUnguarded(mockCustomer, "email");

    const systemPrompt = mockComplete.mock.calls[0][0] as string;
    // The guarded mode uses a labelled block; unguarded uses a loose prompt
    expect(systemPrompt).not.toContain("VERIFIED CUSTOMER RECORD");
    expect(systemPrompt).not.toContain("Account ID");
  });

  it("includes only the customer name in the user message prompt", async () => {
    mockComplete.mockResolvedValueOnce("text").mockResolvedValueOnce(noViolationsJson);

    await generateUnguarded(mockCustomer, "email");

    const userMessage = mockComplete.mock.calls[0][1] as Array<{
      role: string;
      content: string;
    }>;
    expect(userMessage[0].content).toContain("Jane Doe");
  });
});
