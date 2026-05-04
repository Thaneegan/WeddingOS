"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gem,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Search,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const coupleNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/marketplace", icon: Search },
  { label: "Messages", href: "/messages", icon: MessageSquareText },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "RSVP", href: "/rsvp", icon: UsersRound },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "AI Planner", href: "/planner", icon: Bot },
];

export const vendorNav: NavItem[] = [
  { label: "Vendor Home", href: "/vendor/dashboard", icon: Home },
  { label: "Leads", href: "/vendor/leads", icon: Inbox },
  { label: "Clients", href: "/vendor/clients", icon: BriefcaseBusiness },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquareText },
  { label: "Analytics", href: "/vendor/analytics", icon: ChartNoAxesCombined },
  { label: "Couple View", href: "/dashboard", icon: ListChecks },
];

export function Sidebar({ mode }: { mode: "couple" | "vendor" }) {
  const pathname = usePathname();
  const items = mode === "vendor" ? vendorNav : coupleNav;

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

      <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#eadcc6] bg-white p-4">
        <p className="text-sm font-semibold text-[#191714]">Demo account</p>
        <p className="mt-1 text-sm leading-5 text-[#6f6a61]">
          {mode === "vendor" ? "Golden Lens Photography" : "Arjun & Maya, July 18, 2026"}
        </p>
      </div>
    </aside>
  );
}
