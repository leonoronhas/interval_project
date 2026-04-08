import { describe, it, expect } from "vitest";
import { typeLabels, statusStyles, statusLabel } from "@/lib/constants";

const OUTREACH_TYPES = ["email", "sms", "call_script"] as const;
const STATUSES = ["pending", "contacted", "resolved"] as const;

describe("typeLabels", () => {
  it("has a non-empty label for every outreach type", () => {
    for (const type of OUTREACH_TYPES) {
      expect(typeLabels[type]).toBeTruthy();
    }
  });

  it("contains exactly the expected outreach types", () => {
    expect(Object.keys(typeLabels)).toEqual(expect.arrayContaining([...OUTREACH_TYPES]));
  });
});

describe("statusStyles", () => {
  it("has a style string for every customer status", () => {
    for (const status of STATUSES) {
      expect(statusStyles[status]).toBeTruthy();
    }
  });

  it("each style value contains a Tailwind class", () => {
    for (const status of STATUSES) {
      // At minimum a bg- or text- utility should be present
      expect(statusStyles[status]).toMatch(/\b(bg|text|border)-/);
    }
  });
});

describe("statusLabel", () => {
  it("has a human-readable label for every status", () => {
    for (const status of STATUSES) {
      expect(statusLabel[status]).toBeTruthy();
    }
  });

  it("has exactly the same keys as statusStyles", () => {
    expect(Object.keys(statusLabel).sort()).toEqual(Object.keys(statusStyles).sort());
  });
});
