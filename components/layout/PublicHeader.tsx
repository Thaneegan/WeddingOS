import Link from "next/link";
import { Gem } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e7dfd3] bg-[#FAF9F7]/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 rounded-full pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a97e]">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#191714] text-white transition group-hover:bg-[#c8a97e] group-hover:text-[#191714]">
            <Gem size={20} />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none text-[#191714]">Wedding OS</span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Back to home</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
