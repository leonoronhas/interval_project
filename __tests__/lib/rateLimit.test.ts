import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Reset module between groups so bucket state doesn't bleed across tests
// Each describe block that needs isolation imports a fresh module.

describe("checkRateLimit — basic allow/deny logic", () => {
  let checkRateLimit: (key: string) => import("@/lib/rateLimit").RateLimitResult;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    ({ checkRateLimit } = await import("@/lib/rateLimit"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a new key", () => {
    const result = checkRateLimit("user-new");
    expect(result.limited).toBe(false);
  });

  it("allows up to 10 requests within the same window", () => {
    const key = "user-10";
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key).limited).toBe(false);
    }
  });

  it("blocks the 11th request within the same window", () => {
    const key = "user-11";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.limited).toBe(true);
  });

  it("returns a positive retryAfterMs when limited", () => {
    const key = "user-retry";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.limited).toBe(true);
    if (result.limited) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    }
  });

  it("different keys have independent buckets", () => {
    const keyA = "user-a";
    const keyB = "user-b";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(keyA);
    }
    expect(checkRateLimit(keyA).limited).toBe(true);
    expect(checkRateLimit(keyB).limited).toBe(false);
  });

  it("resets the window after 60 seconds have elapsed", () => {
    const key = "user-window";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key).limited).toBe(true);

    vi.advanceTimersByTime(60_001);

    const result = checkRateLimit(key);
    expect(result.limited).toBe(false);
  });

  it("increments the counter on each allowed request", () => {
    const key = "user-count";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key).limited).toBe(false);
    }
    // Still within limit
    expect(checkRateLimit(key).limited).toBe(false);
  });

  it("retryAfterMs decreases as the window progresses", () => {
    const key = "user-decay";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }

    const resultEarly = checkRateLimit(key);
    vi.advanceTimersByTime(10_000);
    const resultLater = checkRateLimit(key);

    expect(resultEarly.limited).toBe(true);
    expect(resultLater.limited).toBe(true);
    if (resultEarly.limited && resultLater.limited) {
      expect(resultLater.retryAfterMs).toBeLessThan(resultEarly.retryAfterMs);
    }
  });
});
