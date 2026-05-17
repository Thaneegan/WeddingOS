"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BarChart3, CalendarPlus, CheckCircle2, ChevronDown, CircleDollarSign, CreditCard, FileText, Grid2X2, Landmark, Pencil, Plus, Save, Search, Trash2, WalletCards, X } from "lucide-react";
import {
  createBudgetItem,
  createInvoiceRecord,
  createPaymentReminder,
  createPaymentScheduleItem,
  deleteBudgetItem,
  deletePaymentScheduleItem,
  dismissPaymentReminder,
  updateBudgetItem,
  updatePaymentScheduleItem,
} from "@/app/actions";
import { MetricCard } from "@/components/shared/MetricCard";
import { FileAssetManager } from "@/components/shared/FileAssetManager";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Tooltip } from "@/components/shared/Tooltip";
import { WeddingBudgetHeatmap, type HeatmapItem } from "@/components/shared/WeddingBudgetHeatmap";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreBudgetData, CoreBudgetItem } from "@/types/core";

type BudgetDraft = {
  label: string;
  eventId: string;
  categoryId: string;
  amount: string;
  paid: string;
  dueDate: string;
  status: string;
};

type PaymentDraft = {
  label: string;
  amount: string;
  dueDate: string;
  status: string;
};

type BudgetVisualizationItem = {
  id: string;
  label: string;
  committedAmount: number;
  plannedAmount: number;
  totalAmount: number;
  committedItemCount: number;
  totalItemCount: number;
  percentCommittedOfBudget: number;
  percentTotalOfBudget: number;
  percentOfCommitted: number;
  color?: string;
  tone: "ink" | "gold" | "green" | "rose" | "sand";
};

function itemToDraft(item: CoreBudgetItem): BudgetDraft {
  return {
    label: item.label,
    eventId: item.eventId ?? "",
    categoryId: item.categoryId,
    amount: String(item.amount),
    paid: String(item.paid),
    dueDate: item.dueDate.slice(0, 10),
    status: item.status,
  };
}

function BudgetBarGraph({
  items,
  totalBudget,
  scope,
}: {
  items: BudgetVisualizationItem[];
  totalBudget: number;
  scope: "committed" | "all";
}) {
  return (
    <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
      <div className="space-y-4">
        {items
          .filter((item) => (scope === "committed" ? item.committedAmount : item.totalAmount) > 0)
          .map((item) => {
            const amount = scope === "committed" ? item.committedAmount : item.totalAmount;
            const percent = scope === "committed" ? item.percentCommittedOfBudget : item.percentTotalOfBudget;
            const count = scope === "committed" ? item.committedItemCount : item.totalItemCount;

            return (
              <div key={item.label} className="grid gap-2 sm:grid-cols-[180px_1fr_150px] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#191714]">{item.label}</p>
                  <p className="text-xs text-[#777065]">
                    {count} {scope === "committed" ? "committed" : "total"} item{count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-[#eee7dd]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.max(percent, 0), 100)}%`,
                      backgroundColor: item.color ?? "#c8a97e",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm sm:justify-end">
                  <span className="font-semibold text-[#191714]">{formatCurrency(amount)}</span>
                  <span className="min-w-14 rounded-full bg-white px-2 py-1 text-center text-xs font-semibold text-[#9a7a50]">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#777065]">
        Percentages are based on the full {formatCurrency(totalBudget)} wedding budget.
      </p>
    </div>
  );
}

function BudgetHealthCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "rose";
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "rose" ? "border-[#efd5d4] bg-[#fff5f4]" : "border-[#eee7dd] bg-[#fffdf9]"}`}>
      <p className="text-sm font-medium text-[#777065]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#191714]">{value}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#777065]">{detail}</p>
    </div>
  );
}

type PaymentTone = "paid" | "deposit" | "due" | "overdue" | "planned";

function paymentProgress(amount: number, paid: number) {
  if (amount <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / amount) * 100)));
}

function paymentTone(status: string, dueDate?: string, amount = 0, paid = 0): PaymentTone {
  if (paid >= amount && amount > 0) return "paid";
  if (status === "Paid") return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(dueDate) : null;
  if (due && due < today && paid < amount) return "overdue";
  if (status === "Due Soon") return "due";
  if (status === "Deposit Paid" || paid > 0) return "deposit";
  return "planned";
}

function paymentToneClasses(tone: PaymentTone) {
  const classes = {
    paid: "border-[#dce8d3] bg-[#f4faf1]",
    deposit: "border-[#ead9b8] bg-[#fff8ea]",
    due: "border-[#ead9b8] bg-[#fffbf2]",
    overdue: "border-[#f0c9c9] bg-[#fff4f3]",
    planned: "border-[#eee7dd] bg-[#fffdf9]",
  };
  return classes[tone];
}

function paymentBarClass(tone: PaymentTone) {
  const classes = {
    paid: "bg-[#61735f]",
    deposit: "bg-[#c8a97e]",
    due: "bg-[#d79a4b]",
    overdue: "bg-[#b85b60]",
    planned: "bg-[#cfc4b5]",
  };
  return classes[tone];
}

function paymentLabel(tone: PaymentTone) {
  const labels = {
    paid: "Paid",
    deposit: "Deposit paid",
    due: "Due soon",
    overdue: "Overdue",
    planned: "Planned",
  };
  return labels[tone];
}

function scheduleIsPaid(status: string) {
  return status === "Paid" || status === "Deposit Paid";
}

function dueTimingLabel(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

function expenseDisplayLabel(item: CoreBudgetItem) {
  let label = item.label;
  if (item.vendorName && label.toLowerCase().startsWith(`${item.vendorName.toLowerCase()} - `)) {
    label = label.slice(item.vendorName.length + 3);
  }
  return label.replace(/\s+confirmed booking$/i, "");
}

export function BudgetOverview({ data, taxonomySlot }: { data: CoreBudgetData; taxonomySlot?: ReactNode }) {
  const router = useRouter();
  const [visualization, setVisualization] = useState<"heatmap" | "bars">("heatmap");
  const [budgetScope, setBudgetScope] = useState<"committed" | "all">("committed");
  const [budgetDimension, setBudgetDimension] = useState<"category" | "event">("category");
  const [itemQuery, setItemQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [eventFilter, setEventFilter] = useState("All events");
  const [newItem, setNewItem] = useState({
    label: "",
    eventId: "",
    categoryId: data.categories[0]?.id ?? "",
    amount: "",
    dueDate: "2026-06-30",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BudgetDraft | null>(null);
  const [paymentEditingId, setPaymentEditingId] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [notice, setNotice] = useState("");
  const wedding = data.wedding;
  const budgetItems = data.items;
  const spent = budgetItems.filter((item) => item.status !== "Planned").reduce((sum, item) => sum + item.amount, 0);
  const paid = budgetItems.reduce((sum, item) => sum + item.paid, 0);
  const remaining = wedding.budget - spent;
  const committedPercent = wedding.budget > 0 ? Math.round((spent / wedding.budget) * 100) : 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const unpaidBalance = budgetItems.reduce((sum, item) => sum + Math.max(item.amount - item.paid, 0), 0);
  const dueSoonItems = budgetItems.filter((item) => {
    const dueDate = new Date(item.dueDate);
    return item.status !== "Paid" && dueDate >= now && dueDate <= inThirtyDays;
  });
  const overdueItems = budgetItems.filter((item) => item.status !== "Paid" && new Date(item.dueDate) < now);
  const paidPercent = spent > 0 ? Math.round((paid / spent) * 100) : 0;
  const paymentScheduleStats = useMemo(() => {
    const overdue = data.paymentSchedule.filter((item) => paymentTone(item.status, item.dueDate, item.amount, scheduleIsPaid(item.status) ? item.amount : 0) === "overdue");
    const dueSoon = data.paymentSchedule.filter((item) => paymentTone(item.status, item.dueDate, item.amount, scheduleIsPaid(item.status) ? item.amount : 0) === "due");
    const paidRows = data.paymentSchedule.filter((item) => scheduleIsPaid(item.status));
    const openBalance = data.paymentSchedule
      .filter((item) => !scheduleIsPaid(item.status))
      .reduce((sum, item) => sum + item.amount, 0);

    return { overdue, dueSoon, paidRows, openBalance };
  }, [data.paymentSchedule]);
  const budgetHealth =
    remaining < 0
      ? { label: "Over budget", tone: "rose" as const, detail: `${formatCurrency(Math.abs(remaining))} over target` }
      : dueSoonItems.length || overdueItems.length
        ? { label: "Needs attention", tone: "gold" as const, detail: `${dueSoonItems.length + overdueItems.length} payment item${dueSoonItems.length + overdueItems.length === 1 ? "" : "s"} need review` }
        : { label: "On track", tone: "green" as const, detail: `${formatCurrency(remaining)} still available` };
  const categoryTotals = budgetItems.reduce<Record<string, { label: string; committedAmount: number; plannedAmount: number; totalAmount: number; committedItemCount: number; totalItemCount: number }>>((acc, item) => {
    acc[item.categoryId] = acc[item.categoryId] ?? { label: item.category, committedAmount: 0, plannedAmount: 0, totalAmount: 0, committedItemCount: 0, totalItemCount: 0 };
    acc[item.categoryId].totalAmount += item.amount;
    acc[item.categoryId].totalItemCount += 1;
    if (item.status === "Planned") {
      acc[item.categoryId].plannedAmount += item.amount;
    } else {
      acc[item.categoryId].committedAmount += item.amount;
      acc[item.categoryId].committedItemCount += 1;
    }
    return acc;
  }, {});
  const budgetCategories = useMemo(
    () => data.categories.filter((category) => category.type === "budget" && !category.archivedAt),
    [data.categories],
  );
  const categoryVisualizationItems = useMemo(
    () =>
      budgetCategories
        .map((category, index) => {
          const total = categoryTotals[category.id];
          const committedAmount = total?.committedAmount ?? 0;
          const plannedAmount = total?.plannedAmount ?? 0;
          const totalAmount = total?.totalAmount ?? 0;

          return {
            id: category.id,
            label: category.name,
            committedAmount,
            plannedAmount,
            totalAmount,
            committedItemCount: total?.committedItemCount ?? 0,
            totalItemCount: total?.totalItemCount ?? 0,
            percentCommittedOfBudget: wedding.budget > 0 ? Math.round((committedAmount / wedding.budget) * 100) : 0,
            percentTotalOfBudget: wedding.budget > 0 ? Math.round((totalAmount / wedding.budget) * 100) : 0,
            percentOfCommitted: Math.round((committedAmount / Math.max(spent, 1)) * 100),
            color: category.color,
            tone: (["ink", "gold", "green", "rose", "sand"] as const)[index % 5],
          };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount || a.label.localeCompare(b.label)),
    [budgetCategories, categoryTotals, spent, wedding.budget],
  );
  const eventTotals = budgetItems.reduce<Record<string, { label: string; committedAmount: number; plannedAmount: number; totalAmount: number; committedItemCount: number; totalItemCount: number }>>((acc, item) => {
    const key = item.eventId ?? "unassigned";
    acc[key] = acc[key] ?? { label: item.eventName ?? "Unassigned", committedAmount: 0, plannedAmount: 0, totalAmount: 0, committedItemCount: 0, totalItemCount: 0 };
    acc[key].totalAmount += item.amount;
    acc[key].totalItemCount += 1;
    if (item.status === "Planned") {
      acc[key].plannedAmount += item.amount;
    } else {
      acc[key].committedAmount += item.amount;
      acc[key].committedItemCount += 1;
    }
    return acc;
  }, {});
  const eventVisualizationItems = useMemo(
    () =>
      [
        ...data.events.map((event) => ({ id: event.id, label: event.name, color: undefined as string | undefined })),
        { id: "unassigned", label: "Unassigned", color: "#d8c6aa" },
      ]
        .map((event, index) => {
          const total = eventTotals[event.id];
          const committedAmount = total?.committedAmount ?? 0;
          const plannedAmount = total?.plannedAmount ?? 0;
          const totalAmount = total?.totalAmount ?? 0;

          return {
            id: event.id,
            label: event.label,
            committedAmount,
            plannedAmount,
            totalAmount,
            committedItemCount: total?.committedItemCount ?? 0,
            totalItemCount: total?.totalItemCount ?? 0,
            percentCommittedOfBudget: wedding.budget > 0 ? Math.round((committedAmount / wedding.budget) * 100) : 0,
            percentTotalOfBudget: wedding.budget > 0 ? Math.round((totalAmount / wedding.budget) * 100) : 0,
            percentOfCommitted: Math.round((committedAmount / Math.max(spent, 1)) * 100),
            color: event.color,
            tone: (["ink", "gold", "green", "rose", "sand"] as const)[index % 5],
          };
        })
        .filter((item) => item.totalAmount > 0 || item.id !== "unassigned")
        .sort((a, b) => b.totalAmount - a.totalAmount || a.label.localeCompare(b.label)),
    [data.events, eventTotals, spent, wedding.budget],
  );
  const activeVisualizationItems = budgetDimension === "category" ? categoryVisualizationItems : eventVisualizationItems;
  const heatmapItems: HeatmapItem[] = activeVisualizationItems
    .filter((item) => (budgetScope === "committed" ? item.committedAmount : item.totalAmount) > 0)
    .map((item) => ({
      label: item.label,
      amount: budgetScope === "committed" ? item.committedAmount : item.totalAmount,
      percent: budgetScope === "committed" ? item.percentCommittedOfBudget : item.percentTotalOfBudget,
      note:
        budgetScope === "committed"
          ? `${item.committedItemCount} committed item${item.committedItemCount === 1 ? "" : "s"}`
          : `${item.totalItemCount} total item${item.totalItemCount === 1 ? "" : "s"}`,
      tone: item.tone,
    }));
  const visibleBudgetItems = useMemo(() => {
    const normalized = itemQuery.trim().toLowerCase();
    return budgetItems.filter((item) => {
      const matchesQuery = normalized
        ? `${item.label} ${item.category} ${item.eventName ?? ""} ${item.vendorName ?? ""}`.toLowerCase().includes(normalized)
        : true;
      const matchesStatus = statusFilter === "All statuses" || item.status === statusFilter;
      const matchesEvent = eventFilter === "All events" || (eventFilter === "No event" ? !item.eventId : item.eventId === eventFilter);
      return matchesQuery && matchesStatus && matchesEvent;
    });
  }, [budgetItems, eventFilter, itemQuery, statusFilter]);
  const visibleVendorExpenseGroups = useMemo(() => {
    const rows = new Map<
      string,
      {
        vendorName: string;
        amount: number;
        paid: number;
        dueDate?: string;
        items: CoreBudgetItem[];
      }
    >();

    visibleBudgetItems
      .filter((item) => item.vendorName)
      .forEach((item) => {
        const key = item.vendorId ?? item.vendorName!;
        const current = rows.get(key) ?? {
          vendorName: item.vendorName!,
          amount: 0,
          paid: 0,
          dueDate: undefined,
          items: [],
        };
        current.amount += item.amount;
        current.paid += item.paid;
        current.items.push(item);
        if (!current.dueDate || new Date(item.dueDate) < new Date(current.dueDate)) {
          current.dueDate = item.dueDate;
        }
        rows.set(key, current);
      });

    return Array.from(rows.values()).sort((a, b) => {
      const aProgress = paymentProgress(a.amount, a.paid);
      const bProgress = paymentProgress(b.amount, b.paid);
      return aProgress - bProgress || b.amount - a.amount || a.vendorName.localeCompare(b.vendorName);
    });
  }, [visibleBudgetItems]);
  const visibleOtherBudgetItems = useMemo(() => visibleBudgetItems.filter((item) => !item.vendorName), [visibleBudgetItems]);

  const saveDraft = async (itemId: string) => {
    if (!draft?.label.trim()) return;
    const amount = Number(draft.amount);
    const paid = Number(draft.paid);
    if (!Number.isFinite(amount) || !Number.isFinite(paid)) return;
    await updateBudgetItem({
      budgetItemId: itemId,
      fields: {
        label: draft.label,
        eventId: draft.eventId || null,
        categoryId: draft.categoryId,
        amount,
        paid,
        dueDate: draft.dueDate,
        status: draft.status,
      },
    });
    setEditingId(null);
    setDraft(null);
    router.refresh();
  };
  const setPaymentStatus = async (paymentId: string, status: string) => {
    const payment = data.paymentSchedule.find((item) => item.id === paymentId);
    if (!payment) return;
    await updatePaymentScheduleItem({ paymentScheduleItemId: payment.id, fields: { status } });

    if (payment.budgetItemId) {
      const budgetItem = budgetItems.find((item) => item.id === payment.budgetItemId);
      if (budgetItem) {
        const paidTotal = data.paymentSchedule
          .filter((item) => item.budgetItemId === payment.budgetItemId)
          .reduce((sum, item) => {
            const effectiveStatus = item.id === payment.id ? status : item.status;
            return scheduleIsPaid(effectiveStatus) ? sum + item.amount : sum;
          }, 0);
        const nextPaid = Math.min(budgetItem.amount, paidTotal);
        await updateBudgetItem({
          budgetItemId: budgetItem.id,
          fields: {
            paid: nextPaid,
            status: nextPaid >= budgetItem.amount ? "Paid" : nextPaid > 0 ? "Deposit Paid" : budgetItem.status,
          },
        });
      }
    }

    setNotice(`${payment.label} marked ${status.toLowerCase()}.`);
    router.refresh();
  };

  const savePaymentDraft = async (paymentId: string) => {
    if (!paymentDraft?.label.trim()) return;
    const amount = Number(paymentDraft.amount);
    if (!Number.isFinite(amount)) return;
    await updatePaymentScheduleItem({
      paymentScheduleItemId: paymentId,
      fields: {
        label: paymentDraft.label,
        amount,
        dueDate: paymentDraft.dueDate,
        status: paymentDraft.status,
      },
    });
    setPaymentEditingId(null);
    setPaymentDraft(null);
    router.refresh();
  };
  const renderBudgetExpenseRow = (item: CoreBudgetItem, nested = false) => {
    const editing = editingId === item.id && draft;
    const tone = paymentTone(item.status, item.dueDate, item.amount, item.paid);

    return (
      <div
        key={item.id}
        className={`p-4 transition hover:bg-[#fbfaf8] ${
          nested
            ? `mb-2 rounded-2xl border border-[#eadfce] bg-white shadow-sm last:mb-0`
            : `border-b border-[#eee7dd] last:border-0 ${editing ? "bg-white" : paymentToneClasses(tone)}`
        }`}
      >
        {editing ? (
          <div className="grid gap-3 md:grid-cols-[1fr_160px_180px_110px_110px_140px_140px_auto] md:items-center">
            <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
            <select value={draft.eventId} onChange={(event) => setDraft({ ...draft, eventId: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
              <option value="">No event</option>
              {data.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
            <input value={draft.paid} onChange={(event) => setDraft({ ...draft, paid: event.target.value })} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
            <input value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} type="date" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
              <option>Planned</option>
              <option>Due Soon</option>
              <option>Deposit Paid</option>
              <option>Paid</option>
            </select>
            <div className="flex gap-2">
              <Tooltip label="Save changes">
                <button type="button" onClick={() => void saveDraft(item.id)} className="flex size-10 items-center justify-center rounded-full bg-[#191714] text-white" aria-label={`Save ${item.label}`}>
                  <Save size={16} />
                </button>
              </Tooltip>
              <Tooltip label="Cancel editing">
                <button type="button" onClick={() => { setEditingId(null); setDraft(null); }} className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3]" aria-label="Cancel edit">
                  <X size={16} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_150px_184px] md:items-center">
            <div>
              <p className="font-semibold">{expenseDisplayLabel(item)}</p>
              <p className="mt-1 text-sm text-[#6f6a61]">
                {item.eventName ? `${item.eventName} - ` : ""}
                {item.category} - due {formatDate(item.dueDate)}
              </p>
            </div>
            <p className="font-semibold">{formatCurrency(item.amount)}</p>
            <p className="text-sm font-semibold text-[#6f6a61]">{formatCurrency(item.paid)} paid</p>
            <select
              value={item.status}
              onChange={async (event) => {
                await updateBudgetItem({ budgetItemId: item.id, fields: { status: event.target.value } });
                router.refresh();
              }}
              className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
            >
              <option>Planned</option>
              <option>Due Soon</option>
              <option>Deposit Paid</option>
              <option>Paid</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                title="Add payment schedule"
                onClick={async () => {
                  await createPaymentScheduleItem({
                    budgetItemId: item.id,
                    label: `${item.label} payment`,
                    amount: Math.max(item.amount - item.paid, 0),
                    dueDate: item.dueDate,
                    status: item.status,
                  });
                  setNotice(`Payment schedule added for ${item.label}.`);
                  router.refresh();
                }}
                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61] transition hover:-translate-y-0.5 hover:bg-white"
                aria-label={`Add payment schedule for ${item.label}`}
              >
                <CalendarPlus size={16} />
              </button>
              <button
                type="button"
                title="Create invoice"
                onClick={async () => {
                  await createInvoiceRecord({
                    budgetItemId: item.id,
                    label: `${item.label} invoice`,
                    amount: item.amount,
                    dueDate: item.dueDate,
                  });
                  setNotice(`Invoice record added for ${item.label}.`);
                  router.refresh();
                }}
                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61] transition hover:-translate-y-0.5 hover:bg-white"
                aria-label={`Add invoice for ${item.label}`}
              >
                <FileText size={16} />
              </button>
              <button
                type="button"
                title="Edit"
                onClick={() => {
                  setEditingId(item.id);
                  setDraft(itemToDraft(item));
                }}
                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61] transition hover:-translate-y-0.5 hover:bg-white"
                aria-label={`Edit ${item.label}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={async () => {
                  await deleteBudgetItem({ budgetItemId: item.id });
                  router.refresh();
                }}
                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d] transition hover:-translate-y-0.5 hover:bg-white"
                aria-label={`Delete ${item.label}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total budget" value={formatCurrency(wedding.budget)} detail="Target planning budget" icon={Landmark} tone="ink" />
        <MetricCard label="Committed" value={formatCurrency(spent)} detail={wedding.budget > 0 ? `${committedPercent}% of total` : "Set a budget to track progress"} icon={CircleDollarSign} tone="gold" />
        <MetricCard label="Remaining" value={formatCurrency(remaining)} detail="Available for open vendors" icon={WalletCards} tone="green" />
        <MetricCard label="Paid to date" value={formatCurrency(paid)} detail="Deposits and paid items" icon={CreditCard} tone="rose" />
      </div>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Budget health</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">What needs attention?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f6a61]">
              Use this section for daily budget checks: confirm upcoming payments, mark deposits paid, and watch committed spend before accepting new quotes.
            </p>
          </div>
          <div className={`rounded-2xl px-5 py-4 ${budgetHealth.tone === "rose" ? "bg-[#fff4f3]" : budgetHealth.tone === "gold" ? "bg-[#fbf5ec]" : "bg-[#f1f6ef]"}`}>
            <div className="flex items-center gap-2">
              {budgetHealth.tone === "green" ? <CheckCircle2 size={18} className="text-[#61735f]" /> : <AlertCircle size={18} className={budgetHealth.tone === "rose" ? "text-[#93484d]" : "text-[#9a7a50]"} />}
              <p className="font-semibold text-[#191714]">{budgetHealth.label}</p>
            </div>
            <p className="mt-1 text-sm text-[#6f6a61]">{budgetHealth.detail}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <BudgetHealthCard label="Due in 30 days" value={`${dueSoonItems.length}`} detail={dueSoonItems[0] ? `${dueSoonItems[0].label} - ${formatDate(dueSoonItems[0].dueDate)}` : "No near-term payments"} />
          <BudgetHealthCard label="Overdue" value={`${overdueItems.length}`} detail={overdueItems[0] ? `${overdueItems[0].label} - ${formatDate(overdueItems[0].dueDate)}` : "No overdue items"} tone={overdueItems.length ? "rose" : "neutral"} />
          <BudgetHealthCard label="Unpaid balance" value={formatCurrency(unpaidBalance)} detail="Committed or planned balance not marked paid" />
          <BudgetHealthCard label="Paid progress" value={`${paidPercent}%`} detail={`${formatCurrency(paid)} paid against committed spend`} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            title="Budget visualizations"
            description="Switch between a spend heatmap and category bars to see where budget is concentrated."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid h-11 w-full grid-cols-2 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] p-1 sm:w-[320px]">
              <button
                type="button"
                onClick={() => setBudgetDimension("category")}
                aria-pressed={budgetDimension === "category"}
                className={`rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  budgetDimension === "category" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                By category
              </button>
              <button
                type="button"
                onClick={() => setBudgetDimension("event")}
                aria-pressed={budgetDimension === "event"}
                className={`rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  budgetDimension === "event" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                By event
              </button>
            </div>
            <div className="grid h-11 w-full grid-cols-2 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] p-1 sm:w-[320px]">
              <button
                type="button"
                onClick={() => setVisualization("heatmap")}
                aria-pressed={visualization === "heatmap"}
                className={`inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  visualization === "heatmap" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                <Grid2X2 size={15} />
                Heatmap
              </button>
              <button
                type="button"
                onClick={() => setVisualization("bars")}
                aria-pressed={visualization === "bars"}
                className={`inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  visualization === "bars" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                <BarChart3 size={15} />
                Bars
              </button>
            </div>
            <div className="grid h-11 w-full grid-cols-2 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] p-1 sm:w-[320px]">
              <button
                type="button"
                onClick={() => setBudgetScope("committed")}
                aria-pressed={budgetScope === "committed"}
                className={`rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  budgetScope === "committed" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                Committed
              </button>
              <button
                type="button"
                onClick={() => setBudgetScope("all")}
                aria-pressed={budgetScope === "all"}
                className={`rounded-full text-sm font-semibold transition hover:-translate-y-0.5 ${
                  budgetScope === "all" ? "bg-[#191714] text-white shadow-sm" : "text-[#6f6a61] hover:bg-white"
                }`}
              >
                All budget
              </button>
            </div>
          </div>
        </div>
        {visualization === "heatmap" ? (
          <WeddingBudgetHeatmap
            mode="actual"
            title={budgetScope === "committed" ? "Committed spend heatmap" : "All budget heatmap"}
            description={
              budgetScope === "committed"
                ? `One quick view of where committed wedding spend is concentrated by ${budgetDimension}.`
                : `One quick view of all allocated budget by ${budgetDimension}, including planned and committed items.`
            }
            totalBudget={wedding.budget}
            items={heatmapItems}
            actualSummaryLabel={budgetScope === "committed" ? "Committed" : "All budget"}
          />
        ) : (
          <BudgetBarGraph items={activeVisualizationItems} totalBudget={wedding.budget} scope={budgetScope} />
        )}
      </section>

      <FileAssetManager
        ownerType="WEDDING"
        ownerId={wedding.id}
        purpose="INVOICE"
        label="Upload invoice or contract"
        description="Attach vendor invoices, contracts, receipts, or estimate PDFs to this wedding workspace."
        files={data.files}
      />

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          title="Vendor payments and expenses"
          description="Each vendor opens into its linked budget items, payment progress, invoices, and schedule actions."
        />
        {notice ? <p className="mb-4 rounded-2xl border border-[#e5eadf] bg-[#f7fbf4] p-3 text-sm font-semibold text-[#61735f]">{notice}</p> : null}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const amount = Number(newItem.amount);
            if (!newItem.label.trim() || !newItem.categoryId || !Number.isFinite(amount)) return;
            await createBudgetItem({
              categoryId: newItem.categoryId,
              eventId: newItem.eventId || undefined,
              label: newItem.label,
              amount,
              dueDate: newItem.dueDate,
            });
            setNewItem({ label: "", eventId: "", categoryId: data.categories[0]?.id ?? "", amount: "", dueDate: "2026-06-30" });
            router.refresh();
          }}
          className="mb-4 grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[1fr_180px_190px_140px_160px_auto]"
        >
          <input
            value={newItem.label}
            onChange={(event) => setNewItem((item) => ({ ...item, label: event.target.value }))}
            placeholder="Budget item"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <select
            value={newItem.eventId}
            onChange={(event) => setNewItem((item) => ({ ...item, eventId: event.target.value }))}
            aria-label="Wedding event"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
          >
            <option value="">No event</option>
            {data.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <select
            value={newItem.categoryId}
            onChange={(event) => setNewItem((item) => ({ ...item, categoryId: event.target.value }))}
            aria-label="Budget category"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
          >
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={newItem.amount}
            onChange={(event) => setNewItem((item) => ({ ...item, amount: event.target.value }))}
            placeholder="Amount"
            inputMode="decimal"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <input
            value={newItem.dueDate}
            onChange={(event) => setNewItem((item) => ({ ...item, dueDate: event.target.value }))}
            type="date"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white" aria-label="Add budget item">
            <Plus size={16} />
            Add
          </button>
        </form>
        <div className="mb-4 grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[1fr_180px_180px]">
          <div className="flex h-11 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4">
            <Search size={16} className="shrink-0 text-[#9a7a50]" />
            <input
              value={itemQuery}
              onChange={(event) => setItemQuery(event.target.value)}
              placeholder="Search budget items, categories, vendors"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#777065]"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold text-[#6f6a61]" aria-label="Filter budget items by status">
            <option>All statuses</option>
            <option>Planned</option>
            <option>Due Soon</option>
            <option>Deposit Paid</option>
            <option>Paid</option>
          </select>
          <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold text-[#6f6a61]" aria-label="Filter budget items by event">
            <option value="All events">All events</option>
            <option value="No event">No event</option>
            {data.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {visibleVendorExpenseGroups.map((vendor) => {
            const progress = paymentProgress(vendor.amount, vendor.paid);
            const tone = paymentTone(
              vendor.paid >= vendor.amount ? "Paid" : vendor.paid > 0 ? "Deposit Paid" : "Planned",
              vendor.dueDate,
              vendor.amount,
              vendor.paid,
            );

            return (
              <details key={vendor.vendorName} className={`group rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-md ${paymentToneClasses(tone)}`}>
                <summary className="grid cursor-pointer list-none gap-3 p-4 lg:grid-cols-[1fr_220px_180px_32px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[#191714]">{vendor.vendorName}</p>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#6f6a61]">{paymentLabel(tone)}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#6f6a61]">
                      {vendor.items.length} linked expense{vendor.items.length === 1 ? "" : "s"}
                      {vendor.dueDate ? ` - next due ${formatDate(vendor.dueDate)}` : ""}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#6f6a61]">
                      <span>{formatCurrency(vendor.paid)} paid</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full transition-all ${paymentBarClass(tone)}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="text-sm lg:text-right">
                    <p className="font-semibold text-[#191714]">{formatCurrency(vendor.amount)}</p>
                    <p className="mt-1 text-[#6f6a61]">{formatCurrency(Math.max(vendor.amount - vendor.paid, 0))} remaining</p>
                  </div>
                  <ChevronDown size={18} className="justify-self-end text-[#9a7a50] transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-[#eee7dd] bg-[#fffaf2] px-4 py-3">
                  <div className="ml-2 border-l-2 border-[#d8c5aa] pl-4">
                    {vendor.items.map((item) => renderBudgetExpenseRow(item, true))}
                  </div>
                </div>
              </details>
            );
          })}
          {visibleOtherBudgetItems.length ? (
            <details className="group rounded-2xl border border-[#eee7dd] bg-[#fffdf9]" open={!visibleVendorExpenseGroups.length}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-[#191714]">Other expenses</p>
                  <p className="mt-1 text-sm text-[#6f6a61]">Budget items not linked to a vendor.</p>
                </div>
                <ChevronDown size={18} className="text-[#9a7a50] transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-[#eee7dd] bg-[#fffaf2] px-4 py-3">
                <div className="ml-2 border-l-2 border-[#d8c5aa] pl-4">
                  {visibleOtherBudgetItems.map((item) => renderBudgetExpenseRow(item, true))}
                </div>
              </div>
            </details>
          ) : null}
          {!visibleBudgetItems.length ? (
            <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-6 text-center text-sm text-[#6f6a61]">No budget items match these filters.</div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader
            title="Payment schedule"
            description="A work queue for deposits and installments. Track status here; Wedding OS does not move money."
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Open balance</p>
              <p className="mt-1 text-xl font-semibold text-[#191714]">{formatCurrency(paymentScheduleStats.openBalance)}</p>
            </div>
            <div className="rounded-2xl border border-[#ead9b8] bg-[#fff8ea] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Due soon</p>
              <p className="mt-1 text-xl font-semibold text-[#191714]">{paymentScheduleStats.dueSoon.length}</p>
            </div>
            <div className="rounded-2xl border border-[#f0c9c9] bg-[#fff4f3] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93484d]">Overdue</p>
              <p className="mt-1 text-xl font-semibold text-[#191714]">{paymentScheduleStats.overdue.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.paymentSchedule.length ? (
              data.paymentSchedule.map((item) => {
                const paidForRow = scheduleIsPaid(item.status) ? item.amount : 0;
                const tone = paymentTone(item.status, item.dueDate, item.amount, paidForRow);
                const editing = paymentEditingId === item.id && paymentDraft;

                return (
                  <div key={item.id} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${paymentToneClasses(tone)}`}>
                    {editing ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_110px_140px_140px_auto] md:items-center">
                        <input value={paymentDraft.label} onChange={(event) => setPaymentDraft({ ...paymentDraft, label: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                        <input value={paymentDraft.amount} onChange={(event) => setPaymentDraft({ ...paymentDraft, amount: event.target.value })} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                        <input value={paymentDraft.dueDate} onChange={(event) => setPaymentDraft({ ...paymentDraft, dueDate: event.target.value })} type="date" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                        <select value={paymentDraft.status} onChange={(event) => setPaymentDraft({ ...paymentDraft, status: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                          <option>Planned</option>
                          <option>Due Soon</option>
                          <option>Deposit Paid</option>
                          <option>Paid</option>
                        </select>
                        <div className="flex gap-2">
                          <Tooltip label="Save payment row">
                            <button type="button" onClick={() => void savePaymentDraft(item.id)} className="flex size-10 items-center justify-center rounded-full bg-[#191714] text-white" aria-label={`Save ${item.label}`}>
                              <Save size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Cancel editing">
                            <button type="button" onClick={() => { setPaymentEditingId(null); setPaymentDraft(null); }} className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white" aria-label="Cancel payment edit">
                              <X size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#191714]">{item.label}</p>
                              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#6f6a61]">{paymentLabel(tone)}</span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-[#6f6a61]">
                              {item.vendorName ? `${item.vendorName} - ` : ""}
                              {item.sourceLabel ?? (item.bookingId ? "Booking payment" : "Budget payment")} - {formatDate(item.dueDate)} ({dueTimingLabel(item.dueDate)})
                            </p>
                            {item.reminderDaysBefore !== undefined ? (
                              <p className="mt-1 text-xs font-semibold text-[#9a7a50]">
                                Reminder {item.reminderDismissedAt ? "dismissed" : `set ${item.reminderDaysBefore} days before due date`}
                              </p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-sm xl:text-right">
                            <p className="font-semibold text-[#191714]">{formatCurrency(item.amount)}</p>
                            {item.totalAmount ? (
                              <p className="mt-1 text-[#6f6a61]">Part of {formatCurrency(item.totalAmount)}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!scheduleIsPaid(item.status) ? (
                            <Tooltip label="Mark this payment as paid and update linked budget progress when available">
                              <button type="button" onClick={() => void setPaymentStatus(item.id, "Paid")} className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                                Mark paid
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Reopen this payment">
                              <button type="button" onClick={() => void setPaymentStatus(item.id, "Planned")} className="rounded-full border border-[#dce8d3] bg-white px-4 py-2 text-sm font-semibold text-[#61735f] transition hover:-translate-y-0.5">
                                Reopen
                              </button>
                            </Tooltip>
                          )}
                          {!item.reminderDaysBefore || item.reminderDismissedAt ? (
                            <Tooltip label="Remind me 14 days before this payment is due">
                              <button type="button" onClick={async () => { await createPaymentReminder({ paymentScheduleItemId: item.id, reminderDaysBefore: 14 }); router.refresh(); }} className="rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                                Set reminder
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Dismiss this reminder after you have handled it">
                              <button type="button" onClick={async () => { await dismissPaymentReminder({ paymentScheduleItemId: item.id }); router.refresh(); }} className="rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                                Dismiss reminder
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip label="Edit payment row">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentEditingId(item.id);
                                setPaymentDraft({ label: item.label, amount: String(item.amount), dueDate: item.dueDate.slice(0, 10), status: item.status });
                              }}
                              className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#6f6a61] transition hover:-translate-y-0.5"
                              aria-label={`Edit ${item.label}`}
                            >
                              <Pencil size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete payment row">
                            <button
                              type="button"
                              onClick={async () => {
                                await deletePaymentScheduleItem({ paymentScheduleItemId: item.id });
                                router.refresh();
                              }}
                              className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#93484d] transition hover:-translate-y-0.5"
                              aria-label={`Delete ${item.label}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl bg-[#faf7f1] p-4 text-sm text-[#6f6a61]">No payment schedule rows yet. Use the calendar action on a budget item to add one.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Invoice records" description="Tracking-only invoice records for vendor estimates and payment follow-up." />
          <div className="space-y-3">
            {data.invoices.length ? (
              data.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{invoice.label}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">
                        {invoice.status}
                        {invoice.dueDate ? ` - due ${formatDate(invoice.dueDate)}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#9a7a50]">{formatCurrency(invoice.amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-[#faf7f1] p-4 text-sm text-[#6f6a61]">No invoice records yet. Use the document action on a budget item to add one.</p>
            )}
          </div>
        </div>
      </section>

      {taxonomySlot}
    </div>
  );
}
