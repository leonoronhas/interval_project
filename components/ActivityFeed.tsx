"use client";

import { useState } from "react";
import Link from "next/link";
import { typeLabels } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { VerificationResult } from "@/components/VerificationResult";
import ViolationHighlighter from "@/components/ViolationHighlighter";
import type { RecentLog } from "@/lib/db/queries";
import type { Violation } from "@/types";

export const ActivityFeed = ({ logs }: { logs: RecentLog[] }) => {
  const [selected, setSelected] = useState<RecentLog | null>(null);

  if (logs.length === 0) {
    return <p className="text-[13px] text-faint">No outreach generated yet.</p>;
  }

  const violations = (selected?.violations as Violation[]) ?? [];

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
              <Badge
                label={log.verified ? "Clean" : "Violations"}
                variant={log.verified ? "accent" : "danger"}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                label={log.mode}
                variant={log.mode === "guarded" ? "accent" : "danger"}
              />
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

      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <ModalHeader onClose={() => setSelected(null)}>
              <span className="font-serif text-[17px] text-ink">
                {selected.customerName}
              </span>
              <span className="text-[13px] text-muted">
                {typeLabels[selected.type] ?? selected.type}
              </span>
              <Badge
                label={selected.mode}
                variant={selected.mode === "guarded" ? "accent" : "danger"}
              />
              <Badge
                label={selected.verified ? "Clean" : "Violations"}
                variant={selected.verified ? "accent" : "danger"}
              />
            </ModalHeader>

            <ModalBody>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2 bg-canvas border-b border-border">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                    Generated {typeLabels[selected.type] ?? selected.type}
                  </span>
                </div>
                <div className="px-4 py-3 bg-surface max-h-[320px] overflow-y-auto">
                  <ViolationHighlighter
                    text={selected.generatedText}
                    violations={violations}
                  />
                </div>
              </div>

              <VerificationResult verified={selected.verified} violations={violations} />

              <div className="flex items-center justify-between text-[11px] font-mono text-faint">
                <div className="flex items-center gap-4">
                  <span>ID: {selected.id}</span>
                  {selected.createdAt && (
                    <span>{new Date(selected.createdAt).toLocaleString()}</span>
                  )}
                </div>
                {selected.customerId && (
                  <Link
                    href={`/customers/${selected.customerId}`}
                    onClick={() => setSelected(null)}
                    className="text-accent hover:opacity-70 transition-opacity text-[12px] font-sans font-medium"
                  >
                    View customer →
                  </Link>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </>
  );
};
