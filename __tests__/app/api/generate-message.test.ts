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

import { POST } from "@/app/api/generate-message/route";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById, insertOutreachLog } from "@/lib/db/queries";
import { generateGuarded, generateUnguarded } from "@/lib/ai/groundingEngine";

// ── Helpers ────────────────────────────────────────────────────────────────

const makeRequest = (body: object) =>
  new Request("http://localhost/api/generate-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const mockCustomer: Customer = {
  id: "cust-uuid",
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

const mockUser = { id: "user-uuid-1" };

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
      makeRequest({ customerId: "missing-id", type: "email", mode: "guarded" }) as never
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
