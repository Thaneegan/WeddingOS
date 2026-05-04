"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GitCompareArrows, Heart, MessageSquarePlus, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";
import type { Vendor } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const saveVendor = useWeddingStore((state) => state.saveVendor);
  const sendInquiry = useWeddingStore((state) => state.sendInquiry);
  const addVendorToCompare = useWeddingStore((state) => state.addVendorToCompare);
  const saved = useWeddingStore((state) => state.savedVendorIds.includes(vendor.id));
  const compared = useWeddingStore((state) => state.comparisonVendorIds.includes(vendor.id));

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl border border-[#ebe4d8] bg-white luxury-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#efe8dd]">
        <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <StatusBadge tone={vendor.availability === "Available" ? "green" : vendor.availability === "Limited" ? "gold" : "rose"}>
            {vendor.availability}
          </StatusBadge>
          <StatusBadge tone="dark">{vendor.matchScore}% match</StatusBadge>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#9a7a50]">{vendor.category}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#191714]">{vendor.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => saveVendor(vendor.id)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#9a7a50] transition hover:bg-[#fbf5ec]"
              aria-label={saved ? "Unsave vendor" : "Save vendor"}
            >
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="mt-2 text-sm text-[#6f6a61]">{vendor.location}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6f6a61]">
          <span className="inline-flex items-center gap-1 font-semibold text-[#191714]">
            <Star size={15} fill="#C8A97E" stroke="#C8A97E" />
            {vendor.rating}
          </span>
          <span>{vendor.reviewsCount} reviews</span>
          <span>From {formatCurrency(vendor.startingPrice)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {vendor.styleTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-[#faf7f1] px-2.5 py-1 text-xs font-medium text-[#6f6a61]">
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/marketplace/${vendor.id}`}
            className="flex h-10 items-center justify-center rounded-full bg-[#191714] px-3 text-sm font-semibold text-white transition hover:bg-[#2b2822]"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => sendInquiry(vendor.id)}
            className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-3 text-sm font-semibold text-[#7a582c] transition hover:bg-[#f4eadb]"
          >
            <MessageSquarePlus size={15} />
            Quote
          </button>
          <button
            type="button"
            onClick={() => addVendorToCompare(vendor.id)}
            className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61] transition hover:bg-[#faf9f7]"
          >
            <GitCompareArrows size={15} />
            {compared ? "Added to Compare" : "Add to Compare"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
