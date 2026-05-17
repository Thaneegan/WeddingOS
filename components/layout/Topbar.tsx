"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Bell, Gem, HelpCircle, Search, Shuffle, UserRound } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import type { WorkspaceChrome } from "./AppLayout";

const defaults = {
  couple: {
    title: "Wedding workspace",
    subtitle: "Planning portal",
    initials: "WO",
  },
  vendor: {
    title: "Vendor workspace",
    subtitle: "Vendor workspace",
    initials: "WO",
  },
};

export function Topbar({ mode, workspace }: { mode: "couple" | "vendor"; workspace?: WorkspaceChrome }) {
  const current = { ...defaults[mode], ...workspace };
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();
    router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace");
  }

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
          <p className="text-sm font-medium text-[#777065]">{current.subtitle}</p>
          <h1 className="truncate font-display text-2xl font-semibold text-[#191714]">{current.title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <form
            role="search"
            onSubmit={handleSearch}
            className="hidden h-10 w-[min(340px,38vw)] items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 sm:flex"
          >
            <label htmlFor="global-search" className="sr-only">
              Search planning, vendors, messages
            </label>
            <Search size={16} className="shrink-0 text-[#9a7a50]" />
            <input
              id="global-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search planning, vendors, messages"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#191714] outline-none placeholder:text-[#777065]"
            />
          </form>
          <Tooltip label="Notifications" side="bottom">
            <Link href="/notifications" className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#191714]" aria-label="Notifications">
              <Bell size={17} />
            </Link>
          </Tooltip>
          <Tooltip label="Help and FAQ" side="bottom">
            <Link href="/faq" className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#191714]" aria-label="Help and FAQ">
              <HelpCircle size={17} />
            </Link>
          </Tooltip>
          <Tooltip label="Switch workspace" side="bottom">
            <Link href="/workspaces" className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#191714]" aria-label="Switch workspace">
              <Shuffle size={17} />
            </Link>
          </Tooltip>
          <Tooltip label="Account settings" side="bottom">
            <Link href="/account" className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#191714]" aria-label="Account settings">
              <UserRound size={17} />
            </Link>
          </Tooltip>
          <div className="flex size-10 items-center justify-center rounded-full bg-[#c8a97e] text-sm font-bold text-[#191714]">
            {current.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
