"use client";

import Link from "next/link";
import { typeLabels, modeBadge, verifiedBadge } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { VerificationResult } from "@/components/VerificationResult";
import ViolationHighlighter from "@/components/ViolationHighlighter";
import type { Violation } from "@/types";

// The fields the detail view needs — satisfied structurally by both OutreachLog
// (customer page history) and RecentLog (dashboard activity feed).
export type DetailLog = {
  id: string;
  type: "email" | "sms" | "call_script";
  mode: "guarded" | "unguarded";
  generatedText: string;
  verified: boolean | null;
  violations: Violation[] | null;
  createdAt: Date | null;
};

type Props = {
  log: DetailLog | null;
  onClose: () => void;
  // Feeds that know the customer (activity feed) surface the name in the header
  // and a link in the footer; the customer page already shows both, so it omits them.
  customerName?: string | null;
  customerHref?: string | null;
};

export const OutreachLogDetail = ({
  log,
  onClose,
  customerName,
  customerHref,
}: Props) => {
  const violations = log?.violations ?? [];

  return (
    <Modal open={log !== null} onClose={onClose}>
      {log && (
        <>
          <ModalHeader onClose={onClose}>
            {customerName ? (
              <>
                <span className="font-serif text-[17px] text-ink">{customerName}</span>
                <span className="text-[13px] text-muted">
                  {typeLabels[log.type] ?? log.type}
                </span>
              </>
            ) : (
              <span className="font-serif text-[17px] text-ink capitalize">
                {typeLabels[log.type] ?? log.type}
              </span>
            )}
            <Badge {...modeBadge(log.mode)} />
            <Badge {...verifiedBadge(log.verified)} />
          </ModalHeader>

          <ModalBody>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2 bg-canvas border-b border-border">
                <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                  Generated {typeLabels[log.type] ?? log.type}
                </span>
              </div>
              <div className="px-4 py-3 bg-surface max-h-[320px] overflow-y-auto">
                <ViolationHighlighter text={log.generatedText} violations={violations} />
              </div>
            </div>

            <VerificationResult verified={log.verified} violations={violations} />

            <div className="flex items-center justify-between text-[11px] font-mono text-faint">
              <div className="flex items-center gap-4">
                <span>ID: {log.id}</span>
                {log.createdAt && <span>{new Date(log.createdAt).toLocaleString()}</span>}
              </div>
              {customerHref && (
                <Link
                  href={customerHref}
                  onClick={onClose}
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
  );
};
