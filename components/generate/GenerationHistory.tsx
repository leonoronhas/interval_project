import { cn } from "@/lib/utils";
import { typeLabels } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { VerificationResult } from "@/components/VerificationResult";
import ViolationHighlighter from "@/components/ViolationHighlighter";
import type { OutreachLog } from "@/lib/db/schema";
import type { Violation } from "@/types";
import { useState } from "react";

type Props = {
  logs: OutreachLog[];
};

export const GenerationHistory = ({ logs }: Props) => {
  const [selectedLog, setSelectedLog] = useState<OutreachLog | null>(null);

  if (logs.length === 0) {
    return null;
  }

  const violations = (selectedLog?.violations as Violation[]) ?? [];

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
                  <Badge
                    label={log.mode}
                    variant={log.mode === "guarded" ? "accent" : "danger"}
                  />
                </td>
                <td className="px-3 py-2">
                  <Badge
                    label={log.verified ? "Clean" : "Violations"}
                    variant={(log.verified ?? false) ? "accent" : "danger"}
                  />
                </td>
                <td className="px-3 py-2 text-[11px] font-mono text-muted">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={selectedLog !== null} onClose={() => setSelectedLog(null)}>
        {selectedLog && (
          <>
            <ModalHeader onClose={() => setSelectedLog(null)}>
              <span className="font-serif text-[17px] text-ink capitalize">
                {typeLabels[selectedLog.type]}
              </span>
              <Badge
                label={selectedLog.mode}
                variant={selectedLog.mode === "guarded" ? "accent" : "danger"}
              />
              <Badge
                label={selectedLog.verified ? "Clean" : "Violations"}
                variant={(selectedLog.verified ?? false) ? "accent" : "danger"}
              />
            </ModalHeader>

            <ModalBody>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2 bg-canvas border-b border-border">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                    Generated {typeLabels[selectedLog.type]}
                  </span>
                </div>
                <div className="px-4 py-3 bg-surface max-h-[320px] overflow-y-auto">
                  <ViolationHighlighter
                    text={selectedLog.generatedText}
                    violations={violations}
                  />
                </div>
              </div>

              <VerificationResult
                verified={selectedLog.verified}
                violations={violations}
              />

              <div className="flex items-center gap-4 text-[11px] font-mono text-faint">
                <span>ID: {selectedLog.id}</span>
                {selectedLog.createdAt && (
                  <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </>
  );
};
