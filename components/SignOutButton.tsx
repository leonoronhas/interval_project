"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3.5 py-1.5 bg-transparent text-muted border border-border rounded-md text-[13px] cursor-pointer hover:bg-border-muted hover:text-ink transition-all"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
