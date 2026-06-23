import { Badge } from "@/components/ui/Badge";
import { modeBadge, verifiedBadge } from "@/lib/constants";
import { OutreachLogDetail } from "@/components/OutreachLogDetail";
import type { OutreachLog } from "@/lib/db/schema";
import { useState } from "react";

type Props = {
  logs: OutreachLog[];
};

export const GenerationHistory = ({ logs }: Props) => {
  const [selectedLog, setSelectedLog] = useState<OutreachLog | null>(null);

  if (logs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="pt-5 border-t border-border-muted">
        <h4 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-muted mb-3">
          Generation History
        </h4>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-border">
              {["Type", "Mode", "Result", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="border-b border-border-muted last:border-b-0 cursor-pointer hover:bg-canvas transition-colors"
              >
                <td className="px-3 py-2 text-[12px] font-mono text-ink">
                  {log.type.replace("_", " ")}
                </td>
                <td className="px-3 py-2">
                  <Badge {...modeBadge(log.mode)} />
                </td>
                <td className="px-3 py-2">
                  <Badge {...verifiedBadge(log.verified)} />
                </td>
                <td className="px-3 py-2 text-[11px] font-mono text-muted">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OutreachLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};
