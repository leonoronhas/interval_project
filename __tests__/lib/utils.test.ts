import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("concatenates plain class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values from clsx", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("applies object syntax from clsx", () => {
    expect(cn({ active: true, hidden: false })).toBe("active");
  });

  it("mixes strings, conditionals, and objects", () => {
    const isActive = true;
    expect(cn("base", isActive && "active", { extra: false })).toBe("base active");
  });

  it("resolves Tailwind conflicts — last class wins", () => {
    // tailwind-merge keeps the last conflicting utility
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("preserves non-conflicting Tailwind utilities", () => {
    expect(cn("flex", "items-center", "p-4")).toBe("flex items-center p-4");
  });

  it("handles an empty call", () => {
    expect(cn()).toBe("");
  });
});
