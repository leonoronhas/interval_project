"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { statusStyles, statusLabel } from "@/lib/constants";
import type { Customer } from "@/lib/db/schema";

export const CustomerTableRow = ({ customer }: { customer: Customer }) => {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/customers/${customer.id}`)}
      className="border-b border-border-muted last:border-b-0 hover:bg-[#faf9f6] transition-colors cursor-pointer"
    >
      <td className="px-3.5 py-3 text-[13px] font-mono text-muted">
        {customer.accountId}
      </td>
      <td className="px-3.5 py-3 text-[13px] font-medium text-ink">
        {customer.fullName}
      </td>
      <td className="px-3.5 py-3 text-[13px] text-ink">{customer.plan}</td>
      <td className="px-3.5 py-3 text-[13px] font-mono font-medium text-ink">
        {formatMoney(customer.amountDue)}
      </td>
      <td className="px-3.5 py-3 text-[13px] font-mono text-ink">{customer.dueDate}</td>
      <td className="px-3.5 py-3">
        <span
          className={cn(
            "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium",
            statusStyles[customer.status]
          )}
        >
          {statusLabel[customer.status]}
        </span>
      </td>
      <td className="px-3.5 py-3 text-[13px] font-medium text-accent">
        {customer.status === "resolved" ? (
          <span className="text-muted font-normal">Resolved</span>
        ) : (
          "Generate →"
        )}
      </td>
    </tr>
  );
};
