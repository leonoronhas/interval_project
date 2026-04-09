"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { typeLabels } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { VerificationResult } from "@/components/VerificationResult";
import ViolationHighlighter from "@/components/ViolationHighlighter";
import { OutreachControls } from "@/components/generate/OutreachControls";
import { GenerationHistory } from "@/components/generate/GenerationHistory";
import { cn } from "@/lib/utils";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import type { Customer, OutreachLog } from "@/lib/db/schema";
import type { Violation } from "@/types";

type Props = {
  customer: Customer;
  logs: OutreachLog[];
};

type Result = {
  text: string;
  verified: boolean;
  violations: Violation[];
  logId: string | null;
};

type OutreachType = "email" | "sms" | "call_script";
type OutreachMode = "guarded" | "unguarded";

const GeneratePanel = ({ customer, logs }: Props) => {
  const router = useRouter();
  const [type, setType] = useState<OutreachType>("email");
  const [mode, setMode] = useState<OutreachMode>("guarded");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const { progress, progressLabel, completeProgress, resetProgress } =
    useGenerationProgress(loading);

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await axios.post<Result>("/api/generate-message", {
        customerId: customer.id,
        type,
        mode,
      });
      completeProgress();
      setResult(data);
      router.refresh();
    } catch (err) {
      resetProgress();
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "An unexpected error occurred.")
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (next: OutreachType) => {
    setType(next);
    setResult(null);
    setError("");
  };

  if (customer.status === "resolved") {
    return (
      <div className="bg-surface border border-border rounded-xl px-6 py-6 shadow-xs flex flex-col gap-5">
        <h3 className="font-serif text-[19px] font-normal text-ink">Generate Outreach</h3>
        <p className="text-[14px] text-muted">
          This issue is resolved. No further action is required.
        </p>
        <GenerationHistory logs={logs} />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl px-6 py-6 shadow-xs flex flex-col gap-5">
      <h3 className="font-serif text-[19px] font-normal text-ink">Generate Outreach</h3>

      <OutreachControls
        type={type}
        mode={mode}
        loading={loading}
        onTypeChange={handleTypeChange}
        onModeChange={setMode}
        onGenerate={generate}
      />

      {loading && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">{progressLabel}</span>
            <span className="text-[12px] font-mono font-medium text-ink">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-200 ease-out",
                mode === "guarded" ? "bg-accent" : "bg-danger"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {mode === "unguarded" && (
        <div className="px-3.5 py-2.5 bg-danger-light border border-danger-mid rounded-md text-[13px] text-danger">
          Unguarded mode — AI generates without verified context. Violations expected.
        </div>
      )}

      {error && (
        <div className="px-3.5 py-2.5 bg-danger-light border border-danger-mid rounded-md text-[13px] text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-canvas border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                Generated {typeLabels[type]}
              </span>
              <Badge label={mode} variant={mode === "guarded" ? "accent" : "danger"} />
            </div>
            <div className="px-5 py-4 bg-surface">
              <ViolationHighlighter text={result.text} violations={result.violations} />
            </div>
          </div>

          <VerificationResult verified={result.verified} violations={result.violations} />
        </div>
      )}

      <GenerationHistory logs={logs} />
    </div>
  );
};

export default GeneratePanel;
