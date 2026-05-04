"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "gold" | "green" | "rose" | "ink";
};

const tones = {
  gold: "bg-[#fbf5ec] text-[#8a6332]",
  green: "bg-[#f1f6ef] text-[#42633f]",
  rose: "bg-[#fff4f3] text-[#93484d]",
  ink: "bg-[#191714] text-white",
};

export function MetricCard({ label, value, detail, icon: Icon, tone = "gold" }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-[#ebe4d8] bg-white p-4 luxury-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#777065]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#191714]">{value}</p>
          {detail ? <p className="mt-1 text-sm text-[#777065]">{detail}</p> : null}
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-full", tones[tone])}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}
