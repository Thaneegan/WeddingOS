"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronDown, GitCompareArrows, Megaphone, Search, SlidersHorizontal, X } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorCard } from "@/components/vendor/VendorCard";
import { VendorCompareClient } from "@/components/vendor/VendorCompareClient";
import type { CoreCategory, CoreVendorCard, CoreWeddingSummary } from "@/types/core";

const gtaKeywords = ["toronto", "scarborough", "markham", "mississauga", "brampton", "vaughan", "richmond hill", "pickering", "ajax"];

export function MarketplaceClient({
  vendors,
  categories,
  savedVendorIds,
  comparisonVendorIds,
  wedding,
  initialQuery = "",
}: {
  vendors: CoreVendorCard[];
  categories: CoreCategory[];
  savedVendorIds: string[];
  comparisonVendorIds: string[];
  wedding?: CoreWeddingSummary;
  initialQuery?: string;
}) {
  const categoryNames = categories.map((item) => item.name);
  const locationOptions = Array.from(new Set(["All locations", "Toronto, ON", "GTA", ...vendors.map((vendor) => vendor.location)])).sort((a, b) => {
    const priority = ["All locations", "Toronto, ON", "GTA"];
    const aPriority = priority.indexOf(a);
    const bPriority = priority.indexOf(b);
    if (aPriority !== -1 || bPriority !== -1) return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority);
    return a.localeCompare(b);
  });
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [location, setLocation] = useState("All locations");
  const [rating, setRating] = useState("Any rating");
  const [price, setPrice] = useState("Any price");
  const [sort, setSort] = useState("match");
  const [showShortlist, setShowShortlist] = useState(false);
  const shortlistedVendors = useMemo(
    () => vendors.filter((vendor) => comparisonVendorIds.includes(vendor.id)),
    [comparisonVendorIds, vendors],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (showShortlist ? shortlistedVendors : vendors)
      .filter((vendor) => selectedCategories.length === 0 || selectedCategories.includes(vendor.category))
      .filter((vendor) => {
        const normalizedLocation = vendor.location.toLowerCase();
        if (location === "All locations") return true;
        if (location === "GTA") return gtaKeywords.some((keyword) => normalizedLocation.includes(keyword));
        return vendor.location === location;
      })
      .filter((vendor) => {
        if (rating === "Rating 4.8+") return vendor.rating >= 4.8;
        if (rating === "Rating 4.5+") return vendor.rating >= 4.5;
        return true;
      })
      .filter((vendor) => {
        if (price === "Under $3,000") return vendor.startingPrice < 3000;
        if (price === "$3,000-$7,500") return vendor.startingPrice >= 3000 && vendor.startingPrice <= 7500;
        if (price === "$7,500+") return vendor.startingPrice > 7500;
        return true;
      })
      .filter((vendor) => {
        const haystack = `${vendor.name} ${vendor.category} ${vendor.location} ${vendor.styleTags.join(" ")}`.toLowerCase();
        return normalizedQuery ? haystack.includes(normalizedQuery) : true;
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.startingPrice - b.startingPrice;
        if (sort === "price-high") return b.startingPrice - a.startingPrice;
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "reviews") return b.reviewsCount - a.reviewsCount;
        return b.matchScore - a.matchScore;
      });
  }, [location, price, query, rating, selectedCategories, shortlistedVendors, showShortlist, sort, vendors]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setLocation("All locations");
    setRating("Any rating");
    setPrice("Any price");
    setSort("match");
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const categoryLabel =
    selectedCategories.length === 0
      ? "All categories"
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : `${selectedCategories.length} categories`;

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeader
        eyebrow="Vendor marketplace"
        title="Find the right wedding team"
        description="Search curated Toronto-area vendors, request quotes, save options, and compare shortlists."
      />
      <section className="mb-6 rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_180px_160px]">
          <div className="flex h-12 items-center gap-3 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4">
            <label htmlFor="marketplace-search" className="sr-only">
              Search vendors
            </label>
            <Search size={18} className="shrink-0 text-[#9a7a50]" />
            <input
              id="marketplace-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by vendor, category, style, or location"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#191714] outline-none placeholder:text-[#777065]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#777065] hover:bg-[#eee7dd] hover:text-[#191714]"
                aria-label="Clear vendor search"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className="flex h-12 w-full items-center justify-between gap-3 rounded-full border border-[#e7dfd3] bg-white px-4 text-left text-sm font-semibold text-[#6f6a61] transition hover:bg-[#faf7f1]"
              aria-expanded={categoryMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="truncate">{categoryLabel}</span>
              <ChevronDown size={16} className={`shrink-0 transition ${categoryMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryMenuOpen ? (
              <div className="absolute left-0 right-0 top-14 z-20 rounded-2xl border border-[#e7dfd3] bg-white p-2 shadow-xl">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#eee7dd] px-2 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Categories</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="rounded-full px-2 py-1 text-xs font-semibold text-[#6f6a61] hover:bg-[#faf7f1] hover:text-[#191714]"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-72 overflow-auto pr-1">
                  {categoryNames.map((item) => {
                    const checked = selectedCategories.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCategory(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#4b463d] hover:bg-[#faf7f1]"
                        role="option"
                        aria-selected={checked}
                      >
                        <span className="truncate">{item}</span>
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-[#191714] bg-[#191714] text-white" : "border-[#d8c5aa] text-transparent"}`}>
                          <Check size={13} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            aria-label="Filter by location"
            className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]"
          >
            {locationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            aria-label="Filter by rating"
            className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]"
          >
            <option>Any rating</option>
            <option>Rating 4.8+</option>
            <option>Rating 4.5+</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_180px_auto_auto_auto] lg:items-center">
          <label className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Filter by price</span>
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="min-w-0 flex-1 cursor-pointer bg-transparent outline-none">
              <option>Any price</option>
              <option>Under $3,000</option>
              <option>$3,000-$7,500</option>
              <option>$7,500+</option>
            </select>
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort vendors"
            className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]"
          >
            <option value="match">Sort by match</option>
            <option value="price-low">Lowest price</option>
            <option value="price-high">Highest price</option>
            <option value="rating">Highest rating</option>
            <option value="reviews">Most reviews</option>
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="h-12 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:bg-[#faf7f1] hover:text-[#191714]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowShortlist((value) => !value)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2822]"
            aria-pressed={showShortlist}
          >
            <GitCompareArrows size={15} />
            {showShortlist ? "All vendors" : "Review shortlist"}
            {!showShortlist ? (
              <span className="min-w-6 rounded-full bg-white/15 px-2 py-0.5 text-center text-xs">{comparisonVendorIds.length}</span>
            ) : null}
          </button>
          <Link
            href="/opportunities"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-4 text-sm font-semibold text-[#7a582c] transition hover:bg-[#f4eadb]"
          >
            <Megaphone size={15} />
            Post need
          </Link>
        </div>
      </section>
      <p className="mb-4 text-sm font-medium text-[#777065]">
        {showShortlist
          ? `Showing ${filtered.length} of ${shortlistedVendors.length} shortlisted vendors`
          : `Showing ${filtered.length} of ${vendors.length} vendors`}
        {query.trim() ? ` for "${query.trim()}"` : ""}
      </p>
      {showShortlist ? (
        filtered.length ? (
          <VendorCompareClient vendors={filtered} embedded />
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center luxury-shadow">
            <p className="font-display text-2xl font-semibold text-[#191714]">No shortlisted vendors match these filters</p>
            <p className="mt-2 text-sm text-[#777065]">Clear filters or add vendors to your shortlist from the marketplace cards.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full bg-[#191714] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => setShowShortlist(false)}
                className="rounded-full border border-[#e7dfd3] bg-white px-5 py-2.5 text-sm font-semibold text-[#6f6a61]"
              >
                View all vendors
              </button>
            </div>
          </div>
        )
      ) : filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              saved={savedVendorIds.includes(vendor.id)}
              compared={comparisonVendorIds.includes(vendor.id)}
              wedding={wedding}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-8 text-center luxury-shadow">
          <p className="font-display text-2xl font-semibold text-[#191714]">No vendors found</p>
          <p className="mt-2 text-sm text-[#777065]">Try a vendor name, category, location, or style tag.</p>
          <button
            type="button"
            onClick={() => {
              resetFilters();
            }}
            className="mt-5 rounded-full bg-[#191714] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reset search
          </button>
        </div>
      )}
    </div>
  );
}
