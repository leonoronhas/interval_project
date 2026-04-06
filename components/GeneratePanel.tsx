"use client";

import { useState } from "react";
import axios from "axios";
import type { Customer, OutreachLog } from "@/lib/db/schema";
import type { Violation } from "@/types";
import ViolationHighlighter from "./ViolationHighlighter";

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

const typeLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  call_script: "Call Script",
};

const modeStyle = {
  guarded: {
    seg: "data-[active=true]:bg-accent data-[active=true]:text-white",
    btn: "bg-accent hover:opacity-85 text-white",
  },
  unguarded: {
    seg: "data-[active=true]:bg-danger data-[active=true]:text-white",
    btn: "bg-danger hover:opacity-85 text-white",
  },
};

const GeneratePanel = ({ customer, logs }: Props) => {
  const [type, setType] = useState<"email" | "sms" | "call_script">("email");
  const [mode, setMode] = useState<"guarded" | "unguarded">("guarded");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

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
      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const segBase =
    "px-3.5 py-1.5 border-r last:border-r-0 border-border text-[13px] cursor-pointer text-muted hover:bg-border-muted hover:text-ink transition-all";

  return (
    <div className="bg-surface border border-border rounded-xl px-6 py-6 shadow-xs flex flex-col gap-5">
      <h3 className="font-serif text-[19px] font-normal text-ink">Generate Outreach</h3>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Type toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
            Message Type
          </label>
          <div className="flex border border-border rounded-md overflow-hidden">
            {(["email", "sms", "call_script"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`${segBase} ${type === t ? "bg-ink text-canvas" : ""}`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
            Mode
          </label>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setMode("guarded")}
              className={`${segBase} ${mode === "guarded" ? "bg-accent! text-white!" : ""}`}
            >
              Guarded
            </button>
            <button
              onClick={() => setMode("unguarded")}
              className={`${segBase} ${mode === "unguarded" ? "bg-danger! text-white!" : ""}`}
            >
              Unguarded
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading}
          className={`self-end px-5 py-2 rounded-md text-[14px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${modeStyle[mode].btn}`}
        >
          {loading ? "Generating…" : `Generate ${typeLabels[type]}`}
        </button>
      </div>

      {/* Unguarded warning */}
      {mode === "unguarded" && (
        <div className="px-3.5 py-2.5 bg-danger-light border border-danger-mid rounded-md text-[13px] text-danger">
          Unguarded mode — AI generates without verified context. Violations expected.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-3.5 py-2.5 bg-danger-light border border-danger-mid rounded-md text-[13px] text-danger">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-xl border overflow-hidden ${result.verified ? "border-accent-mid" : "border-danger-mid"}`}
        >
          {/* Result header */}
          <div
            className={`px-4 py-3 border-b flex items-center gap-2.5 ${result.verified ? "bg-accent-light border-accent-mid" : "bg-danger-light border-danger-mid"}`}
          >
            <span
              className={`text-[13px] font-semibold ${result.verified ? "text-accent" : "text-danger"}`}
            >
              {result.verified ? "✓ Verified — No Violations" : "⚠ Violations Detected"}
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${mode === "guarded" ? "bg-accent-light text-accent border border-accent-mid" : "bg-danger-light text-danger border border-danger-mid"}`}
            >
              {mode}
            </span>
          </div>

          {/* Generated text */}
          <div className="px-4 py-4 bg-surface">
            <ViolationHighlighter text={result.text} violations={result.violations} />
          </div>

          {/* Violations breakdown */}
          {result.violations.length > 0 && (
            <div className="px-4 py-4 bg-danger-light border-t border-danger-mid">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.5px] text-danger mb-3">
                Detected Violations
              </h4>
              <div className="flex flex-col gap-2">
                {result.violations.map((v, i) => (
                  <div key={i} className="flex items-baseline gap-3 text-[13px]">
                    <span className="font-mono text-[12px] font-medium text-danger min-w-[100px]">
                      {v.field}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] text-accent">
                        Expected: <strong>{v.expected}</strong>
                      </span>
                      <span className="text-[12px] text-danger">
                        Found: <strong>{v.found}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
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
                <tr key={log.id} className="border-b border-border-muted last:border-b-0">
                  <td className="px-3 py-2 text-[12px] font-mono text-ink">
                    {log.type.replace("_", " ")}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium ${log.mode === "guarded" ? "bg-accent-light text-accent border border-accent-mid" : "bg-danger-light text-danger border border-danger-mid"}`}
                    >
                      {log.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium ${log.verified ? "bg-accent-light text-accent border border-accent-mid" : "bg-danger-light text-danger border border-danger-mid"}`}
                    >
                      {log.verified ? "Clean" : "Violations"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] font-mono text-muted">
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GeneratePanel;
