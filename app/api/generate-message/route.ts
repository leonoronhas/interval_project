import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById, insertOutreachLog } from "@/lib/db/queries";
import { generateGuarded, generateUnguarded } from "@/lib/ai/groundingEngine";
import { AllProvidersFailedError } from "@/lib/ai/provider";
import { outreachLog } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";

const GenerateRequestSchema = z.object({
  customerId: z.string().uuid({ message: "customerId must be a valid UUID" }),
  type: z.enum(outreachLog.type.enumValues),
  mode: z.enum(outreachLog.mode.enumValues),
});

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(user.id);
  if (rateLimit.limited) {
    const retryAfterSeconds = Math.ceil(rateLimit.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId, type, mode } = parsed.data;

  const customer = await getCustomerById(customerId);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let result: Awaited<ReturnType<typeof generateGuarded>>;
  try {
    result =
      mode === "guarded"
        ? await generateGuarded(customer, type)
        : await generateUnguarded(customer, type);
  } catch (err) {
    if (err instanceof AllProvidersFailedError) {
      return NextResponse.json(
        { error: "All AI providers are currently unavailable. Please try again later." },
        { status: 503 }
      );
    }
    throw err;
  }

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
    ...(result.verificationError && { verificationError: true }),
  });
};
