"use client";

export function ImagePlaceholder({ label, className = "" }: { label: string; className?: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className={`flex items-center justify-center bg-[#efe8dd] ${className}`}>
      <div className="flex size-16 items-center justify-center rounded-full bg-white/80 font-display text-2xl font-semibold text-[#8a6332]">
        {initials || "WO"}
      </div>
    </div>
  );
}
