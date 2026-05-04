import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BudgetCategory, VendorCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function categoryToBudgetCategory(category: VendorCategory): BudgetCategory {
  const map: Record<VendorCategory, BudgetCategory> = {
    Venues: "Venue",
    Photography: "Photography",
    Videography: "Videography",
    Decor: "Decor",
    Florals: "Florals",
    "DJ / Music": "Music",
    Catering: "Catering",
    Makeup: "Makeup",
    Hair: "Hair",
    "Wedding Planner": "Miscellaneous",
    Transportation: "Transportation",
    "Cake / Desserts": "Cake",
    Officiant: "Miscellaneous",
    Invitations: "Invitations",
  };

  return map[category];
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
