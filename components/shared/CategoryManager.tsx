"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, Plus } from "lucide-react";
import { archiveCategory as archiveCategoryAction, createBudgetItem, createCategory } from "@/app/actions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CategoryType } from "@/types";
import type { CoreCategory } from "@/types/core";

const colors = ["#c8a97e", "#61735f", "#b66f72", "#8a6332", "#191714"];

export function CategoryManager({
  type,
  title,
  description,
  allowBudgetStarter = false,
  categories,
  ownerId,
  compact = false,
}: {
  type: CategoryType;
  title: string;
  description: string;
  allowBudgetStarter?: boolean;
  categories: CoreCategory[];
  ownerId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [showDefaults, setShowDefaults] = useState(false);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === type && !category.archivedAt),
    [categories, type],
  );

  const customCategories = visibleCategories.filter((category) => category.scope !== "global");
  const defaultCategories = visibleCategories.filter((category) => category.scope === "global");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const parsedAmount = Number(amount);

    const category = await createCategory({
      name,
      type,
      scope: type === "vendor_service" ? "vendor_business" : "wedding",
      ownerId,
      color,
      icon: "Sparkles",
    });

    if (allowBudgetStarter && parsedAmount > 0) {
      await createBudgetItem({
        categoryId: category.id,
        label: `${category.name} estimate`,
        amount: parsedAmount,
        dueDate: "2026-06-30",
      });
    }

    router.refresh();
    setName("");
    setAmount("");
    setColor(colors[0]);
  };

  const content = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Custom categories</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="gold">{customCategories.length} custom</StatusBadge>
          <StatusBadge tone="neutral">{defaultCategories.length} defaults</StatusBadge>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_170px_auto]">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Category name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={type === "vendor_service" ? "Live Painter" : "Sangeet"}
              className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
            />
          </label>
          {allowBudgetStarter ? (
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Starter estimate</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="$0"
                inputMode="decimal"
                className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
              />
            </label>
          ) : null}
          <button className="mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2822]">
            <Plus size={16} />
            Add category
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Color</span>
          <div className="flex items-center gap-2">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`Use color ${item}`}
                onClick={() => setColor(item)}
                className={`size-7 rounded-full border-2 transition hover:-translate-y-0.5 ${color === item ? "border-[#191714]" : "border-white shadow-sm"}`}
                style={{ backgroundColor: item }}
              />
            ))}
          </div>
        </div>
      </form>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#191714]">Your custom categories</p>
          <p className="text-xs font-medium text-[#777065]">Archived categories remain attached to old records.</p>
        </div>
        {customCategories.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7dd] bg-[#fbfaf8] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color ?? "#c8a97e" }} />
                  <span className="truncate text-sm font-semibold text-[#4b463d]">{category.name}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await archiveCategoryAction({ categoryId: category.id });
                    router.refresh();
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#93484d] transition hover:-translate-y-0.5 hover:bg-[#fff5f5]"
                  aria-label={`Archive ${category.name}`}
                >
                  <Archive size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-[#fbfaf8] p-4 text-sm leading-6 text-[#6f6a61]">
            No custom categories yet. Add one when your budget needs a bucket outside the platform defaults.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowDefaults((value) => !value)}
        className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#eee7dd] bg-[#fbfaf8] px-4 py-3 text-left text-sm font-semibold text-[#4b463d] transition hover:-translate-y-0.5 hover:bg-[#f7f1e8]"
      >
        Platform default categories
        <ChevronDown size={16} className={`transition ${showDefaults ? "rotate-180" : ""}`} />
      </button>
      {showDefaults ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {defaultCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 py-2 text-sm font-semibold text-[#6f6a61]"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color ?? "#c8a97e" }} />
              {category.name}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <details className="group rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Advanced budget settings</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#191714]">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6f6a61]">
              Use only when the default budget taxonomy does not fit your wedding.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge tone="gold">{customCategories.length} custom</StatusBadge>
            <ChevronDown size={18} className="text-[#9a7a50] transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-5 border-t border-[#eee7dd] pt-5">{content}</div>
      </details>
    );
  }

  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      {content}
    </section>
  );
}
