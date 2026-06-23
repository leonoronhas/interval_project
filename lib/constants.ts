export const typeLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  call_script: "Call Script",
};

export const statusStyles: Record<string, string> = {
  pending: "bg-warn-light text-warn border border-warn-mid",
  contacted: "bg-accent-light text-accent border border-accent-mid",
  resolved: "bg-gray-100 text-gray-600 border border-gray-200",
};

export const statusLabel: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  resolved: "Resolved",
};

// Domain → Badge mappings. One place for the rule "guarded/verified is accent,
// unguarded/unverified is danger" so it stops drifting across render sites.
// Spread into <Badge>: `<Badge {...modeBadge(log.mode)} />`.
export const modeBadge = (mode: "guarded" | "unguarded") =>
  ({ label: mode, variant: mode === "guarded" ? "accent" : "danger" }) as const;

export const verifiedBadge = (verified: boolean | null) =>
  ({
    label: verified ? "Clean" : "Violations",
    variant: verified ? "accent" : "danger",
  }) as const;
