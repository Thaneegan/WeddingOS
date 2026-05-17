import type { ReactNode } from "react";

export function Tooltip({
  label,
  side = "top",
  children,
}: {
  label: string;
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  const position =
    side === "bottom"
      ? "left-1/2 top-full mt-2 -translate-x-1/2"
      : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`${position} pointer-events-none absolute z-50 whitespace-nowrap rounded-full bg-[#191714] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}
