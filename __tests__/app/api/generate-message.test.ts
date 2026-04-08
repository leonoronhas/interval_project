import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Customer } from "@/lib/db/schema";

// --- Mock all external dependencies before importing the route handler ---

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getCustomerById: vi.fn(),
  insertOutreachLog: vi.fn(),
}));

vi.mock("@/lib/ai/groundingEngine", () => ({
  generateGuarded: vi.fn(),
  generateUnguarded: vi.fn(),
}));

// Rate limiter is always open in unit tests — its behaviour is tested separately
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ limited: false })),
}));

import { POST } from "@/app/api/generate-message/route";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById, insertOutreachLog } from "@/lib/db/queries";
import { generateGuarded, generateUnguarded } from "@/lib/ai/groundingEngine";
import { AllProvidersFailedError } from "@/lib/ai/provider";

// ── Helpers ────────────────────────────────────────────────────────────────

const makeRequest = (body: object) =>
  new Request("http://localhost/api/generate-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const mockCustomer: Customer = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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

const mockUser = { id: "11111111-2222-3333-4444-555555555555" };

const mockGenerationResult = {
  text: "Hello Jane, your balance of $250.00 is due.",
  verified: true,
  violations: [],
};

// Clear mock call history between every test so assertions don't bleed across cases
afterEach(() => {
  vi.clearAllMocks();
});

// ── Auth guard ──────────────────────────────────────────────────────────────

describe("POST /api/generate-message — auth", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);
  });

  it("returns 401 when the user is not authenticated", async () => {
    const res = await POST(
      makeRequest({ customerId: "x", type: "email", mode: "guarded" }) as never
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

// ── Input validation ────────────────────────────────────────────────────────

describe("POST /api/generate-message — input validation", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
  });

  it("returns 400 when customerId is missing", async () => {
    const res = await POST(makeRequest({ type: "email", mode: "guarded" }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 when customerId is not a valid UUID", async () => {
    const res = await POST(
      makeRequest({ customerId: "not-a-uuid", type: "email", mode: "guarded" }) as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 when type is an invalid value", async () => {
    const res = await POST(
      makeRequest({ customerId: "cust-uuid", type: "letter", mode: "guarded" }) as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 when mode is an invalid value", async () => {
    const res = await POST(
      makeRequest({ customerId: "cust-uuid", type: "email", mode: "safe" }) as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ this is not json }",
      }) as never
    );
    expect(res.status).toBe(400);
  });
});

// ── Customer lookup ─────────────────────────────────────────────────────────

describe("POST /api/generate-message — customer lookup", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
    vi.mocked(getCustomerById).mockResolvedValue(null as never);
  });

  it("returns 404 when the customer does not exist", async () => {
    const res = await POST(
      makeRequest({
        customerId: "00000000-0000-0000-0000-000000000000",
        type: "email",
        mode: "guarded",
      }) as never
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Customer not found");
  });
});

// ── Generation mode routing ─────────────────────────────────────────────────

describe("POST /api/generate-message — generation modes", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
    vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);
    vi.mocked(insertOutreachLog).mockResolvedValue({
      id: "log-uuid",
      customerId: mockCustomer.id,
      type: "email",
      mode: "guarded",
      generatedText: mockGenerationResult.text,
      verified: true,
      violations: [],
      createdBy: mockUser.id,
      createdAt: new Date(),
    });
    vi.mocked(generateGuarded).mockResolvedValue(mockGenerationResult);
    vi.mocked(generateUnguarded).mockResolvedValue(mockGenerationResult);
  });

  it("calls generateGuarded (not generateUnguarded) when mode='guarded'", async () => {
    await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
      }) as never
    );

    expect(generateGuarded).toHaveBeenCalledOnce();
    expect(generateUnguarded).not.toHaveBeenCalled();
  });

  it("calls generateUnguarded (not generateGuarded) when mode='unguarded'", async () => {
    await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "sms",
        mode: "unguarded",
      }) as never
    );

    expect(generateUnguarded).toHaveBeenCalledOnce();
    expect(generateGuarded).not.toHaveBeenCalled();
  });

  it("passes the correct customer and outreach type to the generator", async () => {
    await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "call_script",
        mode: "guarded",
      }) as never
    );

    expect(generateGuarded).toHaveBeenCalledWith(mockCustomer, "call_script");
  });
});

// ── Persistence ─────────────────────────────────────────────────────────────

describe("POST /api/generate-message — persistence", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
    vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);
    vi.mocked(generateGuarded).mockResolvedValue(mockGenerationResult);
    vi.mocked(insertOutreachLog).mockResolvedValue({
      id: "log-uuid",
      customerId: mockCustomer.id,
      type: "email",
      mode: "guarded",
      generatedText: mockGenerationResult.text,
      verified: true,
      violations: [],
      createdBy: mockUser.id,
      createdAt: new Date(),
    });
  });

  it("calls insertOutreachLog with the generated result and user id", async () => {
    await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
      }) as never
    );

    expect(insertOutreachLog).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
        generatedText: mockGenerationResult.text,
        verified: true,
        violations: [],
        createdBy: mockUser.id,
      })
    );
  });
});

// ── Response shape ──────────────────────────────────────────────────────────

describe("POST /api/generate-message — success response", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
    vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);
    vi.mocked(generateGuarded).mockResolvedValue(mockGenerationResult);
    vi.mocked(insertOutreachLog).mockResolvedValue({
      id: "log-uuid",
      customerId: mockCustomer.id,
      type: "email",
      mode: "guarded",
      generatedText: mockGenerationResult.text,
      verified: true,
      violations: [],
      createdBy: mockUser.id,
      createdAt: new Date(),
    });
  });

  it("returns 200 with text, verified, violations, and logId", async () => {
    const res = await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
      }) as never
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      text: mockGenerationResult.text,
      verified: true,
      violations: [],
      logId: "log-uuid",
    });
  });
});

// ── Provider fallback ────────────────────────────────────────────────────────

describe("POST /api/generate-message — provider fallback", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as never);
    vi.mocked(getCustomerById).mockResolvedValue(mockCustomer);
  });

  it("returns 503 with a user-friendly message when all AI providers fail", async () => {
    vi.mocked(generateGuarded).mockRejectedValue(
      new AllProvidersFailedError([
        { provider: "anthropic", error: new Error("500") },
        { provider: "openai", error: new Error("500") },
        { provider: "gemini", error: new Error("500") },
      ])
    );

    const res = await POST(
      makeRequest({
        customerId: mockCustomer.id,
        type: "email",
        mode: "guarded",
      }) as never
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/unavailable/i);
  });

  it("re-throws non-AllProvidersFailedError errors", async () => {
    vi.mocked(generateGuarded).mockRejectedValue(new TypeError("unexpected bug"));

    await expect(
      POST(
        makeRequest({
          customerId: mockCustomer.id,
          type: "email",
          mode: "guarded",
        }) as never
      )
    ).rejects.toThrow(TypeError);
  });
});
