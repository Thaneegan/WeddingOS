"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChartNoAxesCombined, CircleDollarSign, Eye, Inbox, Percent, Pencil, Plus, Save, Timer, Trash2, UsersRound } from "lucide-react";
import {
  createVendorAvailabilitySlot,
  createPastWedding,
  createPortfolioItem,
  createReviewRecord,
  createVendorService,
  createVendorFaq,
  deletePastWedding,
  deletePortfolioItem,
  deleteReviewRecord,
  deleteVendorService,
  deleteVendorFaq,
  updateVendorBusiness,
  updateVendorAvailabilitySlot,
  updatePastWedding,
  updatePortfolioItem,
  updateReviewRecord,
  updateVendorService,
  updateVendorFaq,
  updateVendorVisibility,
} from "@/app/actions";
import { CategoryManager } from "@/components/shared/CategoryManager";
import { FileAssetManager } from "@/components/shared/FileAssetManager";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreVendorDashboardData } from "@/types/core";

export function VendorDashboardClient({ data }: { data: CoreVendorDashboardData }) {
  const router = useRouter();
  const [service, setService] = useState({
    name: "",
    categoryId: data.categories[0]?.id ?? "",
    startingPrice: "",
    description: "",
    includes: "",
  });
  const [profile, setProfile] = useState({
    name: data.vendor.name,
    location: data.vendor.location,
    startingPrice: String(data.vendor.startingPrice),
    availability: data.vendor.availability,
    responseTime: data.vendor.responseTime,
    styleTags: data.vendor.styleTags.join(", "),
    socials: data.vendor.socials.join(", "),
    image: data.vendor.image,
    about: data.vendor.about,
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceDraft, setServiceDraft] = useState({
    name: "",
    categoryId: data.categories[0]?.id ?? "",
    startingPrice: "",
    description: "",
    includes: "",
  });
  const [notice, setNotice] = useState("");
  const [portfolioForm, setPortfolioForm] = useState({ title: "", image: "", sortOrder: "0" });
  const [pastWeddingForm, setPastWeddingForm] = useState({ coupleNames: "", venue: "", style: "", image: "" });
  const [reviewForm, setReviewForm] = useState({ author: "", rating: "5", body: "" });
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", sortOrder: "0" });
  const [availabilityForm, setAvailabilityForm] = useState({ date: "", status: "Available", note: "" });
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editingPastWeddingId, setEditingPastWeddingId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Vendor portal" title={data.vendor.name} description="A vendor operating system for profile performance, lead follow-up, client management, and bookings." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile views" value={data.profileViews.toLocaleString("en-CA")} detail="+14% this month" icon={Eye} tone="gold" />
        <MetricCard label="New leads" value={`${data.newLeads}`} detail="Needs response" icon={Inbox} tone="rose" />
        <MetricCard label="Active clients" value={`${data.activeClients}`} detail="Across wedding records" icon={UsersRound} tone="green" />
        <MetricCard label="Upcoming weddings" value={`${data.upcomingWeddings}`} detail="Future event dates" icon={CalendarDays} tone="ink" />
        <MetricCard label="Monthly revenue" value={formatCurrency(data.monthlyRevenue)} detail="Booked and pending" icon={CircleDollarSign} tone="gold" />
        <MetricCard label="Response rate" value={`${data.responseRate}%`} detail="Marketplace benchmark" icon={Timer} tone="green" />
        <MetricCard label="Conversion" value={`${data.conversionRate}%`} detail="Lead to booking" icon={Percent} tone="rose" />
        <MetricCard label="Profile score" value={`${data.profileScore}%`} detail="Add more galleries" icon={ChartNoAxesCombined} tone="ink" />
      </div>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          title="Business profile"
          description="Edit the marketplace profile details couples use to shortlist and request quotes."
          action={
            <button
              onClick={async () => {
                await updateVendorVisibility({ vendorBusinessId: data.vendor.id, visible: !data.vendor.visible });
                setNotice(data.vendor.visible ? "Profile hidden from marketplace." : "Profile visible in marketplace.");
                router.refresh();
              }}
              className="h-10 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61]"
            >
              {data.vendor.visible ? "Hide profile" : "Publish profile"}
            </button>
          }
        />
        {notice ? <p className="mb-4 rounded-2xl border border-[#e5eadf] bg-[#f7fbf4] p-3 text-sm font-semibold text-[#61735f]">{notice}</p> : null}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const startingPrice = Number(profile.startingPrice);
            if (!profile.name.trim() || !profile.location.trim() || !Number.isFinite(startingPrice)) return;
            await updateVendorBusiness({
              vendorBusinessId: data.vendor.id,
              fields: {
                name: profile.name,
                location: profile.location,
                startingPrice,
                availability: profile.availability,
                responseTime: profile.responseTime,
                image: profile.image || null,
                styleTags: profile.styleTags.split(",").map((item) => item.trim()).filter(Boolean),
                socials: profile.socials.split(",").map((item) => item.trim()).filter(Boolean),
                about: profile.about,
              },
            });
            setNotice("Vendor profile saved.");
            router.refresh();
          }}
          className="grid gap-3 lg:grid-cols-2"
        >
          <input value={profile.name} onChange={(event) => setProfile((item) => ({ ...item, name: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Business name" />
          <input value={profile.location} onChange={(event) => setProfile((item) => ({ ...item, location: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Location" />
          <input value={profile.startingPrice} onChange={(event) => setProfile((item) => ({ ...item, startingPrice: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Starting price" inputMode="decimal" />
          <input value={profile.availability} onChange={(event) => setProfile((item) => ({ ...item, availability: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Availability" />
          <input value={profile.responseTime} onChange={(event) => setProfile((item) => ({ ...item, responseTime: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Response time" />
          <input value={profile.image} onChange={(event) => setProfile((item) => ({ ...item, image: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Hero image URL" />
          <input value={profile.styleTags} onChange={(event) => setProfile((item) => ({ ...item, styleTags: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Style tags, comma separated" />
          <input value={profile.socials} onChange={(event) => setProfile((item) => ({ ...item, socials: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" placeholder="Social links, comma separated" />
          <textarea value={profile.about} onChange={(event) => setProfile((item) => ({ ...item, about: event.target.value }))} className="min-h-28 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#c8a97e] lg:col-span-2" placeholder="About the business" />
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white lg:w-fit">
            <Save size={16} />
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          title="Date availability"
          description="Mark specific wedding dates as available, limited, booked, or unavailable so couples see precise availability on your profile."
        />
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!availabilityForm.date) return;
            await createVendorAvailabilitySlot({
              vendorBusinessId: data.vendor.id,
              date: availabilityForm.date,
              status: availabilityForm.status,
              note: availabilityForm.note || undefined,
            });
            setAvailabilityForm({ date: "", status: "Available", note: "" });
            setNotice("Availability saved.");
            router.refresh();
          }}
          className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[170px_180px_1fr_auto]"
        >
          <input
            type="date"
            value={availabilityForm.date}
            onChange={(event) => setAvailabilityForm((item) => ({ ...item, date: event.target.value }))}
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <select
            value={availabilityForm.status}
            onChange={(event) => setAvailabilityForm((item) => ({ ...item, status: event.target.value }))}
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
          >
            <option>Available</option>
            <option>Limited</option>
            <option>Booked</option>
            <option>Unavailable</option>
            <option>Waitlist</option>
          </select>
          <input
            value={availabilityForm.note}
            onChange={(event) => setAvailabilityForm((item) => ({ ...item, note: event.target.value }))}
            placeholder="Note, e.g. available for reception after 5 PM"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
            <Plus size={16} />
            Add date
          </button>
        </form>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.availabilitySlots.map((slot) => (
            <article key={slot.id ?? slot.date} className="rounded-2xl border border-[#eee7dd] bg-[#fbfaf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#191714]">{slot.label}</p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(slot.date)}</p>
                </div>
                <StatusBadge tone={slot.status === "Available" ? "green" : slot.status === "Booked" || slot.status === "Unavailable" ? "rose" : "gold"}>{slot.status}</StatusBadge>
              </div>
              {slot.note ? <p className="mt-3 text-sm leading-5 text-[#6f6a61]">{slot.note}</p> : null}
              {slot.id ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {["Available", "Limited", "Booked", "Unavailable"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={async () => {
                        await updateVendorAvailabilitySlot({ slotId: slot.id!, fields: { status } });
                        router.refresh();
                      }}
                      className="h-9 rounded-full border border-[#e7dfd3] bg-white px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {!data.availabilitySlots.length ? (
            <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-4 text-sm text-[#8b8378]">
              No structured dates yet. Add your next few open and booked dates to improve marketplace filtering.
            </div>
          ) : null}
        </div>
      </section>

      <FileAssetManager
        ownerType="VENDOR_BUSINESS"
        ownerId={data.vendor.id}
        purpose="PORTFOLIO"
        label="Upload portfolio asset"
        description="Attach portfolio media, sample contracts, pricing sheets, or gallery placeholders for this vendor workspace."
        files={data.files}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Recent inquiries" action={<Link href="/vendor/leads" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Open pipeline</Link>} />
          <div className="space-y-3">
            {data.recentLeads.map((lead) => (
              <article key={lead.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] p-4 md:grid-cols-[1fr_120px_120px] md:items-center">
                <div>
                  <p className="font-semibold">{lead.coupleNames}</p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{lead.lastMessage}</p>
                </div>
                <StatusBadge tone={lead.stage === "Booked" ? "green" : lead.stage === "Lost" ? "rose" : "gold"}>{lead.stage}</StatusBadge>
                <p className="text-sm font-semibold">{formatCurrency(lead.estimatedValue)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Upcoming event schedule" />
          <div className="space-y-3">
            {data.upcomingClients.map((client) => (
              <article key={client.id} className="rounded-2xl bg-[#faf7f1] p-4">
                <p className="font-semibold">{client.coupleNames}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">
                  {formatDate(client.weddingDate)} - {client.packageName}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
            <p className="font-semibold">Improve profile</p>
            <p className="mt-1 text-sm leading-6 text-[#6f6a61]">Add two more South Asian fusion galleries to improve match quality for Toronto couples.</p>
          </div>
        </section>
      </div>
      <CategoryManager
        type="vendor_service"
        title="Manage service categories"
        description="Add vendor-specific services such as live painting, content creation, drone coverage, mehndi, or specialty cultural services without waiting on a platform taxonomy update."
        categories={data.categories}
        ownerId={data.vendor.id}
      />
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader title="Manage services" description="Create and remove vendor offerings that appear on the marketplace profile." />
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const startingPrice = Number(service.startingPrice);
            if (!service.name.trim() || !service.categoryId || !Number.isFinite(startingPrice)) return;
            await createVendorService({
              vendorBusinessId: data.vendor.id,
              categoryId: service.categoryId,
              name: service.name,
              description: service.description || `${service.name} service package.`,
              startingPrice,
              includes: service.includes.split(",").map((item) => item.trim()).filter(Boolean),
            });
            setService({ name: "", categoryId: data.categories[0]?.id ?? "", startingPrice: "", description: "", includes: "" });
            router.refresh();
          }}
          className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[1fr_220px_150px_auto]"
        >
          <input
            value={service.name}
            onChange={(event) => setService((item) => ({ ...item, name: event.target.value }))}
            placeholder="Service name"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <select
            value={service.categoryId}
            onChange={(event) => setService((item) => ({ ...item, categoryId: event.target.value }))}
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
          >
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={service.startingPrice}
            onChange={(event) => setService((item) => ({ ...item, startingPrice: event.target.value }))}
            placeholder="Price"
            inputMode="decimal"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <input
            value={service.description}
            onChange={(event) => setService((item) => ({ ...item, description: event.target.value }))}
            placeholder="Description"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e] lg:col-span-2"
          />
          <input
            value={service.includes}
            onChange={(event) => setService((item) => ({ ...item, includes: event.target.value }))}
            placeholder="Includes, comma separated"
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
            <Plus size={16} />
            Add
          </button>
        </form>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.services.map((item) => {
            const editing = editingServiceId === item.id;
            return (
              <article key={item.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                {editing ? (
                  <div className="space-y-3">
                    <input value={serviceDraft.name} onChange={(event) => setServiceDraft((draft) => ({ ...draft, name: event.target.value }))} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                    <select value={serviceDraft.categoryId} onChange={(event) => setServiceDraft((draft) => ({ ...draft, categoryId: event.target.value }))} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                      {data.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <input value={serviceDraft.startingPrice} onChange={(event) => setServiceDraft((draft) => ({ ...draft, startingPrice: event.target.value }))} inputMode="decimal" className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                    <input value={serviceDraft.description} onChange={(event) => setServiceDraft((draft) => ({ ...draft, description: event.target.value }))} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                    <input value={serviceDraft.includes} onChange={(event) => setServiceDraft((draft) => ({ ...draft, includes: event.target.value }))} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const startingPrice = Number(serviceDraft.startingPrice);
                          if (!serviceDraft.name.trim() || !Number.isFinite(startingPrice)) return;
                          await updateVendorService({
                            serviceId: item.id,
                            fields: {
                              name: serviceDraft.name,
                              categoryId: serviceDraft.categoryId,
                              startingPrice,
                              description: serviceDraft.description,
                              includes: serviceDraft.includes.split(",").map((value) => value.trim()).filter(Boolean),
                            },
                          });
                          setEditingServiceId(null);
                          router.refresh();
                        }}
                        className="flex h-9 items-center gap-2 rounded-full bg-[#191714] px-3 text-xs font-semibold text-white"
                      >
                        <Save size={14} />
                        Save
                      </button>
                      <button onClick={() => setEditingServiceId(null)} className="h-9 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">
                        {item.category} - {formatCurrency(item.startingPrice)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{item.description}</p>
                      {item.includes.length ? <p className="mt-2 text-xs font-semibold text-[#9a7a50]">{item.includes.join(" / ")}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingServiceId(item.id);
                          setServiceDraft({
                            name: item.name,
                            categoryId: item.categoryId,
                            startingPrice: String(item.startingPrice),
                            description: item.description,
                            includes: item.includes.join(", "),
                          });
                        }}
                        className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      {item.linkedRecords ? (
                        <span className="rounded-full border border-[#e7dfd3] px-3 py-2 text-xs font-semibold text-[#6f6a61]">
                          In use
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            await deleteVendorService({ serviceId: item.id });
                            router.refresh();
                          }}
                          className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Portfolio gallery" description="Gallery cards power the public vendor profile." />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!portfolioForm.title.trim() || !portfolioForm.image.trim()) return;
              if (editingPortfolioId) {
                await updatePortfolioItem({
                  portfolioItemId: editingPortfolioId,
                  fields: {
                    title: portfolioForm.title,
                    image: portfolioForm.image,
                    sortOrder: Number(portfolioForm.sortOrder) || 0,
                  },
                });
              } else {
                await createPortfolioItem({
                  vendorBusinessId: data.vendor.id,
                  title: portfolioForm.title,
                  image: portfolioForm.image,
                  sortOrder: Number(portfolioForm.sortOrder) || 0,
                });
              }
              setPortfolioForm({ title: "", image: "", sortOrder: "0" });
              setEditingPortfolioId(null);
              router.refresh();
            }}
            className="mb-4 grid gap-3 lg:grid-cols-[1fr_1fr_90px_auto]"
          >
            <input value={portfolioForm.title} onChange={(event) => setPortfolioForm((item) => ({ ...item, title: event.target.value }))} placeholder="Title" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <input value={portfolioForm.image} onChange={(event) => setPortfolioForm((item) => ({ ...item, image: event.target.value }))} placeholder="Image URL" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <input value={portfolioForm.sortOrder} onChange={(event) => setPortfolioForm((item) => ({ ...item, sortOrder: event.target.value }))} placeholder="Order" inputMode="numeric" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <button className="h-10 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">{editingPortfolioId ? "Save" : "Add"}</button>
          </form>
          <div className="space-y-3">
            {data.portfolioItems.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-[#6f6a61]">{item.image}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPortfolioId(item.id);
                      setPortfolioForm({ title: item.title, image: item.image, sortOrder: String(item.sortOrder) });
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={async () => {
                      await deletePortfolioItem({ portfolioItemId: item.id });
                      router.refresh();
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Past weddings" description="Show proof of work and relevant styles on your public profile." />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!pastWeddingForm.coupleNames.trim() || !pastWeddingForm.venue.trim() || !pastWeddingForm.image.trim()) return;
              if (editingPastWeddingId) {
                await updatePastWedding({ pastWeddingId: editingPastWeddingId, fields: { ...pastWeddingForm, style: pastWeddingForm.style || "Wedding" } });
              } else {
                await createPastWedding({ vendorBusinessId: data.vendor.id, ...pastWeddingForm, style: pastWeddingForm.style || "Wedding" });
              }
              setPastWeddingForm({ coupleNames: "", venue: "", style: "", image: "" });
              setEditingPastWeddingId(null);
              router.refresh();
            }}
            className="mb-4 grid gap-3 lg:grid-cols-2"
          >
            <input value={pastWeddingForm.coupleNames} onChange={(event) => setPastWeddingForm((item) => ({ ...item, coupleNames: event.target.value }))} placeholder="Couple names" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <input value={pastWeddingForm.venue} onChange={(event) => setPastWeddingForm((item) => ({ ...item, venue: event.target.value }))} placeholder="Venue" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <input value={pastWeddingForm.style} onChange={(event) => setPastWeddingForm((item) => ({ ...item, style: event.target.value }))} placeholder="Style" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <input value={pastWeddingForm.image} onChange={(event) => setPastWeddingForm((item) => ({ ...item, image: event.target.value }))} placeholder="Image URL" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <button className="h-10 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white lg:w-fit">{editingPastWeddingId ? "Save wedding" : "Add wedding"}</button>
          </form>
          <div className="space-y-3">
            {data.pastWeddings.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <div>
                  <p className="font-semibold">{item.coupleNames}</p>
                  <p className="mt-1 text-xs text-[#6f6a61]">{item.venue} - {item.style}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPastWeddingId(item.id);
                      setPastWeddingForm({ coupleNames: item.coupleNames, venue: item.venue, style: item.style, image: item.image });
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                    aria-label={`Edit ${item.coupleNames}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={async () => {
                      await deletePastWedding({ pastWeddingId: item.id });
                      router.refresh();
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                    aria-label={`Delete ${item.coupleNames}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="Reviews" description="Add testimonials and ratings from completed weddings." />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!reviewForm.author.trim() || !reviewForm.body.trim()) return;
              const payload = { author: reviewForm.author, rating: Number(reviewForm.rating) || 5, body: reviewForm.body };
              if (editingReviewId) {
                await updateReviewRecord({ reviewId: editingReviewId, fields: payload });
              } else {
                await createReviewRecord({ vendorBusinessId: data.vendor.id, ...payload });
              }
              setReviewForm({ author: "", rating: "5", body: "" });
              setEditingReviewId(null);
              router.refresh();
            }}
            className="mb-4 grid gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
              <input value={reviewForm.author} onChange={(event) => setReviewForm((item) => ({ ...item, author: event.target.value }))} placeholder="Author" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
              <input value={reviewForm.rating} onChange={(event) => setReviewForm((item) => ({ ...item, rating: event.target.value }))} inputMode="numeric" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
              <button className="h-10 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">{editingReviewId ? "Save review" : "Add review"}</button>
            </div>
            <textarea value={reviewForm.body} onChange={(event) => setReviewForm((item) => ({ ...item, body: event.target.value }))} placeholder="Review text" className="min-h-20 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-3 py-2 text-sm" />
          </form>
          <div className="space-y-3">
            {data.reviews.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.author} - {item.rating}/5</p>
                    <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{item.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingReviewId(item.id);
                        setReviewForm({ author: item.author, rating: String(item.rating), body: item.body });
                      }}
                      className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                      aria-label={`Edit review from ${item.author}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={async () => {
                        await deleteReviewRecord({ reviewId: item.id });
                        router.refresh();
                      }}
                      className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                      aria-label={`Delete review from ${item.author}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <SectionHeader title="FAQs" description="Answer common buyer questions on the vendor profile." />
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
              const payload = { question: faqForm.question, answer: faqForm.answer, sortOrder: Number(faqForm.sortOrder) || 0 };
              if (editingFaqId) {
                await updateVendorFaq({ faqId: editingFaqId, fields: payload });
              } else {
                await createVendorFaq({ vendorBusinessId: data.vendor.id, ...payload });
              }
              setFaqForm({ question: "", answer: "", sortOrder: "0" });
              setEditingFaqId(null);
              router.refresh();
            }}
            className="mb-4 grid gap-3"
          >
            <input value={faqForm.question} onChange={(event) => setFaqForm((item) => ({ ...item, question: event.target.value }))} placeholder="Question" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" />
            <textarea value={faqForm.answer} onChange={(event) => setFaqForm((item) => ({ ...item, answer: event.target.value }))} placeholder="Answer" className="min-h-20 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-3 py-2 text-sm" />
            <button className="h-10 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white sm:w-fit">{editingFaqId ? "Save FAQ" : "Add FAQ"}</button>
          </form>
          <div className="space-y-3">
            {data.faqs.map((item) => (
              <article key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <div>
                  <p className="font-semibold">{item.question}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{item.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFaqId(item.id);
                      setFaqForm({ question: item.question, answer: item.answer, sortOrder: String(item.sortOrder) });
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                    aria-label={`Edit FAQ ${item.question}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteVendorFaq({ faqId: item.id });
                      router.refresh();
                    }}
                    className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                    aria-label={`Delete FAQ ${item.question}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
