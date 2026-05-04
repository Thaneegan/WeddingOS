import { cn } from "@/lib/utils";

const toneMap = {
  neutral: "border-[#e7dfd3] bg-white text-[#6f6a61]",
  gold: "border-[#eadcc6] bg-[#fbf5ec] text-[#8a6332]",
  green: "border-[#d6e2d2] bg-[#f3f8f1] text-[#42633f]",
  rose: "border-[#efd5d4] bg-[#fff5f4] text-[#93484d]",
  dark: "border-[#191714] bg-[#191714] text-white",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
