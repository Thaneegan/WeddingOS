"use client";

import Link from "next/link";
import { Bell, Gem, Search } from "lucide-react";
import { useWeddingStore } from "@/store/useWeddingStore";

export function Topbar({ mode }: { mode: "couple" | "vendor" }) {
  const wedding = useWeddingStore((state) => state.wedding);

  return (
    <header className="sticky top-0 z-10 border-b border-[#ede5d9] bg-[#FAF9F7]/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#191714] text-white">
            <Gem size={17} />
          </div>
          <span className="font-display text-lg font-semibold">Wedding OS</span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="text-sm font-medium text-[#777065]">{mode === "vendor" ? "Vendor workspace" : wedding.location}</p>
          <h1 className="truncate font-display text-2xl font-semibold text-[#191714]">
            {mode === "vendor" ? "Golden Lens Photography" : `${wedding.couple}'s Wedding`}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 py-2 sm:flex">
            <Search size={16} className="text-[#9a7a50]" />
            <span className="text-sm text-[#777065]">Search planning, vendors, messages</span>
          </div>
          <button className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#191714]" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <div className="flex size-10 items-center justify-center rounded-full bg-[#c8a97e] text-sm font-bold text-[#191714]">
            {mode === "vendor" ? "GL" : "AM"}
          </div>
        </div>
      </div>
    </header>
  );
}
