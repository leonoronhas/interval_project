import { cn } from "@/lib/utils";
import { typeLabels } from "@/lib/constants";

type OutreachType = "email" | "sms" | "call_script";
type OutreachMode = "guarded" | "unguarded";

type Props = {
  type: OutreachType;
  mode: OutreachMode;
  loading: boolean;
  onTypeChange: (type: OutreachType) => void;
  onModeChange: (mode: OutreachMode) => void;
  onGenerate: () => void;
};

const segBase =
  "px-3.5 py-1.5 border-r last:border-r-0 border-border text-[13px] cursor-pointer text-muted hover:bg-border-muted hover:text-ink transition-all";

export const OutreachControls = ({
  type,
  mode,
  loading,
  onTypeChange,
  onModeChange,
  onGenerate,
}: Props) => (
  <div className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
        Message Type
      </label>
      <div className="flex border border-border rounded-md overflow-hidden">
        {(["email", "sms", "call_script"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={cn(
              segBase,
              type === t && "bg-ink text-canvas cursor-default capitalize"
            )}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
        Mode
      </label>
      <div className="flex border border-border rounded-md overflow-hidden">
        <button
          onClick={() => onModeChange("guarded")}
          className={cn(segBase, mode === "guarded" && "bg-accent text-white")}
        >
          Guarded
        </button>
        <button
          onClick={() => onModeChange("unguarded")}
          className={cn(segBase, mode === "unguarded" && "bg-danger text-white")}
        >
          Unguarded
        </button>
      </div>
    </div>

    <button
      onClick={onGenerate}
      disabled={loading}
      className={cn(
        "self-end px-5 py-2 rounded-md text-[14px] font-medium cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-85",
        mode === "guarded" ? "bg-accent" : "bg-danger"
      )}
    >
      {loading ? "Generating…" : `Generate ${typeLabels[type]}`}
    </button>
  </div>
);
