"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { modeBadge, verifiedBadge } from "@/lib/constants";
import { OutreachLogDetail } from "@/components/OutreachLogDetail";
import type { RecentLog } from "@/lib/db/queries";

export const ActivityFeed = ({ logs }: { logs: RecentLog[] }) => {
  const [selected, setSelected] = useState<RecentLog | null>(null);

  if (logs.length === 0) {
    return <p className="text-[13px] text-faint">No outreach generated yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {logs.map((log) => (
          <li
            key={log.id}
            onClick={() => setSelected(log)}
            className="bg-surface border border-border rounded-md px-3 py-2.5 cursor-pointer hover:bg-canvas transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-ink">{log.customerName}</span>
              <Badge {...verifiedBadge(log.verified)} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge {...modeBadge(log.mode)} />
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

      <OutreachLogDetail
        log={selected}
        onClose={() => setSelected(null)}
        customerName={selected?.customerName}
        customerHref={selected?.customerId ? `/customers/${selected.customerId}` : null}
      />
    </>
  );
};
