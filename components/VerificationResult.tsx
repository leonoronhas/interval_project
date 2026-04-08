import { cn } from "@/lib/utils";
import type { Violation } from "@/types";

type Props = {
  verified: boolean | null;
  violations: Violation[];
};

export const VerificationResult = ({ verified, violations }: Props) => (
  <div
    className={cn(
      "rounded-lg border overflow-hidden",
      verified ? "border-accent-mid" : "border-danger-mid"
    )}
  >
    <div
      className={cn(
        "px-4 py-3 flex items-center gap-2",
        verified ? "bg-accent-light" : "bg-danger-light",
        violations.length > 0 && "border-b border-danger-mid"
      )}
    >
      <span
        className={cn(
          "text-[13px] font-semibold",
          verified ? "text-accent" : "text-danger"
        )}
      >
        {verified ? "✓ Verified — No Violations" : "⚠ Violations Detected"}
      </span>
    </div>

    {violations.length > 0 && (
      <div className="px-4 py-4 bg-danger-light">
        <div className="flex flex-col gap-3">
          {violations.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-0.5 items-start"
            >
              <span className="font-mono text-[12px] font-semibold text-danger pt-0.5 row-span-2">
                {v.field}
              </span>
              <span className="text-[12px] text-muted">
                Expected: <strong className="text-accent">{v.expected}</strong>
              </span>
              <span className="text-[12px] text-muted">
                Found: <strong className="text-danger">{v.found}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
