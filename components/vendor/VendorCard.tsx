"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows, Heart, MessageSquarePlus, Star } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addVendorToCompare, createInquiry, saveVendor } from "@/app/actions";
import type { CoreVendorCard, CoreWeddingSummary } from "@/types/core";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";

export function VendorCard({
  vendor,
  saved = false,
  compared = false,
  actionsEnabled = true,
  wedding,
}: {
  vendor: CoreVendorCard;
  saved?: boolean;
  compared?: boolean;
  actionsEnabled?: boolean;
  wedding?: CoreWeddingSummary;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);
  const [isCompared, setIsCompared] = useState(compared);
  const [quoteRequested, setQuoteRequested] = useState(Boolean(vendor.existingInquiry));
  const [pendingAction, setPendingAction] = useState<"quote" | "save" | "compare" | null>(null);
  const [notice, setNotice] = useState("");
  const href = `/marketplace/${vendor.slug}`;
  const latestQuote = vendor.quotes?.[0];
  const quoteMessage = wedding
    ? `Hi ${vendor.name}, we would like a quote and availability for ${wedding.couple}'s ${formatDate(wedding.date)} wedding in ${wedding.location}.`
    : `Hi ${vendor.name}, we would like a quote and availability for our wedding.`;

  const requestQuote = async () => {
    if (!actionsEnabled || quoteRequested) return;
    setPendingAction("quote");
    setNotice("");
    try {
      await createInquiry({
        vendorBusinessId: vendor.id,
        message: quoteMessage,
      });
      setQuoteRequested(true);
      setNotice("Quote requested. A conversation was created in Messages.");
      router.refresh();
    } catch {
      setNotice("Could not request quote. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const toggleSaved = async () => {
    if (!actionsEnabled || pendingAction) return;
    setPendingAction("save");
    setNotice("");
    const previous = isSaved;
    setIsSaved(!previous);
    try {
      const result = await saveVendor({ vendorBusinessId: vendor.id });
      setIsSaved(result.saved);
      setNotice(result.saved ? "Saved to your shortlist." : "Removed from saved vendors.");
      router.refresh();
    } catch {
      setIsSaved(previous);
      setNotice("Could not update saved vendors. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const addToCompare = async () => {
    if (!actionsEnabled || pendingAction) return;
    if (isCompared) {
      router.push("/compare");
      return;
    }

    setPendingAction("compare");
    setNotice("");
    setIsCompared(true);
    try {
      await addVendorToCompare({ vendorBusinessId: vendor.id });
      setNotice("Added to Compare. Open Compare from the sidebar to review side by side.");
      router.refresh();
    } catch {
      setIsCompared(false);
      setNotice("Could not add vendor to Compare. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl border border-[#ebe4d8] bg-white luxury-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#efe8dd]">
        {vendor.image ? (
          <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        ) : (
          <ImagePlaceholder label={vendor.name} className="h-full w-full" />
        )}
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
              onClick={toggleSaved}
              disabled={pendingAction === "save"}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#9a7a50] transition hover:bg-[#fbf5ec] disabled:cursor-wait disabled:opacity-70"
              aria-label={isSaved ? "Unsave vendor" : "Save vendor"}
              title={isSaved ? "Remove from saved vendors" : "Save vendor"}
            >
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
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

        {latestQuote ? (
          <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#7a582c]">Quote {latestQuote.status.toLowerCase()}</span>
              <span className="font-semibold text-[#191714]">{formatCurrency(latestQuote.amount)}</span>
            </div>
            <p className="mt-1 text-xs text-[#6f6a61]">Deposit {formatCurrency(latestQuote.deposit)}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {vendor.styleTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-[#faf7f1] px-2.5 py-1 text-xs font-medium text-[#6f6a61]">
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={href}
            className="flex h-10 items-center justify-center rounded-full bg-[#191714] px-3 text-sm font-semibold text-white transition hover:bg-[#2b2822]"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={requestQuote}
            disabled={pendingAction === "quote" || quoteRequested}
            className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-3 text-sm font-semibold text-[#7a582c] transition hover:bg-[#f4eadb] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageSquarePlus size={15} />
            {quoteRequested ? "Quote requested" : pendingAction === "quote" ? "Sending" : "Quote"}
          </button>
          <button
            type="button"
            onClick={addToCompare}
            disabled={pendingAction === "compare"}
            className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61] transition hover:bg-[#faf9f7] disabled:cursor-wait disabled:opacity-70"
          >
            <GitCompareArrows size={15} />
            {pendingAction === "compare" ? "Adding" : isCompared ? "Open Compare" : "Add to Compare"}
          </button>
        </div>
        {notice ? (
          <div className="rounded-xl border border-[#e7dfd3] bg-[#fffdf9] px-3 py-2 text-xs font-semibold leading-5 text-[#6f6a61]" role="status" aria-live="polite">
            {notice.includes("Messages") ? (
              <>
                Quote requested.{" "}
                <Link href="/messages" className="text-[#8a6332] underline underline-offset-2">
                  Open Messages
                </Link>
              </>
            ) : notice.includes("Compare") ? (
              <>
                Added to Compare.{" "}
                <Link href="/compare" className="text-[#8a6332] underline underline-offset-2">
                  Open Compare
                </Link>
              </>
            ) : (
              notice
            )}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
