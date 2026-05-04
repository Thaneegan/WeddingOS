"use client";

import { CircleDollarSign, CreditCard, Landmark, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export function BudgetOverview() {
  const wedding = useWeddingStore((state) => state.wedding);
  const budgetItems = useWeddingStore((state) => state.budgetItems);
  const spent = budgetItems.filter((item) => item.status !== "Planned").reduce((sum, item) => sum + item.amount, 0);
  const paid = budgetItems.reduce((sum, item) => sum + item.paid, 0);
  const remaining = wedding.budget - spent;
  const categories = budgetItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total budget" value={formatCurrency(wedding.budget)} detail="Target planning budget" icon={Landmark} tone="ink" />
        <MetricCard label="Committed" value={formatCurrency(spent)} detail={`${Math.round((spent / wedding.budget) * 100)}% of total`} icon={CircleDollarSign} tone="gold" />
        <MetricCard label="Remaining" value={formatCurrency(remaining)} detail="Available for open vendors" icon={WalletCards} tone="green" />
        <MetricCard label="Paid to date" value={formatCurrency(paid)} detail="Deposits and paid items" icon={CreditCard} tone="rose" />
      </div>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader title="Budget progress" description="Booking vendors updates this committed spend immediately." />
        <ProgressBar value={spent} max={wedding.budget} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(categories).map(([category, amount]) => (
            <div key={category} className="rounded-2xl bg-[#faf7f1] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{category}</p>
                <span className="text-sm font-semibold text-[#9a7a50]">{formatCurrency(amount)}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={amount} max={wedding.budget} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader title="Vendor-linked expenses" />
        <div className="overflow-hidden rounded-2xl border border-[#eee7dd]">
          {budgetItems.map((item) => (
            <div key={item.id} className="grid gap-3 border-b border-[#eee7dd] p-4 last:border-0 md:grid-cols-[1fr_140px_140px_120px] md:items-center">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{item.category} - due {formatDate(item.dueDate)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.amount)}</p>
              <p className="text-sm text-[#6f6a61]">Paid {formatCurrency(item.paid)}</p>
              <StatusBadge tone={item.status === "Paid" || item.status === "Deposit Paid" ? "green" : item.status === "Due Soon" ? "rose" : "neutral"}>
                {item.status}
              </StatusBadge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
