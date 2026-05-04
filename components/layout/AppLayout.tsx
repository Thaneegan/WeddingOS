"use client";

import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ children, mode = "couple" }: { children: ReactNode; mode?: "couple" | "vendor" }) {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Sidebar mode={mode} />
      <div className="min-h-screen lg:pl-72">
        <Topbar mode={mode} />
        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav mode={mode} />
    </div>
  );
}
