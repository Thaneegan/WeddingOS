"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, GitCompareArrows, Heart, MessageSquareText, Star } from "lucide-react";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export function VendorProfile({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const vendor = useWeddingStore((state) => state.vendors.find((item) => item.id === vendorId));
  const sendInquiry = useWeddingStore((state) => state.sendInquiry);
  const saveVendor = useWeddingStore((state) => state.saveVendor);
  const addVendorToCompare = useWeddingStore((state) => state.addVendorToCompare);
  const saved = useWeddingStore((state) => state.savedVendorIds.includes(vendorId));
  const hasLead = useWeddingStore((state) => state.leads.some((lead) => lead.vendorId === vendorId && lead.coupleNames === state.wedding.couple));

  if (!vendor) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#e7dfd3] bg-white p-8 text-center luxury-shadow">
          <h1 className="font-display text-3xl font-semibold">Vendor not found</h1>
          <Link href="/marketplace" className="mt-5 inline-flex rounded-full bg-[#191714] px-5 py-3 text-sm font-semibold text-white">
            Back to marketplace
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const requestQuote = (goToMessages = false) => {
    sendInquiry(vendor.id);
    if (goToMessages) {
      router.push("/messages");
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[360px] bg-[#efe8dd]">
              <img src={vendor.image} alt={vendor.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                <StatusBadge tone="dark">{vendor.matchScore}% match</StatusBadge>
                <StatusBadge tone="green">{vendor.availability}</StatusBadge>
                <StatusBadge tone="gold">Responds in {vendor.responseTime}</StatusBadge>
              </div>
            </div>
            <div className="flex flex-col justify-between p-5 sm:p-7">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">{vendor.category}</p>
                <h1 className="mt-3 font-display text-4xl font-semibold text-[#191714] sm:text-5xl">{vendor.name}</h1>
                <p className="mt-3 text-[#6f6a61]">{vendor.location}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Star size={16} fill="#C8A97E" stroke="#C8A97E" />
                    {vendor.rating}
                  </span>
                  <span className="text-[#6f6a61]">{vendor.reviewsCount} reviews</span>
                  <span className="font-semibold">From {formatCurrency(vendor.startingPrice)}</span>
                </div>
                <p className="mt-5 leading-7 text-[#4b463d]">{vendor.about}</p>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => requestQuote(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:bg-[#2b2822]"
                >
                  <CheckCircle2 size={17} />
                  {hasLead ? "Quote Requested" : "Request Quote"}
                </button>
                <button
                  type="button"
                  onClick={() => requestQuote(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-5 text-sm font-semibold text-[#7a582c]"
                >
                  <MessageSquareText size={17} />
                  Message Vendor
                </button>
                <button
                  type="button"
                  onClick={() => saveVendor(vendor.id)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61]"
                >
                  <Heart size={17} fill={saved ? "currentColor" : "none"} />
                  {saved ? "Saved" : "Save Vendor"}
                </button>
                <button
                  type="button"
                  onClick={() => addVendorToCompare(vendor.id)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61]"
                >
                  <GitCompareArrows size={17} />
                  Compare
                </button>
              </div>
              {hasLead ? (
                <div className="mt-4 rounded-2xl border border-[#d6e2d2] bg-[#f3f8f1] p-4 text-sm font-medium text-[#42633f]">
                  Inquiry created. It now appears in vendor leads and messages.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Packages" description="Investor demo packages with realistic pricing and inclusions." />
              <div className="grid gap-4 md:grid-cols-2">
                {vendor.packages.map((item) => (
                  <article key={item.name} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-5">
                    <p className="text-lg font-semibold">{item.name}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#9a7a50]">{formatCurrency(item.price)}</p>
                    <p className="mt-3 text-sm leading-6 text-[#6f6a61]">{item.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-[#4b463d]">
                      {item.includes.map((include) => (
                        <li key={include} className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#61735f]" />
                          {include}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Past weddings" />
              <div className="grid gap-4 sm:grid-cols-2">
                {vendor.pastWeddings.length ? (
                  vendor.pastWeddings.map((wedding) => (
                    <article key={wedding.id} className="overflow-hidden rounded-2xl border border-[#eee7dd]">
                      <img src={wedding.image} alt={`${wedding.couple} wedding`} className="h-44 w-full object-cover" />
                      <div className="p-4">
                        <p className="font-semibold">{wedding.couple}</p>
                        <p className="mt-1 text-sm text-[#6f6a61]">{wedding.venue}</p>
                        <p className="mt-2 text-sm text-[#9a7a50]">{wedding.style}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-6 text-sm text-[#6f6a61]">Portfolio galleries are being curated for this vendor.</div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Reviews" />
              <div className="space-y-4">
                {vendor.reviews.length ? (
                  vendor.reviews.map((review) => (
                    <article key={review.id} className="border-b border-[#eee7dd] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Star size={15} fill="#C8A97E" stroke="#C8A97E" />
                        <span className="font-semibold">{review.rating}.0</span>
                        <span className="text-sm text-[#6f6a61]">{review.author}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#4b463d]">{review.body}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[#6f6a61]">Reviews will appear here as couples submit feedback.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Availability" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-[#faf7f1] p-3">
                  <span>July 18, 2026</span>
                  <StatusBadge tone={vendor.availability === "Available" ? "green" : "gold"}>{vendor.availability}</StatusBadge>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#faf7f1] p-3">
                  <span>Consultation</span>
                  <span className="font-semibold">This week</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#faf7f1] p-3">
                  <span>Typical response</span>
                  <span className="font-semibold">{vendor.responseTime}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="FAQs" />
              <div className="space-y-4">
                {vendor.faqs.map((faq) => (
                  <div key={faq.question}>
                    <p className="font-semibold">{faq.question}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </PageWrapper>
  );
}
