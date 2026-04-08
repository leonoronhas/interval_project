import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["app/**", "components/**", "hooks/**", "lib/**"],
      exclude: [
        // Infrastructure that requires live DB / Next.js runtime — test via E2E
        "lib/db/**",
        "lib/supabase/**",
        // Type-only file — no executable statements
        "lib/ai/types.ts",
        // Async Server Components — not supported by Vitest (see Next.js testing docs)
        "app/layout.tsx",
        "app/page.tsx",
        "app/dashboard/**",
        "app/login/**",
        "app/customers/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
