import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats a numeric string to $X.XX", () => {
    expect(formatMoney("250")).toBe("$250.00");
  });

  it("formats a number to $X.XX", () => {
    expect(formatMoney(1234.5)).toBe("$1234.50");
  });

  it("rounds to two decimals", () => {
    expect(formatMoney("19.999")).toBe("$20.00");
    expect(formatMoney(0.1 + 0.2)).toBe("$0.30");
  });

  it("handles zero", () => {
    expect(formatMoney("0")).toBe("$0.00");
  });
});
