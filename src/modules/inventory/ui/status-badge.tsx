import type { ReactNode } from "react";
import type { StatusBadgeTone } from "@/modules/inventory/domain/vehicle-labels";

const tones: Record<StatusBadgeTone, string> = {
  neutral: "bg-surface text-ink border-line",
  success: "bg-[#e8f3ee] text-success border-[#c5ddd1]",
  warning: "bg-[#f7f0e4] text-[#8a5a12] border-[#e4d3b0]",
  danger: "bg-[#f8e8e8] text-danger border-[#ecc8c8]",
  muted: "bg-surface-secondary text-ink-muted border-line",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusBadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-sm border px-2 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FlagBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <StatusBadge tone={active ? "success" : "muted"}>
      {active ? activeLabel : inactiveLabel}
    </StatusBadge>
  );
}
