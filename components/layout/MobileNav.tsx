"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, Home, Inbox, Megaphone, MessageSquareText, Search, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "./Sidebar";

const coupleMobile: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Vendors", href: "/marketplace", icon: Search },
  { label: "Messages", href: "/messages", icon: MessageSquareText },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "Guests", href: "/rsvp", icon: UsersRound },
];

const vendorMobile: NavItem[] = [
  { label: "Home", href: "/vendor/dashboard", icon: Home },
  { label: "Leads", href: "/vendor/leads", icon: Inbox },
  { label: "Needs", href: "/vendor/opportunities", icon: Megaphone },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquareText },
  { label: "Couple", href: "/dashboard", icon: UsersRound },
];

export function MobileNav({ mode }: { mode: "couple" | "vendor" }) {
  const pathname = usePathname();
  const items = mode === "vendor" ? vendorMobile : coupleMobile;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7dfd3] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-[#777065]",
                active ? "bg-[#fbf5ec] text-[#8a6332]" : "hover:bg-[#faf9f7]",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
