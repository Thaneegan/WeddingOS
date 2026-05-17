"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ChevronsUpDown, Copy, Download, Link as LinkIcon, Mail, Pencil, Plus, Save, Search, Send, SlidersHorizontal, Table2, Trash2, Upload, UsersRound, X } from "lucide-react";
import {
  createGuest,
  createGuestGroup,
  deleteGuest,
  deleteGuestGroup,
  deletePublicRsvpToken,
  exportGuestsCsv,
  importGuestsCsv,
  sendRsvpLinks,
  sendRsvpReminder,
  updateGuest,
  updateGuestGroup,
} from "@/app/actions";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { RSVPStatus } from "@/types";
import type { CoreGuest, CoreRSVPData } from "@/types/core";

const filters: ("All" | RSVPStatus)[] = ["All", "Attending", "Declined", "Pending"];
const statusToApi: Record<RSVPStatus, "ATTENDING" | "DECLINED" | "PENDING"> = {
  Attending: "ATTENDING",
  Declined: "DECLINED",
  Pending: "PENDING",
};
type SortKey = "name" | "group" | "status" | "mealChoice" | "attendeeCount" | "tableNumber";
type OptionalColumnKey = "contact" | "mealChoice" | "tableNumber" | "notes";
type RsvpLinkTargetMode = "pending" | "all" | "group" | "specific";
type GuestDraft = {
  name: string;
  email: string;
  phone: string;
  group: string;
  status: RSVPStatus;
  companionNames: string[];
  mealChoice: string;
  tableNumber: string;
  notes: string;
};

const defaultVisibleColumns: Record<OptionalColumnKey, boolean> = {
  contact: true,
  mealChoice: true,
  tableNumber: true,
  notes: true,
};

const visibleColumnsStorageKey = "wedding-os-rsvp-visible-columns";
const notesCharacterLimit = 280;
const eventStatusLegend: Array<{ status: RSVPStatus; label: string; detail: string }> = [
  { status: "Attending", label: "Attending", detail: "Guest has confirmed they will attend this event." },
  { status: "Pending", label: "Pending", detail: "Guest is invited but has not responded yet." },
  { status: "Declined", label: "Declined", detail: "Guest has declined this event." },
];

function parseCompanionNames(guest: Pick<CoreGuest, "additionalGuestCount" | "companionDetails" | "plusOne">) {
  const expectedCount = guest.additionalGuestCount ?? (guest.plusOne ? 1 : 0);
  let names: string[] = [];

  if (guest.companionDetails?.trim()) {
    try {
      const parsed = JSON.parse(guest.companionDetails);
      if (Array.isArray(parsed)) {
        names = parsed.map((item) => String(item ?? ""));
      }
    } catch {
      names = guest.companionDetails
        .split(/\r?\n|;|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  while (names.length < expectedCount) names.push("");
  return names.slice(0, Math.max(expectedCount, names.length));
}

function formatCompanionName(name: string, index: number) {
  return name.trim() || `Guest ${index + 1}`;
}

function getAttendeeCount(guest: CoreGuest) {
  return 1 + parseCompanionNames(guest).length;
}

function guestToDraft(guest: CoreGuest): GuestDraft {
  return {
    name: guest.name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group: guest.group,
    status: guest.status,
    companionNames: parseCompanionNames(guest),
    mealChoice: guest.mealChoice,
    tableNumber: guest.tableNumber?.toString() ?? "",
    notes: guest.notes ?? "",
  };
}

function eventBadgesForGuest(guest: CoreGuest, selectedEventId: string) {
  const rows = guest.eventRsvps ?? [];
  const invitedRows = rows.filter((eventRsvp) => eventRsvp.invited);
  const scopedRows = selectedEventId === "All" ? invitedRows : invitedRows.filter((eventRsvp) => eventRsvp.eventId === selectedEventId);
  return scopedRows.map((eventRsvp) => ({
    eventName: eventRsvp.eventName,
    status: eventRsvp.status,
  }));
}

function compareGuests(a: CoreGuest, b: CoreGuest, sortKey: SortKey) {
  if (sortKey === "tableNumber") {
    return (a.tableNumber ?? 9999) - (b.tableNumber ?? 9999);
  }

  if (sortKey === "attendeeCount") {
    return getAttendeeCount(a) - getAttendeeCount(b);
  }

  return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { sensitivity: "base" });
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === "\"" && inQuotes && nextChar === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function rsvpStatusClass(status: RSVPStatus) {
  if (status === "Attending") return "border-[#dce8d3] bg-[#f1f8ee] text-[#4f6f4c]";
  if (status === "Declined") return "border-[#f0c9c9] bg-[#fff4f3] text-[#93484d]";
  return "border-[#ecd8b7] bg-[#fff8ea] text-[#8a6635]";
}

export function GuestList({ data }: { data: CoreRSVPData }) {
  const router = useRouter();
  const tableToolsRef = useRef<HTMLDivElement | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const editingRowRef = useRef<HTMLTableRowElement | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [eventFilter, setEventFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [adding, setAdding] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "", group: "", status: "Pending" as RSVPStatus });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [draftBaseline, setDraftBaseline] = useState<GuestDraft | null>(null);
  const [discardPrompt, setDiscardPrompt] = useState<{ nextGuest?: CoreGuest } | null>(null);
  const [groupName, setGroupName] = useState("");
  const [renamingGroup, setRenamingGroup] = useState<{ id: string; name: string } | null>(null);
  const [csvImport, setCsvImport] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvDuplicateNames, setCsvDuplicateNames] = useState<string[]>([]);
  const [pendingCsvImport, setPendingCsvImport] = useState("");
  const [csvImportStatus, setCsvImportStatus] = useState<"idle" | "ready" | "validating" | "duplicates" | "importing" | "failed" | "complete">("idle");
  const [notice, setNotice] = useState("");
  const [showGroups, setShowGroups] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTargetMode, setLinkTargetMode] = useState<RsvpLinkTargetMode>("pending");
  const [linkGroupName, setLinkGroupName] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [linkMessage, setLinkMessage] = useState("Please confirm your attendance, meal choice, and plus-one details for our wedding.");
  const [linkExpiresInDays, setLinkExpiresInDays] = useState(30);
  const [sendLinkEmail, setSendLinkEmail] = useState(true);
  const [sendingLinks, setSendingLinks] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<OptionalColumnKey, boolean>>(() => {
    if (typeof window === "undefined") return defaultVisibleColumns;
    try {
      const stored = window.localStorage.getItem(visibleColumnsStorageKey);
      if (!stored) return defaultVisibleColumns;
      return { ...defaultVisibleColumns, ...JSON.parse(stored) };
    } catch {
      return defaultVisibleColumns;
    }
  });
  const guests: CoreGuest[] = data.guests;
  const groups = data.groups;
  const guestEventStatus = useCallback((guest: CoreGuest) => {
    if (eventFilter === "All") return guest.status;
    return guest.eventRsvps?.find((item) => item.eventId === eventFilter)?.status ?? guest.status;
  }, [eventFilter]);
  const uniqueGroups = useMemo(() => {
    const groupsByName = new Map<string, (typeof groups)[number]>();
    for (const group of groups) {
      const key = group.name.trim().toLowerCase();
      const existing = groupsByName.get(key);
      if (existing) {
        groupsByName.set(key, { ...existing, guestCount: existing.guestCount + group.guestCount });
      } else {
        groupsByName.set(key, group);
      }
    }
    return Array.from(groupsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const eventScopedGuests = guests.filter((guest) => eventFilter === "All" || guest.eventRsvps?.some((item) => item.eventId === eventFilter && item.invited));
  const attending = eventScopedGuests.filter((guest) => guestEventStatus(guest) === "Attending").length;
  const declined = eventScopedGuests.filter((guest) => guestEventStatus(guest) === "Declined").length;
  const pending = eventScopedGuests.filter((guest) => guestEventStatus(guest) === "Pending").length;
  const tableOptions = useMemo(() => {
    const existingTables = guests
      .map((guest) => guest.tableNumber)
      .filter((tableNumber): tableNumber is number => typeof tableNumber === "number" && Number.isFinite(tableNumber));
    return Array.from(new Set([...existingTables, ...Array.from({ length: 30 }, (_, index) => index + 1)])).sort((a, b) => a - b);
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const rows = guests.filter((guest) => {
      const matchesEvent = eventFilter === "All" || guest.eventRsvps?.some((item) => item.eventId === eventFilter && item.invited);
      const matchesStatus = filter === "All" || guestEventStatus(guest) === filter;
      const matchesGroup = groupFilter === "All" || guest.group === groupFilter;
      const haystack = [guest.name, ...parseCompanionNames(guest), guest.email, guest.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesEvent && matchesStatus && matchesGroup && (!normalizedSearch || haystack.includes(normalizedSearch));
    });

    return rows.sort((a, b) => {
      const result = compareGuests(a, b, sortKey);
      return sortDirection === "asc" ? result : -result;
    });
  }, [eventFilter, filter, groupFilter, guestEventStatus, guests, search, sortDirection, sortKey]);

  useEffect(() => {
    window.localStorage.setItem(visibleColumnsStorageKey, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const linkTargets = useMemo(() => {
    if (linkTargetMode === "all") return guests;
    if (linkTargetMode === "group") return guests.filter((guest) => guest.group === linkGroupName);
    if (linkTargetMode === "specific") return guests.filter((guest) => selectedGuestIds.includes(guest.id));
    return guests.filter((guest) => guest.status === "Pending");
  }, [guests, linkGroupName, linkTargetMode, selectedGuestIds]);

  const linkTargetsWithEmail = linkTargets.filter((guest) => guest.email).length;
  const activeRsvpLinkGuestIds = useMemo(() => {
    return new Set(
      data.publicTokens
        .filter((token) => token.guestId && !token.usedAt)
        .map((token) => token.guestId as string),
    );
  }, [data.publicTokens]);
  const linkTargetsWithExistingLinks = linkTargets.filter((guest) => activeRsvpLinkGuestIds.has(guest.id)).length;
  const linkTargetsNeedingLinks = Math.max(0, linkTargets.length - linkTargetsWithExistingLinks);
  const pendingGuests = eventScopedGuests.filter((guest) => guestEventStatus(guest) === "Pending");
  const attendingGuests = eventScopedGuests.filter((guest) => guestEventStatus(guest) === "Attending");
  const confirmedAttendeeCount = attendingGuests.reduce((sum, guest) => sum + getAttendeeCount(guest), 0);
  const projectedAttendeeCount = eventScopedGuests
    .filter((guest) => guestEventStatus(guest) !== "Declined")
    .reduce((sum, guest) => sum + getAttendeeCount(guest), 0);
  const missingContactCount = eventScopedGuests.filter((guest) => !guest.email && !guest.phone).length;
  const pendingWithoutLinksCount = pendingGuests.filter((guest) => !activeRsvpLinkGuestIds.has(guest.id)).length;
  const pendingWithEmailCount = pendingGuests.filter((guest) => Boolean(guest.email)).length;
  const mealNeededCount = attendingGuests.filter((guest) => !guest.mealChoice || guest.mealChoice === "Pending").length;
  const seatingNeededCount = attendingGuests.filter((guest) => !guest.tableNumber).length;
  const nextGuestAction =
    missingContactCount > 0
      ? {
          title: "Clean up missing contact info",
          detail: `${missingContactCount} guest${missingContactCount === 1 ? "" : "s"} need an email or phone before links can be sent reliably.`,
          action: "Review guests",
          onClick: () => tableToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        }
      : pendingWithoutLinksCount > 0
        ? {
            title: "Send RSVP links",
            detail: `${pendingWithoutLinksCount} pending guest${pendingWithoutLinksCount === 1 ? "" : "s"} still need an active RSVP link.`,
            action: "Open link sender",
            onClick: () => setLinkModalOpen(true),
          }
        : pending > 0
          ? {
              title: "Follow up with pending guests",
              detail: `${pending} guest${pending === 1 ? "" : "s"} have not responded yet. ${pendingWithEmailCount} can be reached by email.`,
              action: "Show pending",
              onClick: () => applySummaryFilter("Pending"),
            }
          : seatingNeededCount > 0 || mealNeededCount > 0
            ? {
                title: "Finalize seating and meals",
                detail: `${seatingNeededCount} attending guest${seatingNeededCount === 1 ? "" : "s"} need tables and ${mealNeededCount} need meal choices.`,
                action: "Review attending",
                onClick: () => applySummaryFilter("Attending"),
              }
            : {
                title: "Guest list is in good shape",
                detail: "RSVPs, contacts, meals, and tables are ready for the current event filter.",
                action: "View all guests",
                onClick: () => applySummaryFilter("All"),
              };
  const draftChanged = useMemo(() => {
    if (!editingId || !draft || !draftBaseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(draftBaseline);
  }, [draft, draftBaseline, editingId]);

  const openGuestEditor = (guest: CoreGuest) => {
    const nextDraft = guestToDraft(guest);
    setEditingId(guest.id);
    setDraft(nextDraft);
    setDraftBaseline(nextDraft);
  };

  const beginEditingGuest = (guest: CoreGuest) => {
    if (editingId === guest.id) return;
    if (draftChanged) {
      setDiscardPrompt({ nextGuest: guest });
      return;
    }
    openGuestEditor(guest);
  };

  const requestCloseEditor = () => {
    if (draftChanged) {
      setDiscardPrompt({});
      return;
    }
    setEditingId(null);
    setDraft(null);
    setDraftBaseline(null);
  };

  const discardDraftChanges = () => {
    const nextGuest = discardPrompt?.nextGuest;
    setDiscardPrompt(null);
    setEditingId(null);
    setDraft(null);
    setDraftBaseline(null);
    if (nextGuest) openGuestEditor(nextGuest);
  };

  const saveDraftChangesFromPrompt = async () => {
    const nextGuest = discardPrompt?.nextGuest;
    const currentEditingId = editingId;
    setDiscardPrompt(null);
    if (currentEditingId) await saveDraft(currentEditingId);
    if (nextGuest) openGuestEditor(nextGuest);
  };

  useEffect(() => {
    if (!editingId || !draft || discardPrompt) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (editingRowRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-unsaved-dialog='true']")) return;
      if (draftChanged) {
        event.preventDefault();
        event.stopPropagation();
        setDiscardPrompt({});
        return;
      }
      setEditingId(null);
      setDraft(null);
      setDraftBaseline(null);
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [discardPrompt, draft, draftChanged, editingId]);

  const saveDraft = async (guestId: string) => {
    if (!draft?.name.trim()) return;
    await updateGuest({
      guestId,
      fields: {
        name: draft.name,
        email: draft.email || undefined,
        phone: draft.phone || undefined,
        group: draft.group || "Ungrouped",
        status: statusToApi[draft.status],
        additionalGuestCount: draft.companionNames.length,
        companionDetails: draft.companionNames.length ? JSON.stringify(draft.companionNames) : null,
        mealChoice: draft.mealChoice || "Pending",
        tableNumber: draft.tableNumber ? Number(draft.tableNumber) : null,
        notes: draft.notes || null,
      },
    });
    setEditingId(null);
    setDraft(null);
    setDraftBaseline(null);
    router.refresh();
  };

  const submitGuest = async () => {
    if (!newGuest.name.trim() || !newGuest.group.trim()) {
      setNotice("Guest name and group are required before saving a new guest.");
      return;
    }

    await createGuest(newGuest);
    setNewGuest({ name: "", email: "", phone: "", group: "", status: "Pending" });
    setAdding(false);
    router.refresh();
  };

  const addGroup = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedGroupName = groupName.trim();
    if (!normalizedGroupName) return;
    if (data.groups.some((group) => group.name.trim().toLowerCase() === normalizedGroupName.toLowerCase())) {
      setNotice(`"${normalizedGroupName}" already exists as a guest group.`);
      return;
    }
    await createGuestGroup({ name: normalizedGroupName });
    setGroupName("");
    router.refresh();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortableHeader = (key: SortKey, label: string, align: "left" | "center" = "center") => {
    const SortIcon = sortKey === key ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className={`flex items-center gap-1 rounded-full px-1 py-0.5 transition hover:bg-white/70 ${align === "center" ? "mx-auto justify-center text-center" : "text-left"}`}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <SortIcon size={13} className={sortKey === key ? "opacity-100" : "opacity-35"} />
      </button>
    );
  };

  const optionalColumnLabels: Record<OptionalColumnKey, string> = {
    contact: "Contact",
    mealChoice: "Meal",
    tableNumber: "Table",
    notes: "Notes",
  };

  const toolbarButtonClass = (selected: boolean) =>
    `flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
      selected ? "border border-[#191714] bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]"
    }`;

  const applySummaryFilter = (nextFilter: (typeof filters)[number]) => {
    setFilter(nextFilter);
    setGroupFilter("All");
    tableToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const templateHeaders = useMemo(() => {
    const headers = ["Guest", "# of Attendees"];
    if (visibleColumns.contact) headers.push("Email", "Phone");
    headers.push("Group", "RSVP");
    if (visibleColumns.mealChoice) headers.push("Meal");
    if (visibleColumns.tableNumber) headers.push("Table");
    if (visibleColumns.notes) headers.push("Notes");
    headers.push("Subguest names");
    return headers;
  }, [visibleColumns]);

  const downloadTemplate = () => {
    const groupOptions = uniqueGroups.length ? uniqueGroups.map((group) => group.name) : ["Family", "Friends", "Wedding party"];
    const rsvpOptions = ["Pending", "Attending", "Declined"];
    const headerCells = templateHeaders
      .map((header) => `<Cell><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`)
      .join("");
    const blankRows = Array.from({ length: 150 }, () => `<Row>${templateHeaders.map(() => "<Cell><Data ss:Type=\"String\"></Data></Cell>").join("")}</Row>`).join("");
    const groupColumn = templateHeaders.findIndex((header) => header === "Group") + 1;
    const rsvpColumn = templateHeaders.findIndex((header) => header === "RSVP") + 1;
    const groupList = groupOptions.join(",");
    const rsvpList = rsvpOptions.join(",");
    const spreadsheet = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#FBF5EC" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Guest Import Template">
  <Table>
   <Row ss:StyleID="header">${headerCells}</Row>
   ${blankRows}
  </Table>
  <DataValidation xmlns="urn:schemas-microsoft-com:office:excel">
   <Range>R2C${groupColumn}:R151C${groupColumn}</Range>
   <Type>List</Type>
   <Value>${xmlEscape(groupList)}</Value>
  </DataValidation>
  <DataValidation xmlns="urn:schemas-microsoft-com:office:excel">
   <Range>R2C${rsvpColumn}:R151C${rsvpColumn}</Range>
   <Type>List</Type>
   <Value>${xmlEscape(rsvpList)}</Value>
  </DataValidation>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
    downloadTextFile("wedding-os-guest-template.xml", spreadsheet, "application/vnd.ms-excel;charset=utf-8");
  };

  const validateCsvImport = (csv: string) => {
    const rows = parseCsv(csv);
    const errors: string[] = [];
    if (rows.length < 2) errors.push("The CSV needs a header row and at least one guest row.");

    const headers = rows[0] ?? [];
    const headerIndex = new Map(headers.map((header, index) => [normalizeHeader(header), index]));
    const getCell = (row: string[], names: string[]) => {
      for (const name of names) {
        const index = headerIndex.get(normalizeHeader(name));
        if (index !== undefined) return row[index]?.trim() ?? "";
      }
      return "";
    };
    const requiredHeaders = ["Guest", "# of Attendees", "Group", "RSVP"];
    const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(normalizeHeader(header)));
    if (missingHeaders.length) errors.push(`Missing required columns: ${missingHeaders.join(", ")}.`);

    const seenCsvNames = new Set<string>();
    const existingGuestNames = new Set(guests.map((guest) => guest.name.trim().toLowerCase()));
    const existingGroupNames = new Set(data.groups.map((group) => group.name.trim().toLowerCase()));
    const duplicateNames = new Set<string>();
    for (const [rowIndex, row] of rows.slice(1).entries()) {
      const rowNumber = rowIndex + 2;
      if (!row.some(Boolean)) continue;
      const guestName = getCell(row, ["Guest", "Name"]);
      const attendeeCount = getCell(row, ["# of Attendees", "Attendee Count", "Additional Guest Count"]);
      const group = getCell(row, ["Group", "Guest Group"]);
      const rsvp = getCell(row, ["RSVP", "Status"]);
      const normalizedName = guestName.trim().toLowerCase();

      if (!guestName) errors.push(`Row ${rowNumber}: Guest is required.`);
      if (!group) errors.push(`Row ${rowNumber}: Group is required.`);
      if (group && !existingGroupNames.has(group.trim().toLowerCase())) {
        errors.push(`Row ${rowNumber}: Group must match an existing group. Add "${group}" in Manage groups first, then import again.`);
      }
      if (!rsvp) errors.push(`Row ${rowNumber}: RSVP is required.`);
      if (rsvp && !["attending", "declined", "pending"].includes(rsvp.toLowerCase())) {
        errors.push(`Row ${rowNumber}: RSVP must be Attending, Declined, or Pending.`);
      }
      if (!attendeeCount) {
        errors.push(`Row ${rowNumber}: # of Attendees is required.`);
      } else if (!Number.isInteger(Number(attendeeCount)) || Number(attendeeCount) < 1) {
        errors.push(`Row ${rowNumber}: # of Attendees must be a whole number of 1 or more.`);
      }

      if (normalizedName) {
        if (seenCsvNames.has(normalizedName) || existingGuestNames.has(normalizedName)) duplicateNames.add(guestName);
        seenCsvNames.add(normalizedName);
      }
    }

    return { errors, duplicateNames: Array.from(duplicateNames), normalizedCsv: csv };
  };

  const importValidatedCsv = async (csv: string, duplicateMode?: "overwrite" | "create" | "skip") => {
    setCsvImportStatus("importing");
    try {
      const result = await importGuestsCsv({ csv, duplicateMode });
      setNotice(`Imported ${result.imported} guests${result.updated ? ` and updated ${result.updated}` : ""}${result.skipped ? `; skipped ${result.skipped}` : ""}.`);
      setCsvImport("");
      setCsvFileName("");
      setCsvErrors([]);
      setCsvDuplicateNames([]);
      setPendingCsvImport("");
      setCsvImportStatus("complete");
      router.refresh();
    } catch (error) {
      setCsvErrors([error instanceof Error ? error.message : "Import failed. Upload a modified CSV and try Import again."]);
      setCsvImportStatus("failed");
    }
  };

  const runCsvImport = async () => {
    if (!csvImport.trim()) return;
    setCsvErrors([]);
    setCsvImportStatus("validating");
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    const validation = validateCsvImport(csvImport);
    if (validation.errors.length) {
      setCsvErrors(validation.errors);
      setCsvDuplicateNames([]);
      setPendingCsvImport("");
      setCsvImportStatus("failed");
      return;
    }
    if (validation.duplicateNames.length) {
      setCsvDuplicateNames(validation.duplicateNames);
      setPendingCsvImport(validation.normalizedCsv);
      setCsvImportStatus("duplicates");
      return;
    }

    setCsvImportStatus("importing");
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    try {
      await importValidatedCsv(validation.normalizedCsv);
    } catch (error) {
      setCsvErrors([error instanceof Error ? error.message : "Import failed. Upload a modified CSV and try Import again."]);
      setCsvImportStatus("failed");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Guest management"
        description="Manage groups, filter guest records, update RSVP status, assign meals and tables, and handle reminders from one workspace."
      />

      <details className="group rounded-2xl border border-[#e7dfd3] bg-white luxury-shadow">
        <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 transition hover:bg-[#fffdf9] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Planning assistant</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">Guest work queue and workflow</h2>
            <p className="mt-1 text-sm text-[#6f6a61]">Open this when you want guidance on what to clean up next.</p>
          </div>
          <span className="inline-flex h-10 items-center justify-center rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61] transition group-open:bg-[#191714] group-open:text-white">
            <span className="group-open:hidden">Show</span>
            <span className="hidden group-open:inline">Hide</span>
          </span>
        </summary>
        <section className="grid gap-4 border-t border-[#eee7dd] p-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Guest work queue</p>
              <h2 className="mt-1 font-display text-3xl font-semibold">What needs attention next</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
                Use this as the daily check-in for RSVP collection, contact cleanup, attendee counts, meals, and seating readiness.
              </p>
            </div>
            <button
              type="button"
              onClick={nextGuestAction.onClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CheckCircle2 size={16} />
              {nextGuestAction.action}
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fbf0dd] text-[#9a6a2f]">
                <AlertCircle size={18} />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{nextGuestAction.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{nextGuestAction.detail}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Confirmed attendees", value: confirmedAttendeeCount, detail: "People confirmed yes" },
              { label: "Projected headcount", value: projectedAttendeeCount, detail: "Confirmed + pending" },
              { label: "No active link", value: pendingWithoutLinksCount, detail: "Pending guests needing links" },
              { label: "Needs cleanup", value: missingContactCount + mealNeededCount + seatingNeededCount, detail: "Contact, meal, or table gaps" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#eee7dd] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[#191714]">{item.value}</p>
                <p className="mt-1 text-xs text-[#6f6a61]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

          <div className="rounded-2xl border border-[#e7dfd3] bg-[#fbf5ec] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Guest workflow</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Build list", detail: `${eventScopedGuests.length} invited records`, active: eventScopedGuests.length > 0 },
              { label: "Send links", detail: pendingWithoutLinksCount ? `${pendingWithoutLinksCount} pending without links` : "Links ready", active: pendingWithoutLinksCount === 0 },
              { label: "Collect responses", detail: pending ? `${pending} pending` : "All responded", active: pending === 0 },
              { label: "Finalize tables", detail: seatingNeededCount ? `${seatingNeededCount} attending without table` : "Tables assigned", active: seatingNeededCount === 0 },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-3 rounded-2xl border border-[#e4d7c5] bg-white/70 p-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.active ? "bg-[#191714] text-white" : "bg-white text-[#8f7450]"}`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-[#191714]">{step.label}</p>
                  <p className="text-xs text-[#6f6a61]">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLinkModalOpen(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
            >
              <LinkIcon size={15} />
              Links
            </button>
            <button
              type="button"
              onClick={() => router.push("/rsvp#seating")}
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
            >
              <Table2 size={15} />
              Seating
            </button>
          </div>
        </div>
        </section>
      </details>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        {notice ? <p className="mb-4 rounded-2xl border border-[#e5eadf] bg-[#f7fbf4] p-3 text-sm font-semibold text-[#61735f]">{notice}</p> : null}

        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => applySummaryFilter("All")} className="text-left" aria-label="Show all invited guests">
            <MetricCard label="Invited" value={`${eventScopedGuests.length}`} detail={eventFilter === "All" ? "Guest records" : "Invited to event"} icon={Mail} tone="ink" />
          </button>
          <button type="button" onClick={() => applySummaryFilter("Attending")} className="text-left" aria-label="Show attending guests">
            <MetricCard label="Attending" value={`${attending}`} detail="Confirmed yes" icon={Mail} tone="green" />
          </button>
          <button type="button" onClick={() => applySummaryFilter("Declined")} className="text-left" aria-label="Show declined guests">
            <MetricCard label="Declined" value={`${declined}`} detail="Unable to attend" icon={Mail} tone="rose" />
          </button>
          <button type="button" onClick={() => applySummaryFilter("Pending")} className="text-left" aria-label="Show pending guests">
            <MetricCard label="Pending" value={`${pending}`} detail="Reminder needed" icon={Mail} tone="gold" />
          </button>
        </div>

        {showGroups ? (
        <div className="mb-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold">Guest groups</h3>
              <p className="mt-1 text-sm text-[#6f6a61]">Create groups and click a group card to filter the guest table.</p>
            </div>
            <form onSubmit={addGroup} className="flex flex-wrap gap-2">
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="New group"
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
              />
              <button className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">
                <Plus size={16} />
                Add group
              </button>
            </form>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {uniqueGroups.map((group) => (
              <article
                key={group.id}
                onClick={() => {
                  setGroupFilter(group.name);
                  tableToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition hover:border-[#c8a97e] ${groupFilter === group.name ? "border-[#191714] bg-[#fbf5ec]" : "border-[#eee7dd] bg-white"}`}
              >
                {renamingGroup?.id === group.id ? (
                  <form
                    onClick={(event) => event.stopPropagation()}
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const normalizedGroupName = renamingGroup.name.trim();
                      if (!normalizedGroupName) return;
                      if (data.groups.some((item) => item.id !== group.id && item.name.trim().toLowerCase() === normalizedGroupName.toLowerCase())) {
                        setNotice(`"${normalizedGroupName}" already exists as a guest group.`);
                        return;
                      }
                      await updateGuestGroup({ guestGroupId: group.id, name: normalizedGroupName });
                      setRenamingGroup(null);
                      router.refresh();
                    }}
                    className="space-y-2"
                  >
                    <input
                      value={renamingGroup.name}
                      onChange={(event) => setRenamingGroup({ id: group.id, name: event.target.value })}
                      className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button className="flex h-9 items-center gap-2 rounded-full bg-[#191714] px-3 text-xs font-semibold text-white">
                        <Save size={14} />
                        Save
                      </button>
                      <button type="button" onClick={() => setRenamingGroup(null)} className="h-9 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{group.name}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{group.guestCount} guests</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={(event) => { event.stopPropagation(); setRenamingGroup({ id: group.id, name: group.name }); }} className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3]" aria-label={`Rename ${group.name}`}>
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          await deleteGuestGroup({ guestGroupId: group.id });
                          router.refresh();
                        }}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                        aria-label={`Delete ${group.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
        ) : null}

        <div ref={tableToolsRef} className="mb-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
          <div className="mb-4 flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={() => setLinkModalOpen(true)} className={toolbarButtonClass(linkModalOpen)}>
              <LinkIcon size={16} />
              Send RSVP links
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setFilter("All");
                setGroupFilter("All");
              }}
              className={toolbarButtonClass(adding)}
            >
              <Plus size={16} />
              Add guest
            </button>
            <button type="button" onClick={() => setShowGroups((value) => !value)} className={toolbarButtonClass(showGroups)}>
              <UsersRound size={16} />
              Manage groups
            </button>
            <button type="button" onClick={() => setShowImportExport((value) => !value)} className={toolbarButtonClass(showImportExport)}>
              <Upload size={16} />
              Import / Export
            </button>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_200px_200px_auto] xl:items-end">
            <label className="flex h-11 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4">
              <Search size={16} className="text-[#9a7a50]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest names, email, phone"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7450]">Wedding event</span>
              <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-11 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
                <option value="All">All events</option>
                {data.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7450]">RSVP status</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value as (typeof filters)[number])} className="h-11 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
                {filters.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7450]">Guest group</span>
              <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="h-11 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
                <option>All</option>
                {uniqueGroups.map((group) => (
                  <option key={group.id}>{group.name}</option>
                ))}
              </select>
            </label>
            <details className="relative">
              <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#6f6a61]" title="Choose visible columns" aria-label="Choose visible columns">
                <SlidersHorizontal size={18} />
              </summary>
              <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-[#e7dfd3] bg-white p-3 shadow-xl">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Optional columns</p>
                {(Object.keys(optionalColumnLabels) as OptionalColumnKey[]).map((key) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm font-semibold hover:bg-[#faf7f1]">
                    <span>{optionalColumnLabels[key]}</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={(event) => setVisibleColumns((columns) => ({ ...columns, [key]: event.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Event color legend</p>
          <div className="flex flex-wrap gap-2">
            {eventStatusLegend.map((item) => (
              <span key={item.status} className="group relative inline-flex items-center" title={`${item.label}: ${item.detail}`}>
                <span className={`size-6 rounded-full border ${rsvpStatusClass(item.status)}`} aria-label={`${item.label} event status`} />
                <span className="pointer-events-none absolute left-1/2 top-8 z-30 hidden w-56 -translate-x-1/2 rounded-2xl border border-[#e7dfd3] bg-white p-3 text-xs normal-case tracking-normal text-[#6f6a61] shadow-xl group-hover:block">
                  <span className="block font-semibold text-[#191714]">{item.label}</span>
                  <span className="mt-1 block leading-5">{item.detail}</span>
                </span>
              </span>
            ))}
          </div>
        </div>

        {showImportExport ? (
        <div className="mb-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold">Import and export guests</h3>
              <p className="mt-1 text-sm text-[#6f6a61]">Download the template, update it in a spreadsheet, then upload the completed CSV for validation.</p>
            </div>
            <button type="button" onClick={() => setShowImportExport(false)} className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]" aria-label="Close import and export">
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-4">
              <h4 className="font-semibold">Import guests</h4>
              <p className="mt-1 text-sm text-[#6f6a61]">Use the spreadsheet template for dropdowns, then save it as CSV before uploading. Imports are checked before any guest records are created.</p>
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setCsvImport(text);
                  setCsvFileName(file.name);
                  setCsvErrors([]);
                  setCsvDuplicateNames([]);
                  setPendingCsvImport("");
                  setCsvImportStatus("ready");
                  event.target.value = "";
                }}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]"
                >
                  <Download size={16} />
                  Download spreadsheet template
                </button>
                <button type="button" onClick={() => csvFileInputRef.current?.click()} className="flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]">
                  <Upload size={16} />
                  Upload CSV
                </button>
                <button
                  type="button"
                  onClick={runCsvImport}
                  disabled={!csvImport.trim() || csvImportStatus === "validating" || csvImportStatus === "importing"}
                  className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                    csvImport.trim() && csvImportStatus !== "validating" && csvImportStatus !== "importing"
                      ? "bg-[#191714] text-white"
                      : "cursor-not-allowed bg-[#e7dfd3] text-[#9b9285]"
                  }`}
                >
                  <Upload size={16} />
                  Import
                </button>
              </div>
              {csvFileName ? (
                <p className="mt-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] px-4 py-3 text-sm font-semibold text-[#6f6a61]">
                  Uploaded: <span className="text-[#191714]">{csvFileName}</span>
                </p>
              ) : null}
              {csvImportStatus === "validating" || csvImportStatus === "importing" ? (
                <div className="mt-3 rounded-2xl border border-[#ecd8b7] bg-[#fff8ea] p-4 text-sm text-[#7d6032]">
                  <p className="font-semibold">{csvImportStatus === "validating" ? "Validating CSV..." : "Importing guests..."}</p>
                  <p className="mt-1">Checking required columns, row values, RSVP statuses, attendee counts, and duplicate guest names.</p>
                </div>
              ) : null}
              {csvImportStatus === "duplicates" && csvDuplicateNames.length ? (
                <div className="mt-3 rounded-2xl border border-[#ecd8b7] bg-[#fff8ea] p-4 text-sm text-[#7d6032]">
                  <p className="font-semibold">Potential duplicate guests found</p>
                  <p className="mt-1">These names already exist or repeat in the uploaded CSV: {csvDuplicateNames.join(", ")}.</p>
                  <p className="mt-2">Choose how Wedding OS should handle those rows.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void importValidatedCsv(pendingCsvImport, "overwrite")}
                      className="rounded-full bg-[#191714] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Overwrite existing
                    </button>
                    <button
                      type="button"
                      onClick={() => void importValidatedCsv(pendingCsvImport, "create")}
                      className="rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-xs font-semibold text-[#6f6a61]"
                    >
                      Create new anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => void importValidatedCsv(pendingCsvImport, "skip")}
                      className="rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-xs font-semibold text-[#6f6a61]"
                    >
                      Do not import duplicates
                    </button>
                  </div>
                </div>
              ) : null}
              {csvErrors.length ? (
                <div className="mt-3 rounded-2xl border border-[#f0c9c9] bg-[#fff4f3] p-4 text-sm text-[#93484d]">
                  <p className="font-semibold">Validation failed</p>
                  <p className="mt-1">Upload a modified CSV and try Import again when ready.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {csvErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {csvImportStatus === "complete" ? (
                <div className="mt-3 rounded-2xl border border-[#dce8d3] bg-[#f7fbf4] p-4 text-sm text-[#61735f]">
                  <p className="font-semibold">Import complete</p>
                  <p className="mt-1">Guest records have been added to this wedding.</p>
                </div>
              ) : null}
            </section>
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-4">
              <h4 className="font-semibold">Export guests</h4>
              <p className="mt-1 text-sm text-[#6f6a61]">Download the current guest table as a CSV file for spreadsheet review or offline updates.</p>
              <button
                type="button"
                onClick={async () => {
                  const result = await exportGuestsCsv({});
                  downloadCsv("wedding-os-guests.csv", result);
                }}
                className="mt-4 flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61]"
              >
                <Download size={16} />
                Export CSV
              </button>
            </section>
          </div>
        </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#eee7dd]">
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full border-collapse bg-white text-left text-sm">
              <thead className="bg-[#fbf5ec] text-xs uppercase tracking-[0.14em] text-[#8f7450]">
                <tr>
                  <th className="px-4 py-3">{sortableHeader("name", "Guest", "left")}</th>
                  <th className="px-4 py-3 text-center">{sortableHeader("attendeeCount", "# of Attendees")}</th>
                  <th className="px-4 py-3 text-center">Events RSVP</th>
                  {visibleColumns.contact ? <th className="px-4 py-3 text-center">Contact</th> : null}
                  <th className="px-4 py-3 text-center">{sortableHeader("group", "Group")}</th>
                  {visibleColumns.mealChoice ? <th className="px-4 py-3 text-center">{sortableHeader("mealChoice", "Meal")}</th> : null}
                  {visibleColumns.tableNumber ? <th className="px-4 py-3 text-center">{sortableHeader("tableNumber", "Table")}</th> : null}
                  {visibleColumns.notes ? <th className="px-4 py-3 text-center">Notes</th> : null}
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adding ? (
                  <tr className="border-t border-[#eee7dd] bg-[#fffaf2] align-top">
                    <td className="px-4 py-3">
                      <input
                        value={newGuest.name}
                        onChange={(event) => setNewGuest((guest) => ({ ...guest, name: event.target.value }))}
                        placeholder="Guest name"
                        className={`h-10 w-full rounded-full border bg-white px-3 text-sm outline-none focus:border-[#c8a97e] ${
                          newGuest.name.trim() ? "border-[#e7dfd3]" : "border-[#d78f8f]"
                        }`}
                      />
                      {!newGuest.name.trim() ? <p className="mt-1 text-xs font-semibold text-[#93484d]">Required</p> : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-semibold text-[#191714]">1</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full border border-[#e6dbc9] bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#8a6635]">
                        All events after save
                      </span>
                    </td>
                    {visibleColumns.contact ? (
                      <td className="px-4 py-3 text-center">
                        <input
                          value={newGuest.email}
                          onChange={(event) => setNewGuest((guest) => ({ ...guest, email: event.target.value }))}
                          placeholder="Email"
                          className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-center text-sm outline-none focus:border-[#c8a97e]"
                        />
                        <input
                          value={newGuest.phone}
                          onChange={(event) => setNewGuest((guest) => ({ ...guest, phone: event.target.value }))}
                          placeholder="Phone"
                          className="mt-2 h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-center text-sm outline-none focus:border-[#c8a97e]"
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-center">
                      <select
                        value={newGuest.group}
                        onChange={(event) => setNewGuest((guest) => ({ ...guest, group: event.target.value }))}
                        className={`h-10 w-full cursor-pointer rounded-full border bg-white px-3 text-center text-sm outline-none focus:border-[#c8a97e] ${
                          newGuest.group.trim() ? "border-[#e7dfd3]" : "border-[#d78f8f]"
                        }`}
                      >
                        <option value="">Select group</option>
                        {uniqueGroups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      {!newGuest.group.trim() ? <p className="mt-1 text-xs font-semibold text-[#93484d]">Required</p> : null}
                    </td>
                    {visibleColumns.mealChoice ? <td className="px-4 py-3 text-center text-[#6f6a61]">Pending</td> : null}
                    {visibleColumns.tableNumber ? <td className="px-4 py-3 text-center text-[#6f6a61]">TBD</td> : null}
                    {visibleColumns.notes ? <td className="px-4 py-3 text-center text-[#6f6a61]">-</td> : null}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void submitGuest()}
                          disabled={!newGuest.name.trim() || !newGuest.group.trim()}
                          className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d8d0c4]"
                          aria-label="Save new guest"
                        >
                          <Save size={15} />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setNewGuest({ name: "", email: "", phone: "", group: "", status: "Pending" });
                          }}
                          className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3]"
                          aria-label="Cancel new guest"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {filteredGuests.map((guest) => {
                  const editing = editingId === guest.id && draft;
                  return (
                    <tr
                      key={guest.id}
                      ref={editing ? editingRowRef : null}
                      className={`border-t border-[#eee7dd] align-top transition-colors ${editing ? "bg-[#fffaf2]" : "hover:bg-[#fffdf9]"}`}
                    >
                      {editing ? (
                        <>
                          <td className="px-4 py-3">
                            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                            <div className="mt-3 space-y-2 border-l border-[#e7dfd3] pl-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7450]">Additional Guests</p>
                                <button
                                  type="button"
                                  onClick={() => setDraft({ ...draft, companionNames: [...draft.companionNames, ""] })}
                                  className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                                  title="Add Additional Guest"
                                  aria-label="Add Additional Guest"
                                >
                                  <Plus size={15} />
                                </button>
                              </div>
                              {draft.companionNames.length ? (
                                draft.companionNames.map((name, index) => (
                                  <div key={index} className="flex gap-2">
                                    <input
                                      value={name}
                                      onChange={(event) => {
                                        const nextNames = [...draft.companionNames];
                                        nextNames[index] = event.target.value;
                                        setDraft({ ...draft, companionNames: nextNames });
                                      }}
                                      className="h-10 min-w-0 flex-1 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm"
                                      placeholder="Enter guest name"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setDraft({ ...draft, companionNames: draft.companionNames.filter((_, itemIndex) => itemIndex !== index) })}
                                      className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                                      aria-label={`Remove subguest ${index + 1}`}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#6f6a61]">No subguests listed.</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <p className="font-semibold text-[#191714]">{1 + draft.companionNames.length}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex max-w-[220px] flex-wrap justify-center gap-1">
                              {eventBadgesForGuest(guest, eventFilter).length ? (
                                eventBadgesForGuest(guest, eventFilter).map((eventBadge) => (
                                  <span key={`${guest.id}-${eventBadge.eventName}-${eventBadge.status}`} className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${rsvpStatusClass(eventBadge.status)}`}>
                                    {eventBadge.eventName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#8f877a]">No event invite</span>
                              )}
                            </div>
                          </td>
                          {visibleColumns.contact ? (
                            <td className="px-4 py-3 text-center">
                              <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" placeholder="Email" />
                              <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="mt-2 h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" placeholder="Phone" />
                            </td>
                          ) : null}
                          <td className="px-4 py-3 text-center">
                            <select value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })} className="h-10 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-3 text-center text-sm">
                              {uniqueGroups.map((group) => (
                                <option key={group.id} value={group.name}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          {visibleColumns.mealChoice ? <td className="px-4 py-3 text-center"><input value={draft.mealChoice} onChange={(event) => setDraft({ ...draft, mealChoice: event.target.value })} className="h-10 w-full rounded-full border border-[#e7dfd3] bg-white px-3 text-center text-sm" /></td> : null}
                          {visibleColumns.tableNumber ? (
                            <td className="px-4 py-3 text-center">
                              <select value={draft.tableNumber} onChange={(event) => setDraft({ ...draft, tableNumber: event.target.value })} className="h-10 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-3 text-center text-sm">
                                <option value="">TBD</option>
                                {tableOptions.map((tableNumber) => (
                                  <option key={tableNumber} value={tableNumber}>
                                    Table {tableNumber}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ) : null}
                          {visibleColumns.notes ? (
                            <td className="px-4 py-3 text-center">
                              <textarea
                                value={draft.notes}
                                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                                maxLength={notesCharacterLimit}
                                className="min-h-24 w-full rounded-2xl border border-[#e7dfd3] bg-white px-3 py-2 text-sm outline-none focus:border-[#c8a97e]"
                              />
                              <p className="mt-1 text-right text-xs text-[#8f877a]">{draft.notes.length}/{notesCharacterLimit}</p>
                            </td>
                          ) : null}
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => void saveDraft(guest.id)} className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white" aria-label={`Save ${guest.name}`}>
                                <Save size={15} />
                                Save
                              </button>
                              <button type="button" onClick={requestCloseEditor} className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3]" aria-label="Cancel editing">
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {(() => {
                            const companionNames = parseCompanionNames(guest);
                            const eventBadges = eventBadgesForGuest(guest, eventFilter);
                            return (
                              <>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => beginEditingGuest(guest)}
                              className="block w-full rounded-xl p-1 text-left transition hover:bg-[#fff4e4]"
                              aria-label={`Edit guest details for ${guest.name}`}
                            >
                              <span className="block font-semibold">{guest.name}</span>
                              {companionNames.length ? (
                                <span className="mt-2 block space-y-1 border-l border-[#e7dfd3] pl-3">
                                  {companionNames.map((name, index) => (
                                    <span key={`${guest.id}-companion-${index}`} className="block text-xs text-[#6f6a61]">
                                      {formatCompanionName(name, index)}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => beginEditingGuest(guest)}
                              className="mx-auto rounded-xl px-3 py-2 font-semibold text-[#191714] transition hover:bg-[#fff4e4]"
                              aria-label={`Edit attendees for ${guest.name}`}
                            >
                              {1 + companionNames.length}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => beginEditingGuest(guest)}
                              className="mx-auto flex max-w-[240px] flex-wrap justify-center gap-1 rounded-xl p-1 transition hover:bg-[#fff4e4]"
                              aria-label={`View event RSVP statuses for ${guest.name}`}
                            >
                              {eventBadges.length ? (
                                eventBadges.slice(0, 4).map((eventBadge) => (
                                  <span key={`${guest.id}-${eventBadge.eventName}-${eventBadge.status}`} className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${rsvpStatusClass(eventBadge.status)}`}>
                                    {eventBadge.eventName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#8f877a]">No event invite</span>
                              )}
                              {eventBadges.length > 4 ? (
                                <span className="rounded-full bg-[#191714] px-2 py-1 text-[11px] font-semibold text-white">+{eventBadges.length - 4}</span>
                              ) : null}
                            </button>
                          </td>
                          {visibleColumns.contact ? (
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => beginEditingGuest(guest)}
                                className="mx-auto block w-full rounded-xl p-1 text-center transition hover:bg-[#fff4e4]"
                                aria-label={`Edit contact for ${guest.name}`}
                              >
                                <span className="block text-sm text-[#6f6a61]">{guest.email ?? "No email"}</span>
                                {guest.phone ? <span className="mt-1 block text-xs text-[#8f877a]">{guest.phone}</span> : null}
                              </button>
                            </td>
                          ) : null}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => beginEditingGuest(guest)}
                              className="mx-auto rounded-xl px-3 py-2 text-[#6f6a61] transition hover:bg-[#fff4e4]"
                              aria-label={`Edit group for ${guest.name}`}
                            >
                              {guest.group}
                            </button>
                          </td>
                          {visibleColumns.mealChoice ? (
                            <td className="px-4 py-3 text-center">
                              <button type="button" onClick={() => beginEditingGuest(guest)} className="mx-auto rounded-xl px-3 py-2 text-[#6f6a61] transition hover:bg-[#fff4e4]" aria-label={`Edit meal for ${guest.name}`}>
                                {guest.mealChoice || "Pending"}
                              </button>
                            </td>
                          ) : null}
                          {visibleColumns.tableNumber ? (
                            <td className="px-4 py-3 text-center">
                              <button type="button" onClick={() => beginEditingGuest(guest)} className="mx-auto rounded-xl px-3 py-2 text-[#6f6a61] transition hover:bg-[#fff4e4]" aria-label={`Edit table for ${guest.name}`}>
                                {guest.tableNumber ?? "TBD"}
                              </button>
                            </td>
                          ) : null}
                          {visibleColumns.notes ? (
                            <td className="max-w-[220px] px-4 py-3 text-center">
                              <button type="button" onClick={() => beginEditingGuest(guest)} className="mx-auto block w-full rounded-xl px-3 py-2 text-center text-[#6f6a61] transition hover:bg-[#fff4e4]" aria-label={`Edit notes for ${guest.name}`}>
                                {guest.notes ?? ""}
                              </button>
                            </td>
                          ) : null}
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={async () => {
                                  await sendRsvpReminder({ guestId: guest.id });
                                  setNotice(`Reminder queued for ${guest.name}.`);
                                  router.refresh();
                                }}
                                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                                aria-label={`Remind ${guest.name}`}
                              >
                                <Send size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  beginEditingGuest(guest);
                                }}
                                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                                aria-label={`Edit ${guest.name}`}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={async () => {
                                  await deleteGuest({ guestId: guest.id });
                                  router.refresh();
                                }}
                                className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                                aria-label={`Delete ${guest.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredGuests.length ? <p className="border-t border-[#eee7dd] bg-white p-5 text-sm text-[#6f6a61]">No guests match the current filters.</p> : null}
        </div>
      </section>

      {discardPrompt ? (
        <div data-unsaved-dialog="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#191714]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Unsaved changes</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Save guest changes?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
              You changed this guest row. Save your updates before leaving the row, or discard the changes and continue.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDiscardPrompt(null)}
                className="h-11 rounded-full border border-[#e7dfd3] bg-white px-5 text-sm font-semibold text-[#6f6a61]"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={discardDraftChanges}
                className="h-11 rounded-full border border-[#e7dfd3] bg-white px-5 text-sm font-semibold text-[#93484d]"
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={() => void saveDraftChangesFromPrompt()}
                className="h-11 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {linkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191714]/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#eee7dd] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">RSVP links</p>
                <h2 className="font-display text-3xl font-semibold">Send and track RSVP links</h2>
                <p className="mt-1 text-sm text-[#6f6a61]">Choose recipients, customize the reminder, generate links, and monitor responses from one place.</p>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                aria-label="Close RSVP link modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-98px)] overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <section className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                    <h3 className="font-display text-2xl font-semibold">Recipients</h3>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[
                        { label: "Pending guests", value: "pending", detail: `${pending} waiting` },
                        { label: "All guests", value: "all", detail: `${guests.length} total` },
                        { label: "Specific group", value: "group", detail: "Choose one group" },
                        { label: "Specific guests", value: "specific", detail: "Pick people manually" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLinkTargetMode(option.value as RsvpLinkTargetMode)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            linkTargetMode === option.value ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714] hover:border-[#c8a97e]"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className={`mt-1 block text-xs ${linkTargetMode === option.value ? "text-white/75" : "text-[#6f6a61]"}`}>{option.detail}</span>
                        </button>
                      ))}
                    </div>

                    {linkTargetMode === "group" ? (
                      <select
                        value={linkGroupName}
                        onChange={(event) => setLinkGroupName(event.target.value)}
                        className="mt-4 h-11 w-full cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold"
                      >
                        <option value="">Select guest group</option>
                        {uniqueGroups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name} ({group.guestCount})
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {linkTargetMode === "specific" ? (
                      <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-[#e7dfd3] bg-white">
                        {guests.map((guest) => {
                          const checked = selectedGuestIds.includes(guest.id);
                          return (
                            <label key={guest.id} className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#f0e8dc] px-4 py-3 last:border-b-0">
                              <span>
                                <span className="block text-sm font-semibold">{guest.name}</span>
                                <span className="block text-xs text-[#6f6a61]">{guest.group} - {guest.email ?? "No email on file"}</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setSelectedGuestIds((ids) =>
                                    event.target.checked ? [...ids, guest.id] : ids.filter((id) => id !== guest.id),
                                  );
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                    <h3 className="font-display text-2xl font-semibold">Message and link settings</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-[#4d463d]">Reminder message</span>
                        <textarea
                          value={linkMessage}
                          onChange={(event) => setLinkMessage(event.target.value)}
                          className="h-32 w-full rounded-2xl border border-[#e7dfd3] bg-white px-4 py-3 text-sm outline-none focus:border-[#c8a97e]"
                          maxLength={1000}
                        />
                      </label>
                      <div className="space-y-4">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[#4d463d]">Expires after</span>
                          <div className="flex h-11 items-center rounded-full border border-[#e7dfd3] bg-white px-4">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={linkExpiresInDays}
                              onChange={(event) => setLinkExpiresInDays(Number(event.target.value))}
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                            />
                            <span className="text-sm text-[#6f6a61]">days</span>
                          </div>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e7dfd3] bg-white p-3 text-sm font-semibold">
                          <input type="checkbox" checked={sendLinkEmail} onChange={(event) => setSendLinkEmail(event.target.checked)} />
                          Queue emails now
                        </label>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-5">
                  <section className="rounded-2xl border border-[#e7dfd3] bg-white p-4">
                    <h3 className="font-display text-2xl font-semibold">Ready to send</h3>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-2xl bg-[#faf7f1] p-3">
                        <p className="text-2xl font-semibold">{linkTargets.length}</p>
                        <p className="text-xs text-[#6f6a61]">Selected</p>
                      </div>
                      <div className="rounded-2xl bg-[#faf7f1] p-3">
                        <p className="text-2xl font-semibold">{linkTargetsWithEmail}</p>
                        <p className="text-xs text-[#6f6a61]">With email</p>
                      </div>
                      <div className="rounded-2xl bg-[#faf7f1] p-3">
                        <p className="text-2xl font-semibold">{linkTargetsWithExistingLinks}</p>
                        <p className="text-xs text-[#6f6a61]">Existing links</p>
                      </div>
                      <div className="rounded-2xl bg-[#faf7f1] p-3">
                        <p className="text-2xl font-semibold">{linkTargetsNeedingLinks}</p>
                        <p className="text-xs text-[#6f6a61]">New links</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!linkTargets.length || sendingLinks || (linkTargetMode === "group" && !linkGroupName)}
                      onClick={async () => {
                        if (!linkTargets.length) return;
                        setSendingLinks(true);
                        try {
                          const result = await sendRsvpLinks({
                            guestIds: linkTargets.map((guest) => guest.id),
                            message: linkMessage,
                            expiresInDays: linkExpiresInDays || 30,
                            sendEmail: sendLinkEmail,
                          });
                          setNotice(
                            `Prepared ${result.total} RSVP links (${result.created} new, ${result.reused} existing)${sendLinkEmail ? ` and queued ${result.emailed} emails` : ""}.`,
                          );
                          router.refresh();
                        } finally {
                          setSendingLinks(false);
                        }
                      }}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d8d0c4]"
                    >
                      <Send size={16} />
                      {sendingLinks ? "Preparing links..." : sendLinkEmail ? "Send RSVP links" : "Prepare RSVP links"}
                    </button>
                    {sendLinkEmail && linkTargets.length > linkTargetsWithEmail ? (
                      <p className="mt-3 rounded-2xl bg-[#fff8ea] p-3 text-xs font-semibold text-[#8a6635]">
                        {linkTargets.length - linkTargetsWithEmail} selected guests do not have email addresses. Their links will be created for manual sharing.
                      </p>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-[#e7dfd3] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl font-semibold">Track links</h3>
                      <span className="rounded-full bg-[#faf7f1] px-3 py-1 text-xs font-semibold text-[#8a6635]">{data.publicTokens.length} total</span>
                    </div>
                    <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
                      {data.publicTokens.length ? (
                        data.publicTokens.map((token) => (
                          <article key={token.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{token.guestName ?? "Guest link"}</p>
                                <p className="mt-1 truncate text-xs text-[#6f6a61]">{token.url}</p>
                                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8f877a]">
                                  Sent {new Date(token.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8f877a]">
                                  {token.usedAt ? `Submitted ${new Date(token.usedAt).toLocaleDateString("en-CA")}` : "Not submitted"}
                                  {token.expiresAt ? ` - expires ${new Date(token.expiresAt).toLocaleDateString("en-CA")}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard?.writeText(token.url);
                                      setNotice(`Copied RSVP link for ${token.guestName ?? "guest"}.`);
                                    } catch {
                                      setNotice(`Copy blocked by browser permissions. Link: ${token.url}`);
                                    }
                                  }}
                                  className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61]"
                                  aria-label={`Copy RSVP link for ${token.guestName ?? "guest"}`}
                                >
                                  <Copy size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deletePublicRsvpToken({ publicRsvpTokenId: token.id });
                                    router.refresh();
                                  }}
                                  className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                                  aria-label={`Delete RSVP link for ${token.guestName ?? "guest"}`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-[#faf7f1] p-4 text-sm text-[#6f6a61]">No RSVP links have been generated yet.</p>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
