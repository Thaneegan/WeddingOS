"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AtSign, CalendarDays, CheckCircle2, ExternalLink, GitCompareArrows, Heart, MessageSquareText, ShieldCheck, Star } from "lucide-react";
import { acceptVendorQuote, addVendorToCompare, createInquiry, saveVendor } from "@/app/actions";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreVendorProfile } from "@/types/core";

function parseSocialLink(raw: string) {
  const [labelPart, urlPart, notePart] = raw.split("|").map((item) => item.trim());
  const isUrl = /^https?:\/\//i.test(raw);
  const label = urlPart ? labelPart : isUrl ? "Website" : raw;
  const url = urlPart || (isUrl ? raw : "");
  const note = notePart || "";
  const handle = url.includes("instagram.com/")
    ? url
        .split("instagram.com/")[1]
        ?.split(/[/?#]/)[0]
        ?.replace(/^@/, "")
    : undefined;

  return { label, url, note, handle };
}

function InstagramProfileEmbed({
  profile,
  vendorName,
}: {
  profile: ReturnType<typeof parseSocialLink>;
  vendorName: string;
}) {
  useEffect(() => {
    const processEmbed = () => {
      const instagram = (window as unknown as { instgrm?: { Embeds?: { process?: () => void } } }).instgrm;
      instagram?.Embeds?.process?.();
    };

    const existingScript = document.getElementById("instagram-embed-script");
    if (existingScript) {
      processEmbed();
      return;
    }

    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = processEmbed;
    document.body.appendChild(script);
  }, [profile.url]);

  return (
    <div className="space-y-4 p-5">
      <div className="overflow-hidden rounded-2xl border border-[#eee7dd] bg-[#fbfaf8] p-2 [&_.instagram-media]:!max-w-none [&_.instagram-media]:!min-w-0 [&_.instagram-media]:!w-full [&_iframe]:!max-w-none [&_iframe]:!min-w-0 [&_iframe]:!w-full">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={profile.url}
          data-instgrm-version="14"
          style={{
            background: "#fff",
            border: 0,
            borderRadius: 16,
            margin: "0 auto",
            maxWidth: "none",
            minWidth: 0,
            padding: 0,
            width: "100%",
          }}
        >
          <a href={profile.url} target="_blank" rel="noreferrer">
            View {vendorName} on Instagram
          </a>
        </blockquote>
      </div>
      <p className="text-xs leading-5 text-[#777065]">
        Instagram renders public profiles here when the profile owner has embeds enabled. If the embedded profile does not load, open the live profile directly.
      </p>
      <a
        href={profile.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2822]"
      >
        Open Instagram
        <ExternalLink size={15} />
      </a>
    </div>
  );
}

export function VendorProfile({ vendor }: { vendor: CoreVendorProfile | null }) {
  const router = useRouter();
  const [quotePending, startQuoteTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [comparePending, startCompareTransition] = useTransition();
  const [acceptPending, startAcceptTransition] = useTransition();
  const [depositDueDate, setDepositDueDate] = useState("");
  const [notice, setNotice] = useState("");

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

  const quoteMessage = `Hi ${vendor.name}, we are planning ${vendor.wedding.couple}'s ${formatDate(vendor.wedding.date)} wedding in ${vendor.wedding.location}. Could you send a quote and availability?`;
  const socialLinks = vendor.socials.map(parseSocialLink);
  const instagramProfile = socialLinks.find((item) => item.handle || item.label.toLowerCase().includes("instagram"));
  const latestQuote = vendor.quotes?.[0];
  const quoteAccepted = latestQuote?.status.toLowerCase() === "accepted";

  const requestQuote = (goToMessages = false) => {
    startQuoteTransition(async () => {
      if (!vendor.existingInquiry) {
        await createInquiry({
          vendorBusinessId: vendor.id,
          serviceId: vendor.services[0]?.id,
          message: quoteMessage,
        });
      }

      if (goToMessages) {
        router.push("/messages");
      } else {
        setNotice("Quote request sent. This vendor now appears in messages and the vendor lead pipeline.");
        router.refresh();
      }
    });
  };

  return (
    <PageWrapper>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[360px] bg-[#efe8dd]">
              {vendor.image ? (
                <img src={vendor.image} alt={vendor.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <ImagePlaceholder label={vendor.name} className="absolute inset-0 h-full w-full" />
              )}
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
                  disabled={quotePending || vendor.existingInquiry}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:bg-[#2b2822] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCircle2 size={17} />
                  {vendor.existingInquiry ? "Quote Requested" : quotePending ? "Sending quote" : "Request Quote"}
                </button>
                <button
                  type="button"
                  onClick={() => requestQuote(true)}
                  disabled={quotePending}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-5 text-sm font-semibold text-[#7a582c]"
                >
                  <MessageSquareText size={17} />
                  Message Vendor
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startSaveTransition(async () => {
                      await saveVendor({ vendorBusinessId: vendor.id });
                      setNotice(vendor.saved ? "Vendor removed from saved list." : "Vendor saved to your shortlist.");
                      router.refresh();
                    })
                  }
                  disabled={savePending}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Heart size={17} />
                  {savePending ? "Saving" : vendor.saved ? "Saved" : "Save Vendor"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startCompareTransition(async () => {
                      await addVendorToCompare({ vendorBusinessId: vendor.id });
                      setNotice("Vendor added to compare.");
                      router.refresh();
                    })
                  }
                  disabled={comparePending}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] text-sm font-semibold text-[#6f6a61] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <GitCompareArrows size={17} />
                  {comparePending ? "Adding" : vendor.compared ? "In Compare" : "Compare"}
                </button>
              </div>
              {notice || vendor.existingInquiry ? (
                <div className="mt-4 rounded-2xl border border-[#d6e2d2] bg-[#f3f8f1] p-4 text-sm font-medium text-[#42633f]">
                  {notice || "Quote already requested. Open Messages to continue the conversation."}
                </div>
              ) : null}
              {latestQuote ? (
                <div className="mt-4 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Quote received</p>
                    <StatusBadge tone={quoteAccepted ? "green" : "gold"}>{latestQuote.status}</StatusBadge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#6f6a61]">Total</span>
                      <span className="font-semibold">{formatCurrency(latestQuote.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#6f6a61]">Deposit</span>
                      <span className="font-semibold">{formatCurrency(latestQuote.deposit)}</span>
                    </div>
                  </div>
                  {latestQuote.notes ? <p className="mt-3 text-sm leading-6 text-[#6f6a61]">{latestQuote.notes}</p> : null}
                  <label className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">
                    Deposit due date
                    <input
                      type="date"
                      value={depositDueDate || latestQuote.dueDate?.slice(0, 10) || ""}
                      onChange={(event) => setDepositDueDate(event.target.value)}
                      disabled={quoteAccepted}
                      className="h-10 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#191714] outline-none focus:border-[#c8a97e] disabled:opacity-60"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      startAcceptTransition(async () => {
                        await acceptVendorQuote({
                          quoteId: latestQuote.id,
                          depositDueDate: depositDueDate || latestQuote.dueDate || undefined,
                        });
                        setNotice("Quote accepted. Booking, budget, deposit, and contract records were created.");
                        router.refresh();
                      })
                    }
                    disabled={acceptPending || quoteAccepted}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2822] disabled:cursor-not-allowed disabled:bg-[#bfb6aa]"
                  >
                    <ShieldCheck size={16} />
                    {quoteAccepted ? "Quote accepted" : acceptPending ? "Creating booking" : "Accept quote"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Packages" description="Package options with realistic pricing and inclusions." />
              <div className="grid gap-4 md:grid-cols-2">
                {vendor.services.map((item) => (
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
                      {wedding.image ? (
                        <img src={wedding.image} alt={`${wedding.couple} wedding`} className="h-44 w-full object-cover" />
                      ) : (
                        <ImagePlaceholder label={wedding.couple} className="h-44 w-full" />
                      )}
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

            {instagramProfile?.url ? (
              <div className="overflow-hidden rounded-2xl border border-[#e7dfd3] bg-white luxury-shadow">
                <div className="bg-[#191714] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8c5aa]">Instagram profile</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold">@{instagramProfile.handle ?? vendor.name}</h2>
                    </div>
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <AtSign size={20} />
                    </div>
                  </div>
                  {instagramProfile.note ? <p className="mt-4 text-sm leading-6 text-white/75">{instagramProfile.note}</p> : null}
                </div>
                <div>
                  <InstagramProfileEmbed profile={instagramProfile} vendorName={vendor.name} />
                  <div className="space-y-3 p-5 pt-0">
                    {socialLinks
                      .filter((item) => item.url && item.url !== instagramProfile.url)
                      .map((item) => (
                        <a
                          key={`${item.label}-${item.url}`}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:bg-[#faf7f1]"
                        >
                          {item.label}
                          <ExternalLink size={14} />
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}
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
              <SectionHeader title="Availability" description="Preview of high-demand Saturdays around your wedding date." />
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
                {vendor.availabilityPreview.map((slot) => (
                  <div key={slot.date} className="flex items-center justify-between gap-3 rounded-xl bg-[#faf7f1] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#9a7a50]">
                        <CalendarDays size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#191714]">{slot.label}</p>
                        {slot.note ? <p className="truncate text-xs text-[#777065]">{slot.note}</p> : null}
                      </div>
                    </div>
                    <StatusBadge tone={slot.status === "Available" ? "green" : slot.status === "Limited" ? "gold" : "rose"}>{slot.status}</StatusBadge>
                  </div>
                ))}
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
