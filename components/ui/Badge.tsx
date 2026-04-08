import { cn } from "@/lib/utils";

export type BadgeVariant = "accent" | "danger" | "warn";

type Props = {
  label: string;
  variant: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  accent: "bg-accent-light text-accent border border-accent-mid",
  danger: "bg-danger-light text-danger border border-danger-mid",
  warn: "bg-warn-light text-warn border border-warn-mid",
};

export const Badge = ({ label, variant }: Props) => (
  <span
    className={cn(
      "inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium",
      variantStyles[variant]
    )}
  >
    {label}
  </span>
);
