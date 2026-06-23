import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Data Access Layer (Next 16): enforce auth close to the data, not only in
// proxy.ts. Load-bearing because lib/db/index.ts uses a direct Postgres role
// that bypasses Supabase RLS — the DB itself authorizes nothing. cache() dedupes
// the getUser() round-trip per render pass. No `import "server-only"` needed:
// createClient's next/headers cookies() import already bars client bundling.
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});
