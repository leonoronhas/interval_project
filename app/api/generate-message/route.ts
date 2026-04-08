import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById, insertOutreachLog } from "@/lib/db/queries";
import { generateGuarded, generateUnguarded } from "@/lib/ai/groundingEngine";

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId, type, mode } = await request.json();

  const customer = await getCustomerById(customerId);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const result =
    mode === "guarded"
      ? await generateGuarded(customer, type)
      : await generateUnguarded(customer, type);

  const log = await insertOutreachLog({
    customerId,
    type,
    mode,
    generatedText: result.text,
    verified: result.verified,
    violations: result.violations,
    createdBy: user.id,
  });

  return NextResponse.json({
    text: result.text,
    verified: result.verified,
    violations: result.violations,
    logId: log?.id ?? null,
  });
};
