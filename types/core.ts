export type CoreCategory = {
  id: string;
  name: string;
  slug: string;
  type: "vendor_service" | "budget" | "task" | "guest_group" | "event" | "misc";
  scope: "global" | "wedding" | "vendor_business";
  color?: string;
  icon?: string;
  archivedAt?: string;
};

export type CoreVendorCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryId?: string;
  location: string;
  rating: number;
  reviewsCount: number;
  startingPrice: number;
  image: string;
  styleTags: string[];
  availability: "Available" | "Limited" | "Waitlist" | string;
  matchScore: number;
  responseTime: string;
  existingInquiry?: boolean;
  quotes?: CoreVendorQuote[];
  comparisonNote?: string;
};

export type CoreWeddingSummary = CoreDashboardData["wedding"];

export type CoreAvailabilitySlot = {
  id?: string;
  date: string;
  label: string;
  status: "Available" | "Limited" | "Booked" | "Waitlist" | string;
  note?: string;
};

export type CoreWeddingEvent = {
  id: string;
  name: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  venueName?: string;
  notes?: string;
  sortOrder: number;
};

export type CoreVendorProfile = CoreVendorCard & {
  wedding: CoreWeddingSummary;
  saved: boolean;
  compared: boolean;
  gallery: string[];
  socials: string[];
  about: string;
  availabilityPreview: CoreAvailabilitySlot[];
  services: {
    id: string;
    name: string;
    price: number;
    description: string;
    includes: string[];
    category: string;
  }[];
  reviews: {
    id: string;
    author: string;
    rating: number;
    date: string;
    body: string;
  }[];
  pastWeddings: {
    id: string;
    couple: string;
    venue: string;
    style: string;
    image: string;
  }[];
  faqs: { question: string; answer: string }[];
  existingInquiry: boolean;
};

export type CoreFileAsset = {
  id: string;
  ownerType: string;
  ownerId: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  provider: string;
  visibility: string;
  createdAt: string;
  uploadedBy?: string;
};

export type CoreScheduledCall = {
  id: string;
  conversationId?: string;
  bookingId?: string;
  vendorBusinessId?: string;
  title: string;
  callUrl: string;
  startsAt: string;
  durationMinutes: number;
  notes?: string;
};

export type CoreConversation = {
  id: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  coupleName: string;
  unreadForCouple: number;
  unreadForVendor: number;
  lastMessage?: string;
  lastMessageFrom?: "couple" | "vendor" | "system";
  lastMessageAt?: string;
  stage?: CoreLeadStage;
  serviceName?: string;
  weddingDate?: string;
};

export type CoreMessage = {
  id: string;
  conversationId: string;
  sender: "couple" | "vendor" | "system";
  senderName: string;
  body: string;
  timestamp: string;
};

export type CoreLeadStage =
  | "New Inquiry"
  | "Contacted"
  | "Proposal Sent"
  | "Negotiating"
  | "Booked"
  | "Completed"
  | "Lost";

export type CoreLead = {
  id: string;
  inquiryId?: string;
  serviceId?: string;
  vendorId: string;
  vendorName: string;
  coupleNames: string;
  weddingDate: string;
  budget: number;
  location: string;
  guestCount: number;
  serviceRequested: string;
  lastMessage: string;
  stage: CoreLeadStage;
  estimatedValue: number;
  createdAt: string;
};

export type CoreTask = {
  id: string;
  title: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low" | string;
};

export type CoreBudgetItem = {
  id: string;
  eventId?: string;
  eventName?: string;
  categoryId: string;
  category: string;
  label: string;
  vendorId?: string;
  vendorName?: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: string;
};

export type CorePaymentScheduleItem = {
  id: string;
  bookingId?: string;
  budgetItemId?: string;
  label: string;
  sourceLabel?: string;
  vendorName?: string;
  totalAmount?: number;
  paidAmount?: number;
  amount: number;
  dueDate: string;
  status: string;
  reminderDaysBefore?: number;
  reminderDismissedAt?: string;
};

export type CoreInvoiceRecord = {
  id: string;
  bookingId?: string;
  budgetItemId?: string;
  label: string;
  amount: number;
  status: string;
  dueDate?: string;
};

export type CoreBudgetData = {
  wedding: CoreDashboardData["wedding"];
  events: CoreWeddingEvent[];
  items: CoreBudgetItem[];
  categories: CoreCategory[];
  paymentSchedule: CorePaymentScheduleItem[];
  invoices: CoreInvoiceRecord[];
  files: CoreFileAsset[];
};

export type CoreTimelineTask = CoreTask & {
  group: string;
  completed: boolean;
  eventId?: string;
  eventName?: string;
  categoryId?: string;
  category?: string;
  relatedVendorId?: string;
  relatedVendorName?: string;
};

export type CoreResponsibility = {
  id: string;
  eventId?: string;
  eventName?: string;
  title: string;
  assignedName?: string;
  assignedEmail?: string;
  dueDate: string;
  status: string;
  notes?: string;
};

export type CoreEventTimelineBlock = {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  ownerName?: string;
  notes?: string;
  sortOrder: number;
};

export type CoreTimelineData = {
  events: CoreWeddingEvent[];
  tasks: CoreTimelineTask[];
  categories: CoreCategory[];
  responsibilities: CoreResponsibility[];
  timelineBlocks: CoreEventTimelineBlock[];
  featureSummary: {
    guests: number;
    eventInvites: number;
    budgetItems: number;
    bookedVendors: number;
    inquiries: number;
    savedVendors: number;
    comparisonItems: number;
    vendorNeeds: number;
    vendorQuotes: number;
    documents: number;
    seatingTables: number;
    seatingAssignments: number;
    runSheetBlocks: number;
    responsibilities: number;
    events: number;
  };
};

export type CoreGuestCompanion = {
  id: string;
  name: string;
  relation?: string;
  mealChoice?: string;
  notes?: string;
};

export type CoreEventRsvp = {
  eventId: string;
  eventName: string;
  invited: boolean;
  status: "Attending" | "Declined" | "Pending";
  attendeeCount: number;
  mealChoice: string;
  notes?: string;
};

export type CoreGuest = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group: string;
  status: "Attending" | "Declined" | "Pending";
  plusOne: boolean;
  additionalGuestCount: number;
  companionDetails?: string;
  mealChoice: string;
  tableNumber?: number;
  notes?: string;
  companions?: CoreGuestCompanion[];
  eventRsvps?: CoreEventRsvp[];
};

export type CoreGuestGroup = {
  id: string;
  name: string;
  guestCount: number;
};

export type CorePublicRsvpToken = {
  id: string;
  guestId?: string;
  guestName?: string;
  token: string;
  url: string;
  expiresAt?: string;
  usedAt?: string;
  createdAt: string;
};

export type CoreRSVPData = {
  events: CoreWeddingEvent[];
  guests: CoreGuest[];
  groups: CoreGuestGroup[];
  publicTokens: CorePublicRsvpToken[];
};

export type CoreVendorQuoteLineItem = {
  id: string;
  label: string;
  amount: number;
  included: boolean;
  notes?: string;
};

export type CoreVendorQuote = {
  id: string;
  inquiryId?: string;
  vendorId: string;
  serviceId?: string;
  amount: number;
  deposit: number;
  dueDate?: string;
  validUntil?: string;
  status: string;
  notes?: string;
  lineItems: CoreVendorQuoteLineItem[];
};

export type CoreSeatingAssignment = {
  id: string;
  guestId?: string;
  guestName?: string;
  companionId?: string;
  companionName?: string;
  seatLabel?: string;
};

export type CoreSeatingTable = {
  id: string;
  eventId?: string;
  eventName?: string;
  name: string;
  capacity: number;
  sortOrder: number;
  assignments: CoreSeatingAssignment[];
};

export type CoreSeatingData = {
  wedding: CoreDashboardData["wedding"];
  events: CoreWeddingEvent[];
  guests: CoreGuest[];
  tables: CoreSeatingTable[];
};

export type CoreDocumentsData = {
  wedding: CoreDashboardData["wedding"];
  events: CoreWeddingEvent[];
  vendors: { id: string; name: string }[];
  files: CoreFileAsset[];
};

export type CoreRunSheetData = {
  wedding: CoreDashboardData["wedding"];
  events: CoreWeddingEvent[];
  timelineBlocks: CoreEventTimelineBlock[];
  responsibilities: CoreResponsibility[];
  bookedVendors: CoreVendorCard[];
  paymentSchedule: CorePaymentScheduleItem[];
  files: CoreFileAsset[];
};

export type CoreAIPlan = {
  id?: string;
  generatedAt: string;
  budgetBreakdown: { category: string; amount: number; note: string }[];
  recommendedVendors: string[];
  timelineSuggestions: string[];
  insights: string[];
  riskFlags: string[];
};

export type CorePlannerData = {
  wedding: CoreDashboardData["wedding"];
  plan?: CoreAIPlan;
  recommendedVendors: CoreVendorCard[];
};

export type CoreVendorClient = {
  id: string;
  recordType: "booking" | "lead";
  vendorBusinessId?: string;
  weddingId?: string;
  serviceId?: string;
  coupleNames: string;
  weddingDate: string;
  packageName: string;
  amount?: number;
  bookingStatus?: string;
  paymentStatus: string;
  contractStatus: string;
  notes: string;
  contractId?: string;
  paymentSchedule: CorePaymentScheduleItem[];
  invoices: CoreInvoiceRecord[];
  files: CoreFileAsset[];
  scheduledCalls: CoreScheduledCall[];
};

export type CoreVendorClientsData = {
  clients: CoreVendorClient[];
  services: { id: string; name: string }[];
};

export type CoreVendorAnalyticsData = {
  profileViews: number;
  leadsReceived: number;
  conversionRate: number;
  revenueBooked: number;
  views: { month: string; views: number; leads: number }[];
  sources: { name: string; value: number }[];
  topImages: string[];
};

export type CoreVendorDashboardData = {
  vendor: {
    id: string;
    name: string;
    location: string;
    startingPrice: number;
    image: string;
    gallery: string[];
    styleTags: string[];
    availability: string;
    responseTime: string;
    socials: string[];
    about: string;
    visible: boolean;
  };
  profileViews: number;
  newLeads: number;
  activeClients: number;
  upcomingWeddings: number;
  monthlyRevenue: number;
  responseRate: number;
  conversionRate: number;
  profileScore: number;
  recentLeads: CoreLead[];
  upcomingClients: CoreVendorClient[];
  availabilitySlots: CoreAvailabilitySlot[];
  categories: CoreCategory[];
  services: {
    id: string;
    name: string;
    categoryId: string;
    category: string;
    startingPrice: number;
    description: string;
    includes: string[];
    linkedRecords: number;
  }[];
  portfolioItems: {
    id: string;
    title: string;
    image: string;
    sortOrder: number;
  }[];
  pastWeddings: {
    id: string;
    coupleNames: string;
    venue: string;
    style: string;
    image: string;
  }[];
  reviews: {
    id: string;
    author: string;
    rating: number;
    body: string;
    createdAt: string;
  }[];
  faqs: {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
  }[];
  files: CoreFileAsset[];
};

export type CoreNotification = {
  id: string;
  type: string;
  status: string;
  provider: string;
  recipient?: string;
  subject?: string;
  template?: string;
  error?: string;
  createdAt: string;
  sentAt?: string;
};

export type CoreNotificationsData = {
  notifications: CoreNotification[];
  queuedCount: number;
  failedCount: number;
};

export type CoreVendorOpportunity = {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: string;
  budget?: number;
  location?: string;
  date?: string;
  guestCount?: number;
  status: string;
  weddingName: string;
  pitchCount: number;
  pitchedByCurrentVendor?: boolean;
};

export type CoreOpportunitiesData = {
  wedding?: CoreDashboardData["wedding"];
  vendorBusinessId?: string;
  categories: CoreCategory[];
  opportunities: CoreVendorOpportunity[];
};

export type CoreAdminData = {
  vendors: number;
  weddings: number;
  users: number;
  categories: number;
  inquiries: number;
  bookings: number;
  bookedRevenue: number;
  projectedGMV: number;
  customCategories: number;
};

export type CoreDashboardData = {
  wedding: {
    id: string;
    couple: string;
    date: string;
    location: string;
    style: string;
    budget: number;
    guestCount: number;
  };
  spent: number;
  committedBudgetItems: number;
  bookedVendors: CoreVendorCard[];
  bookedVendorCount: number;
  tasksRemaining: number;
  pendingResponses: number;
  nextEvent?: CoreWeddingEvent;
  recentMessages: (CoreMessage & { vendorName?: string })[];
  upcomingTasks: CoreTask[];
};
