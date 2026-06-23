export const dynamic = "force-dynamic";

import { getAllCustomers, getRecentLogs } from "@/lib/db/queries";
import SignOutButton from "@/components/SignOutButton";
import { CustomerTableRow } from "@/components/CustomerTableRow";
import { ActivityFeed } from "@/components/ActivityFeed";
import { verifySession } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";

const DashboardPage = async () => {
  await verifySession();

  const [customers, recentLogs] = await Promise.all([
    getAllCustomers(),
    getRecentLogs(5),
  ]);

  const totalDue = customers.reduce((sum, c) => sum + Number(c.amountDue), 0);
  const pending = customers.filter((c) => c.status === "pending").length;
  const contacted = customers.filter((c) => c.status === "contacted").length;
  const resolved = customers.filter((c) => c.status === "resolved").length;

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
              {
                value: `$${totalDue.toFixed(2)}`,
                label: "Total Outstanding",
                mono: true,
              },
              { value: pending, label: "Pending" },
              { value: contacted, label: "Contacted" },
              { value: resolved, label: "Resolved" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface border border-border rounded-md px-4 py-3 shadow-xs"
              >
                <div
                  className={cn(
                    "text-[22px] font-semibold text-ink leading-tight mb-0.5",
                    s.mono && "font-mono"
                  )}
                >
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
                  {[
                    "Account ID",
                    "Name",
                    "Plan",
                    "Amount Due",
                    "Due Date",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <CustomerTableRow key={c.id} customer={c} />
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

          <ActivityFeed logs={recentLogs} />
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
