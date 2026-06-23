export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById, getLogsByCustomerId } from "@/lib/db/queries";
import GeneratePanel from "@/components/GeneratePanel";
import SignOutButton from "@/components/SignOutButton";
import { verifySession } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { statusStyles, statusLabel } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string }>;
};

const CustomerPage = async ({ params }: Props) => {
  await verifySession();

  const { id } = await params;

  const [customer, logs] = await Promise.all([
    getCustomerById(id),
    getLogsByCustomerId(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-ink rounded text-canvas font-serif text-[13px] flex items-center justify-center tracking-wide">
            IG
          </div>
          <Link
            href="/dashboard"
            className="text-[13px] text-muted hover:text-ink transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
        <SignOutButton />
      </header>

      <main className="flex-1 px-6 py-6 max-w-[900px] w-full mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-[26px] font-normal text-ink leading-tight">
                {customer.fullName}
              </h2>
              <p className="text-[13px] font-mono text-muted mt-0.5">
                {customer.accountId}
              </p>
            </div>
            <span
              className={cn(
                "inline-block px-3.5 py-1.5 rounded-full text-[13px] font-medium",
                statusStyles[customer.status]
              )}
            >
              {statusLabel[customer.status]}
            </span>
          </div>

          <div className="bg-surface border border-border border-l-4 border-l-accent rounded-xl px-6 py-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span className="text-[14px] font-semibold text-accent">
                Verified Ground Truth
              </span>
              <span className="ml-auto text-[11px] font-mono text-faint">
                source: Supabase → Drizzle
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3.5">
              {[
                { label: "Full Name", value: customer.fullName },
                { label: "Email", value: customer.email, mono: true },
                { label: "Phone", value: customer.phone ?? "—", mono: true },
                { label: "Plan", value: customer.plan },
                {
                  label: "Amount Due",
                  value: formatMoney(customer.amountDue),
                  mono: true,
                  highlight: true,
                },
                { label: "Due Date", value: customer.dueDate, mono: true },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                    {f.label}
                  </span>
                  <span
                    className={cn(
                      "text-[14px] text-ink",
                      f.mono && "font-mono",
                      f.highlight && "font-medium"
                    )}
                  >
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <GeneratePanel customer={customer} logs={logs} />
        </div>
      </main>
    </div>
  );
};

export default CustomerPage;
