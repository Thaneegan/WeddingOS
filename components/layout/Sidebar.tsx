"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gem,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  MessageSquareText,
  Search,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceChrome } from "./AppLayout";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const coupleNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Vendors & Quotes", href: "/marketplace", icon: Search },
  { label: "Messages", href: "/messages", icon: MessageSquareText },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "Guests", href: "/rsvp", icon: UsersRound },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "Run Sheets", href: "/run-sheet", icon: ClipboardList },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Planner", href: "/planner", icon: Bot },
];

export const vendorNav: NavItem[] = [
  { label: "Vendor Home", href: "/vendor/dashboard", icon: Home },
  { label: "Leads", href: "/vendor/leads", icon: Inbox },
  { label: "Opportunities", href: "/vendor/opportunities", icon: Megaphone },
  { label: "Clients", href: "/vendor/clients", icon: BriefcaseBusiness },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquareText },
  { label: "Analytics", href: "/vendor/analytics", icon: ChartNoAxesCombined },
];

export function Sidebar({ mode, workspace }: { mode: "couple" | "vendor"; workspace?: WorkspaceChrome }) {
  const pathname = usePathname();
  const items = mode === "vendor" ? vendorNav : coupleNav;
  const accountLabel = workspace?.title ?? (mode === "vendor" ? "Vendor workspace" : "Wedding workspace");
  const accountMeta = workspace?.subtitle ?? (mode === "vendor" ? "Business portal" : "Planning portal");
  const weddingDate = useMemo(() => (workspace?.weddingDate ? new Date(workspace.weddingDate) : null), [workspace]);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!countdownOpen) return;
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, [countdownOpen]);
  const daysUntilWedding = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000))
    : null;
  const countdownParts = useMemo(() => {
    if (!weddingDate) return { days: 0, hours: 0, minutes: 0 };
    const totalMs = Math.max(0, weddingDate.getTime() - now.getTime());
    const totalMinutes = Math.floor(totalMs / 60_000);
    return {
      days: Math.floor(totalMinutes / 1440),
      hours: Math.floor((totalMinutes % 1440) / 60),
      minutes: totalMinutes % 60,
    };
  }, [now, weddingDate]);

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-[#e7dfd3] bg-[#fbfaf8]/95 px-5 py-6 lg:block">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#191714] text-white">
          <Gem size={20} />
        </div>
        <div>
          <p className="font-display text-xl font-semibold leading-none">Wedding OS</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#9a7a50]">{mode} portal</p>
        </div>
      </Link>

      <nav className="mt-9 space-y-1.5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#6f6a61] transition",
                active ? "bg-white text-[#191714] luxury-shadow" : "hover:bg-white hover:text-[#191714]",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {mode === "couple" && daysUntilWedding !== null ? (
        <button
          type="button"
          onClick={() => setCountdownOpen(true)}
          className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#eadcc6] bg-white p-4 text-left luxury-shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Wedding countdown</p>
          <p className="mt-2 font-display text-4xl font-semibold leading-none text-[#191714]">{daysUntilWedding}</p>
          <p className="mt-1 text-sm font-semibold text-[#191714]">{daysUntilWedding === 1 ? "day" : "days"} to go</p>
          <p className="mt-2 truncate text-xs leading-5 text-[#8b8378]">{accountMeta}</p>
        </button>
      ) : (
        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#eadcc6] bg-white p-4 luxury-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Workspace</p>
          <p className="mt-1 truncate text-sm font-semibold leading-5 text-[#191714]">{accountLabel}</p>
          <p className="mt-0.5 truncate text-xs leading-5 text-[#8b8378]">{accountMeta}</p>
        </div>
      )}
      {countdownOpen && weddingDate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#191714]/70 p-6 backdrop-blur-md"
          onMouseDown={() => setCountdownOpen(false)}
        >
          <div
            className="relative w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-white/20 bg-[#18130f] p-8 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(200,169,126,0.38),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%)]" />
            <div className="relative">
              <div className="flex items-center gap-5">
                <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 font-display text-3xl font-semibold shadow-2xl backdrop-blur">
                  {(workspace?.initials ?? "WO").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e6c99b]">Wedding Countdown</p>
                  <h2 className="mt-2 font-display text-4xl font-semibold leading-tight">{accountLabel}</h2>
                  <p className="mt-2 text-sm text-white/65">{accountMeta}</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  ["Days", countdownParts.days],
                  ["Hours", countdownParts.hours],
                  ["Minutes", countdownParts.minutes],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur">
                    <p className="font-display text-5xl font-semibold leading-none">{String(value).padStart(2, "0")}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-[#c8a97e]" />
              </div>
              <p className="mt-5 text-center text-sm font-medium text-white/55">Click outside to close</p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
