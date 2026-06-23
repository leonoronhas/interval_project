import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external deps before importing the DAL.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// Next's redirect() throws to halt rendering — model that so we can assert the
// guard actually stops execution rather than falling through to `return user`.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Neutralize React's cache() (request-scoped memoization) so each call runs
// fresh and tests don't bleed a memoized result into one another.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T>(fn: T) => fn };
});

import { verifySession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const mockUser = { id: "11111111-2222-3333-4444-555555555555" };

const mockAuth = (user: unknown) =>
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifySession (Data Access Layer)", () => {
  it("redirects to /login and halts when there is no authenticated user", async () => {
    mockAuth(null);
    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the user and does not redirect when authenticated", async () => {
    mockAuth(mockUser);
    await expect(verifySession()).resolves.toEqual(mockUser);
    expect(redirect).not.toHaveBeenCalled();
  });
});
