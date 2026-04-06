import { getAIProvider } from "./provider";
import type { Customer } from "@/lib/db/schema";
import type { Violation } from "@/types";

const verifyFacts = async (generatedText: string, customer: Customer) => {
  const ai = getAIProvider();

  const system = `You are a compliance auditor. Your only job is to detect factual errors in AI-generated messages. Respond only with valid JSON.`;

  const prompt = `Check this generated message for factual errors against the ground truth.

GROUND TRUTH:
- Full Name: ${customer.fullName}
- Plan: ${customer.plan}
- Amount Due: $${Number(customer.amountDue).toFixed(2)}
- Due Date: ${customer.dueDate}
- Account ID: ${customer.accountId}

GENERATED MESSAGE:
"""
${generatedText}
"""

Return ONLY valid JSON, no markdown, no explanation:
{ "violations": [{ "field": "string", "expected": "string", "found": "string" }] }

If no violations: { "violations": [] }`;

  try {
    const raw = await ai.complete(system, [{ role: "user", content: prompt }], 400);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const violations: Violation[] = parsed.violations ?? [];
    return { violations, verified: violations.length === 0 };
  } catch {
    return { violations: [], verified: true };
  }
};

export const generateGuarded = async (customer: Customer, type: string) => {
  const ai = getAIProvider();

  const system = `You are a professional collections agent for Interval AI.

CRITICAL RULES:
1. Use ONLY the verified data provided below. Do NOT invent, approximate, or infer any values.
2. Every number, name, date, and plan if applicable MUST match the record exactly.
3. If unsure of a value, omit it rather than guess.
4. Tone: professional, empathetic, non-threatening.

━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED CUSTOMER RECORD
━━━━━━━━━━━━━━━━━━━━━━━━
Account ID : ${customer.accountId}
Full Name  : ${customer.fullName}
Email      : ${customer.email}
Phone      : ${customer.phone ?? "not provided"}
Plan       : ${customer.plan}
Amount Due : $${Number(customer.amountDue).toFixed(2)}
Due Date   : ${customer.dueDate}
Status     : ${customer.status}
━━━━━━━━━━━━━━━━━━━━━━━━`;

  const text = await ai.complete(system, [
    { role: "user", content: `Generate the ${type} now.` },
  ]);

  const { violations, verified } = await verifyFacts(text, customer);
  return { text, violations, verified };
};

export const generateUnguarded = async (customer: Customer, type: string) => {
  const ai = getAIProvider();

  const system = `You are a collections agent. Generate a ${type} for a customer with an overdue balance. Be specific with amounts and plan details.`;

  const text = await ai.complete(system, [
    {
      role: "user",
      content: `Customer name: ${customer.fullName}. They have an overdue account. Write the ${type}.`,
    },
  ]);

  const { violations, verified } = await verifyFacts(text, customer);
  return { text, violations, verified };
};
