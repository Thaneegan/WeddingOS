"use client";

import { create } from "zustand";
import {
  budgetItems as initialBudgetItems,
  categories as initialCategories,
  clientRecords as initialClientRecords,
  conversations as initialConversations,
  guests as initialGuests,
  leads as initialLeads,
  messages as initialMessages,
  timelineTasks as initialTimelineTasks,
  vendors as initialVendors,
  weddingDetails,
} from "@/lib/fallbackData";
import { categoryToBudgetCategory } from "@/lib/utils";
import type {
  AIPlan,
  BudgetItem,
  CategorySummary,
  CategoryType,
  Conversation,
  Guest,
  Lead,
  LeadStage,
  Message,
  TimelineTask,
  Vendor,
  WeddingDetails,
  ClientRecord,
} from "@/types";

type WeddingStore = {
  wedding: WeddingDetails;
  categories: CategorySummary[];
  vendors: Vendor[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  tasks: TimelineTask[];
  leads: Lead[];
  clientRecords: ClientRecord[];
  conversations: Conversation[];
  messages: Message[];
  bookedVendorIds: string[];
  savedVendorIds: string[];
  comparisonVendorIds: string[];
  aiPlan?: AIPlan;
  sendInquiry: (vendorId: string) => string | undefined;
  sendMessage: (conversationId: string, text: string, from: "couple" | "vendor") => void;
  moveLeadStage: (leadId: string, stage: LeadStage) => void;
  sendProposal: (leadId: string) => void;
  bookVendor: (leadId: string) => void;
  saveVendor: (vendorId: string) => void;
  addVendorToCompare: (vendorId: string) => void;
  removeVendorFromCompare: (vendorId: string) => void;
  updateRSVPGuest: (guestId: string, updates: Partial<Guest>) => void;
  completeTask: (taskId: string) => void;
  generateAIPlan: () => void;
  createCustomCategory: (input: { name: string; type: CategoryType; color?: string; icon?: string }) => CategorySummary;
  archiveCategory: (categoryId: string) => void;
  addBudgetItem: (input: { category: string; label: string; amount: number; dueDate?: string }) => void;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createConversation(vendor: Vendor): Conversation {
  return {
    id: uid("conversation"),
    vendorId: vendor.id,
    vendorName: vendor.name,
    coupleName: weddingDetails.couple,
    unreadForCouple: 0,
    unreadForVendor: 1,
  };
}

export const useWeddingStore = create<WeddingStore>((set, get) => ({
  wedding: weddingDetails,
  categories: initialCategories,
  vendors: initialVendors,
  budgetItems: initialBudgetItems,
  guests: initialGuests,
  tasks: initialTimelineTasks,
  leads: initialLeads,
  clientRecords: initialClientRecords,
  conversations: initialConversations,
  messages: initialMessages,
  bookedVendorIds: ["maison-etoile-venue", "saffron-sage-catering", "luxe-mandap-decor"],
  savedVendorIds: ["golden-lens-photography", "ivory-bloom-florals", "velvet-hour-films"],
  comparisonVendorIds: ["golden-lens-photography", "ivory-bloom-florals", "velvet-hour-films"],

  sendInquiry: (vendorId) => {
    const state = get();
    const vendor = state.vendors.find((item) => item.id === vendorId);
    if (!vendor) return undefined;

    let conversation = state.conversations.find((item) => item.vendorId === vendorId);
    const leadExists = state.leads.some(
      (lead) => lead.vendorId === vendorId && lead.coupleNames === state.wedding.couple,
    );

    if (!conversation) {
      conversation = createConversation(vendor);
    }

    const message: Message = {
      id: uid("message"),
      conversationId: conversation.id,
      sender: "couple",
      senderName: "Maya",
      body: `Hi ${vendor.name}, we are planning a ${state.wedding.style.toLowerCase()} wedding in ${state.wedding.location} for ${state.wedding.guestCount} guests. Could you send a quote and availability for ${state.wedding.date}?`,
      timestamp: nowIso(),
    };

    const lead: Lead = {
      id: uid("lead"),
      vendorId: vendor.id,
      coupleNames: state.wedding.couple,
      weddingDate: state.wedding.date,
      budget: state.wedding.budget,
      location: state.wedding.location,
      guestCount: state.wedding.guestCount,
      serviceRequested: vendor.category,
      lastMessage: message.body,
      stage: "New Inquiry",
      estimatedValue: vendor.startingPrice,
      createdAt: nowIso(),
    };

    set({
      conversations: state.conversations.some((item) => item.id === conversation.id)
        ? state.conversations
        : [conversation, ...state.conversations],
      messages: [...state.messages, message],
      leads: leadExists ? state.leads : [lead, ...state.leads],
    });

    return conversation.id;
  },

  sendMessage: (conversationId, text, from) => {
    const state = get();
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || !text.trim()) return;

    const senderName = from === "couple" ? "Maya" : conversation.vendorName;
    const message: Message = {
      id: uid("message"),
      conversationId,
      sender: from,
      senderName,
      body: text.trim(),
      timestamp: nowIso(),
    };

    set({
      messages: [...state.messages, message],
      conversations: state.conversations.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              unreadForCouple: from === "vendor" ? item.unreadForCouple + 1 : item.unreadForCouple,
              unreadForVendor: from === "couple" ? item.unreadForVendor + 1 : item.unreadForVendor,
            }
          : item,
      ),
      leads: state.leads.map((lead) =>
        lead.vendorId === conversation.vendorId && lead.coupleNames === state.wedding.couple
          ? { ...lead, lastMessage: message.body }
          : lead,
      ),
    });
  },

  moveLeadStage: (leadId, stage) => {
    const state = get();
    const lead = state.leads.find((item) => item.id === leadId);
    if (!lead) return;

    let nextMessages = state.messages;
    const conversation = state.conversations.find(
      (item) => item.vendorId === lead.vendorId && item.coupleName === lead.coupleNames,
    );

    if (stage === "Proposal Sent" && conversation) {
      nextMessages = [
        ...nextMessages,
        {
          id: uid("message"),
          conversationId: conversation.id,
          sender: "vendor",
          senderName: conversation.vendorName,
          body: `Thanks ${lead.coupleNames} - I have sent over a proposal for your wedding.`,
          timestamp: nowIso(),
        },
      ];
    }

    set({
      leads: state.leads.map((item) => (item.id === leadId ? { ...item, stage } : item)),
      messages: nextMessages,
    });
  },

  sendProposal: (leadId) => {
    get().moveLeadStage(leadId, "Proposal Sent");
  },

  bookVendor: (leadId) => {
    const state = get();
    const lead = state.leads.find((item) => item.id === leadId);
    if (!lead) return;

    const vendor = state.vendors.find((item) => item.id === lead.vendorId);
    if (!vendor) return;

    const alreadyBooked = state.bookedVendorIds.includes(vendor.id);
    const budgetAlreadyLinked = state.budgetItems.some((item) => item.vendorId === vendor.id);
    const budgetItem: BudgetItem = {
      id: uid("budget"),
      category: categoryToBudgetCategory(vendor.category),
      label: `${vendor.name} confirmed booking`,
      vendorId: vendor.id,
      amount: vendor.startingPrice,
      paid: Math.round(vendor.startingPrice * 0.35),
      dueDate: "2026-06-15",
      status: "Deposit Paid",
    };

    const conversation = state.conversations.find(
      (item) => item.vendorId === lead.vendorId && item.coupleName === lead.coupleNames,
    );

    const confirmation: Message | undefined = conversation
      ? {
          id: uid("message"),
          conversationId: conversation.id,
          sender: "vendor",
          senderName: conversation.vendorName,
          body: `We are confirmed for ${lead.weddingDate}. Contract and deposit are recorded in Wedding OS.`,
          timestamp: nowIso(),
        }
      : undefined;

    set({
      leads: state.leads.map((item) => (item.id === leadId ? { ...item, stage: "Booked" } : item)),
      bookedVendorIds: alreadyBooked ? state.bookedVendorIds : [...state.bookedVendorIds, vendor.id],
      budgetItems: budgetAlreadyLinked ? state.budgetItems : [...state.budgetItems, budgetItem],
      messages: confirmation ? [...state.messages, confirmation] : state.messages,
    });
  },

  saveVendor: (vendorId) => {
    const state = get();
    set({
      savedVendorIds: state.savedVendorIds.includes(vendorId)
        ? state.savedVendorIds.filter((id) => id !== vendorId)
        : [...state.savedVendorIds, vendorId],
    });
  },

  addVendorToCompare: (vendorId) => {
    const state = get();
    if (state.comparisonVendorIds.includes(vendorId)) return;
    set({ comparisonVendorIds: [...state.comparisonVendorIds, vendorId].slice(-4) });
  },

  removeVendorFromCompare: (vendorId) => {
    const state = get();
    set({ comparisonVendorIds: state.comparisonVendorIds.filter((id) => id !== vendorId) });
  },

  updateRSVPGuest: (guestId, updates) => {
    const state = get();
    set({
      guests: state.guests.map((guest) => (guest.id === guestId ? { ...guest, ...updates } : guest)),
    });
  },

  completeTask: (taskId) => {
    const state = get();
    set({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    });
  },

  generateAIPlan: () => {
    set({
      aiPlan: {
        generatedAt: nowIso(),
        budgetBreakdown: [
          { category: "Venue", amount: 9500, note: "Locked. Keep venue upgrades tightly scoped." },
          { category: "Catering", amount: 8200, note: "Primary guest experience investment." },
          { category: "Photography", amount: 5200, note: "High-impact next booking for this style." },
          { category: "Decor", amount: 6800, note: "Mandap and reception design already aligned." },
          { category: "Music", amount: 2600, note: "Book before preferred DJs fill July dates." },
          { category: "Transportation", amount: 1200, note: "Hotel shuttle can reduce day-of risk." },
        ],
        recommendedVendors: ["golden-lens-photography", "dj-nova-events", "aura-bridal-beauty", "cityline-chauffeurs"],
        timelineSuggestions: [
          "Book photography this week to protect July availability.",
          "Confirm catering menu before June 15 payment milestone.",
          "Finalize guest transportation after RSVP reminders are sent.",
          "Schedule a single vendor alignment call during wedding week.",
        ],
        insights: [
          "Photography and venue are currently your highest-impact booking decisions.",
          "You are projected to remain $3,800 under budget if you select the recommended decor package.",
          "Book makeup and transportation next based on your timeline.",
          "Create custom categories for cultural events, family logistics, or specialty services that do not fit standard wedding templates.",
        ],
        riskFlags: [
          "Photography is not yet booked for a prime July date.",
          "RSVP pending count is high enough to affect catering and shuttle estimates.",
          "Vendor arrival times are still open for wedding week.",
        ],
      },
    });
  },

  createCustomCategory: (input) => {
    const state = get();
    const category: CategorySummary = {
      id: uid("category"),
      name: input.name.trim(),
      slug: `${input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      type: input.type,
      scope: input.type === "vendor_service" ? "vendor_business" : "wedding",
      color: input.color ?? "#c8a97e",
      icon: input.icon ?? "Sparkles",
    };

    set({ categories: [...state.categories, category] });
    return category;
  },

  archiveCategory: (categoryId) => {
    const state = get();
    set({
      categories: state.categories.map((category) =>
        category.id === categoryId && category.scope !== "global"
          ? { ...category, archivedAt: new Date().toISOString() }
          : category,
      ),
    });
  },

  addBudgetItem: (input) => {
    const state = get();
    const item: BudgetItem = {
      id: uid("budget"),
      category: input.category,
      label: input.label,
      amount: input.amount,
      paid: 0,
      dueDate: input.dueDate ?? "2026-06-30",
      status: "Planned",
    };

    set({ budgetItems: [...state.budgetItems, item] });
  },
}));
