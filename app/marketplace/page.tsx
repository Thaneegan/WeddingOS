"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorCard } from "@/components/vendor/VendorCard";
import { useWeddingStore } from "@/store/useWeddingStore";
import type { VendorCategory } from "@/types";

const categories: ("All" | VendorCategory)[] = [
  "All",
  "Venues",
  "Photography",
  "Videography",
  "Decor",
  "Florals",
  "DJ / Music",
  "Catering",
  "Makeup",
  "Hair",
  "Wedding Planner",
  "Transportation",
  "Cake / Desserts",
  "Officiant",
  "Invitations",
];

export default function MarketplacePage() {
  const vendors = useWeddingStore((state) => state.vendors);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    return vendors
      .filter((vendor) => category === "All" || vendor.category === category)
      .filter((vendor) => {
        const haystack = `${vendor.name} ${vendor.category} ${vendor.location} ${vendor.styleTags.join(" ")}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [category, query, vendors]);

  return (
    <AppLayout>
      <PageWrapper>
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Vendor marketplace"
            title="Find the right wedding team"
            description="Search curated Toronto-area vendors, request quotes, save options, and compare shortlists."
          />
          <section className="mb-6 rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
              <label className="flex h-12 items-center gap-3 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4">
                <Search size={18} className="text-[#9a7a50]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by vendor, category, style, or location"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <select className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]">
                <option>Toronto, ON</option>
                <option>GTA</option>
              </select>
              <select className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]">
                <option>Rating 4.5+</option>
                <option>Any rating</option>
              </select>
              <select className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]">
                <option>Sort by match</option>
                <option>Lowest price</option>
              </select>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold ${category === item ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61]"}`}
                >
                  {item}
                </button>
              ))}
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd3] px-3.5 py-2 text-sm font-semibold text-[#6f6a61]">
                <SlidersHorizontal size={15} />
                Price filters
              </span>
            </div>
          </section>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
