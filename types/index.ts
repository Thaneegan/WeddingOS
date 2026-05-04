export type VendorCategory =
  | "Venues"
  | "Photography"
  | "Videography"
  | "Decor"
  | "Florals"
  | "DJ / Music"
  | "Catering"
  | "Makeup"
  | "Hair"
  | "Wedding Planner"
  | "Transportation"
  | "Cake / Desserts"
  | "Officiant"
  | "Invitations";

export type RSVPStatus = "Attending" | "Declined" | "Pending";

export type LeadStage =
  | "New Inquiry"
  | "Contacted"
  | "Proposal Sent"
  | "Negotiating"
  | "Booked"
  | "Completed"
  | "Lost";

export type SenderRole = "couple" | "vendor" | "system";

export type BudgetCategory =
  | "Venue"
  | "Catering"
  | "Photography"
  | "Videography"
  | "Decor"
  | "Florals"
  | "Music"
  | "Makeup"
  | "Hair"
  | "Attire"
  | "Transportation"
  | "Cake"
  | "Invitations"
  | "Miscellaneous";

export type WeddingDetails = {
  couple: string;
  date: string;
  location: string;
  style: string;
  budget: number;
  guestCount: number;
};

export type VendorPackage = {
  name: string;
  price: number;
  description: string;
  includes: string[];
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
};

export type PastWedding = {
  id: string;
  couple: string;
  venue: string;
  style: string;
  image: string;
};

export type Vendor = {
  id: string;
  name: string;
  category: VendorCategory;
  location: string;
  rating: number;
  reviewsCount: number;
  startingPrice: number;
  image: string;
  gallery: string[];
  styleTags: string[];
  availability: "Available" | "Limited" | "Waitlist";
  matchScore: number;
  responseTime: string;
  socials: string[];
  about: string;
  packages: VendorPackage[];
  reviews: Review[];
  pastWeddings: PastWedding[];
  faqs: { question: string; answer: string }[];
};

export type BudgetItem = {
  id: string;
  category: BudgetCategory;
  label: string;
  vendorId?: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: "Paid" | "Deposit Paid" | "Due Soon" | "Planned";
};

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: string;
  status: RSVPStatus;
  plusOne: boolean;
  mealChoice: "Chicken" | "Vegetarian" | "Vegan" | "Halal" | "Pending";
  tableNumber?: number;
  notes?: string;
};

export type TimelineTask = {
  id: string;
  title: string;
  group: string;
  dueDate: string;
  completed: boolean;
  relatedVendorId?: string;
  priority: "High" | "Medium" | "Low";
};

export type Message = {
  id: string;
  conversationId: string;
  sender: SenderRole;
  senderName: string;
  body: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  vendorId: string;
  vendorName: string;
  coupleName: string;
  unreadForCouple: number;
  unreadForVendor: number;
};

export type Lead = {
  id: string;
  vendorId: string;
  coupleNames: string;
  weddingDate: string;
  budget: number;
  location: string;
  guestCount: number;
  serviceRequested: VendorCategory;
  lastMessage: string;
  stage: LeadStage;
  estimatedValue: number;
  createdAt: string;
};

export type ClientRecord = {
  id: string;
  coupleNames: string;
  weddingDate: string;
  packageName: string;
  paymentStatus: "Deposit Paid" | "Paid" | "Invoice Due";
  contractStatus: "Signed" | "Pending" | "Draft";
  notes: string;
};

export type AIPlan = {
  generatedAt: string;
  budgetBreakdown: { category: BudgetCategory; amount: number; note: string }[];
  recommendedVendors: string[];
  timelineSuggestions: string[];
  insights: string[];
  riskFlags: string[];
};
