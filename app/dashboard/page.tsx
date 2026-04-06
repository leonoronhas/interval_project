export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllCustomers, getRecentLogs } from "@/lib/db/queries";
import SignOutButton from "@/components/SignOutButton";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending:   "bg-warn-light text-warn border border-warn-mid",
  contacted: "bg-accent-light text-accent border border-accent-mid",
  resolved:  "bg-gray-100 text-gray-600 border border-gray-200",
};

const statusLabel: Record<string, string> = {
  pending:   "Pending",
  contacted: "Contacted",
  resolved:  "Resolved",
};

const modeBadgeCn = (mode: string) =>
  cn(
    "inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium",
    mode === "guarded"
      ? "bg-accent-light text-accent border border-accent-mid"
      : "bg-danger-light text-danger border border-danger-mid"
  );

const verifiedBadgeCn = (verified: boolean | null) =>
  cn(
    "inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium",
    verified
      ? "bg-accent-light text-accent border border-accent-mid"
      : "bg-danger-light text-danger border border-danger-mid"
  );

const DashboardPage = async () => {
  const [customers, recentLogs] = await Promise.all([
    getAllCustomers(),
    getRecentLogs(5),
  ]);

  const totalDue  = customers.reduce((sum, c) => sum + Number(c.amountDue), 0);
  const pending   = customers.filter((c) => c.status === "pending").length;
  const contacted = customers.filter((c) => c.status === "contacted").length;
  const resolved  = customers.filter((c) => c.status === "resolved").length;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Topbar */}
      <header className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-ink rounded text-canvas font-serif text-[13px] flex items-center justify-center tracking-wide">
            IG
          </div>
          <span className="font-serif text-[18px] text-ink">Interval Guard</span>
        </div>
        <SignOutButton />
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-[1fr_280px] gap-6 p-6 max-w-[1280px] w-full mx-auto">

        {/* Left: main content */}
        <div className="min-w-0">
          <h2 className="font-serif text-[22px] font-normal text-ink mb-4">
            Customer Accounts
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { value: `$${totalDue.toFixed(2)}`, label: "Total Outstanding", mono: true },
              { value: pending,   label: "Pending" },
              { value: contacted, label: "Contacted" },
              { value: resolved,  label: "Resolved" },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-md px-4 py-3 shadow-xs">
                <div className={cn("text-[22px] font-semibold text-ink leading-tight mb-0.5", s.mono && "font-mono")}>
                  {s.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.5px] text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border">
                  {["Account ID", "Name", "Plan", "Amount Due", "Due Date", "Status", ""].map((h) => (
                    <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border-muted last:border-b-0 hover:bg-[#faf9f6] transition-colors">
                    <td className="px-3.5 py-3 text-[13px] font-mono text-muted">{c.accountId}</td>
                    <td className="px-3.5 py-3 text-[13px] font-medium text-ink">{c.fullName}</td>
                    <td className="px-3.5 py-3 text-[13px] text-ink">{c.plan}</td>
                    <td className="px-3.5 py-3 text-[13px] font-mono font-medium text-ink">
                      ${Number(c.amountDue).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 text-[13px] font-mono text-ink">{c.dueDate}</td>
                    <td className="px-3.5 py-3">
                      <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium", statusStyles[c.status])}>
                        {statusLabel[c.status]}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <Link href={`/customers/${c.id}`} className="text-[13px] font-medium text-accent hover:opacity-70 transition-opacity">
                        Generate →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: sidebar */}
        <aside className="min-w-0">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.6px] text-muted mb-3">
            Recent Activity
          </h3>

          {recentLogs.length === 0 ? (
            <p className="text-[13px] text-faint">No outreach generated yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recentLogs.map((log) => (
                <li key={log.id} className="bg-surface border border-border rounded-md px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-ink">{log.customerName}</span>
                    <span className={verifiedBadgeCn(log.verified)}>
                      {log.verified ? "Clean" : "Violations"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={modeBadgeCn(log.mode)}>{log.mode}</span>
                    <span className="text-[11px] font-mono text-muted">
                      {log.type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-faint ml-auto">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
