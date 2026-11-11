import {
  type BillingDoc,
  type DocKind,
  STORAGE_KEY,
  emptyItem,
} from "./types";

export const ACTIVE_KIND_KEY = "sista-events.billing.active-kind";
export const SEQ_KEY = "sista-events.billing.seq";

export interface BillingDraftStorage {
  version: 2;
  activeKind: DocKind;
  updatedAt: number;
  docs: Record<DocKind, BillingDoc>;
  invoice?: BillingDoc;
  receipt?: BillingDoc;
}

export interface StoredDraftResult {
  activeKind: DocKind;
  updatedAt: number | null;
  docs: Record<DocKind, BillingDoc>;
  isRestored: boolean;
}

/**
 * Returns current calendar day date formatted as YYYY-MM-DD in the local timezone.
 * Using local date avoids UTC day shift anomalies around midnight.
 */
export function localIsoDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the default due date offset (e.g. 14 days ahead of from date) as YYYY-MM-DD.
 */
export function defaultDueDate(from: Date = new Date(), days = 14): string {
  const due = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return localIsoDate(due);
}

/**
 * Syncs unedited default dates with current day date.
 * If the admin has not manually edited a date field, it automatically syncs with today's date.
 * Once a date field is manually edited, it is preserved and will not be overwritten.
 */
export function syncDefaultDates(doc: BillingDoc): BillingDoc {
  const today = localIsoDate();
  const custom = doc.customDates || {};
  let changed = false;

  let nextIssue = doc.issueDate;
  if (!custom.issueDate) {
    if (nextIssue !== today) {
      nextIssue = today;
      changed = true;
    }
  }

  let nextDue = doc.dueDate;
  if (!custom.dueDate) {
    const expectedDue = defaultDueDate(new Date(), 14);
    if (nextDue !== expectedDue) {
      nextDue = expectedDue;
      changed = true;
    }
  }

  let nextPaid = doc.paidDate;
  if (!custom.paidDate) {
    if (nextPaid !== today) {
      nextPaid = today;
      changed = true;
    }
  }

  if (!changed) return doc;
  return {
    ...doc,
    issueDate: nextIssue,
    dueDate: nextDue,
    paidDate: nextPaid,
  };
}

export function seqKey(kind: DocKind): string {
  return `${SEQ_KEY}.${kind === "invoice" ? "inv" : "rct"}`;
}

export function docNumberPrefix(kind: DocKind): string {
  return kind === "invoice" ? "INV" : "RCPT";
}

export function formatDocNumber(kind: DocKind, year: number, n: number): string {
  return `${docNumberPrefix(kind)}-${year}-${String(n).padStart(3, "0")}`;
}

function getStoredItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch {
    // fallback to sessionStorage
  }
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}

export function maxDocNumberFromSaved(kind: DocKind, year: number): number {
  try {
    const raw = getStoredItem(STORAGE_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw);
    const doc = (saved?.docs?.[kind] || saved?.[kind]) as BillingDoc | undefined;
    const m = doc?.docNumber && /^[A-Z]{3,4}-(\d{4})-(\d+)$/.exec(doc.docNumber);
    if (!m) return 0;
    return Number(m[1]) === year ? Number(m[2]) : 0;
  } catch {
    return 0;
  }
}

export function readSeq(kind: DocKind): { year: number; n: number } {
  try {
    const raw = getStoredItem(seqKey(kind));
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.year === "number" && typeof parsed.n === "number") {
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return { year: new Date().getFullYear(), n: 0 };
}

export function writeSeq(kind: DocKind, entry: { year: number; n: number }): void {
  setStoredItem(seqKey(kind), JSON.stringify(entry));
}

export function nextDocNumber(kind: DocKind): string {
  const year = new Date().getFullYear();
  try {
    const entry = readSeq(kind);
    const fromDocs = maxDocNumberFromSaved(kind, year);
    const n = Math.max(entry.year === year ? entry.n : 0, fromDocs) + 1;
    writeSeq(kind, { year, n });
    return formatDocNumber(kind, year, n);
  } catch {
    return formatDocNumber(kind, year, 1);
  }
}

export function peekCurrentDocNumber(kind: DocKind): string {
  const year = new Date().getFullYear();
  try {
    const entry = readSeq(kind);
    const fromDocs = maxDocNumberFromSaved(kind, year);
    const n = Math.max(entry.year === year ? entry.n : 0, fromDocs, 1);
    return formatDocNumber(kind, year, n);
  } catch {
    return formatDocNumber(kind, year, 1);
  }
}

export function createDefaultDoc(kind: DocKind, docNumber?: string): BillingDoc {
  const now = new Date();
  return {
    kind,
    currency: "GHS",
    docNumber: docNumber || nextDocNumber(kind),
    issueDate: localIsoDate(now),
    dueDate: defaultDueDate(now, 14),
    paidDate: localIsoDate(now),
    companyName: "Sista Events & Rentals",
    companyTagline: "Creating unforgettable moments with sizeable budget.",
    companyAddress: "Kasoa, Accra",
    companyEmail: "info@sistaevents.com",
    companyPhone: "0555 182 969",
    companyWebsite: "sistaevents.site",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    items: [emptyItem()],
    discountRate: 0,
    taxRate: 0,
    tt: 0,
    serviceCharge: 0,
    deposit: 0,
    notes:
      kind === "invoice"
        ? "A deposit secures your booking date. The balance is due before the event day. Please include your booking reference with any payment."
        : "This confirms payment for your booking. Keep this receipt for your records.",
    terms:
      "Convenience: no refunds for cancellations within 7 days of the event. Rescheduling is allowed up to 48 hours before the event, subject to availability.",
    paymentMethod:
      "MTN Mobile Money: 0555 182 969  ",
    customDates: {},
  };
}

export function hasDraftContent(doc: BillingDoc | undefined): boolean {
  if (!doc) return false;
  if (
    doc.clientName.trim() ||
    doc.clientEmail.trim() ||
    doc.clientPhone.trim() ||
    doc.clientAddress.trim()
  ) {
    return true;
  }
  if (doc.items.some((it) => it.description.trim() || it.unitPrice > 0 || it.qty > 1)) {
    return true;
  }
  if (
    doc.discountRate > 0 ||
    doc.taxRate > 0 ||
    doc.tt > 0 ||
    doc.serviceCharge > 0 ||
    doc.deposit > 0
  ) {
    return true;
  }
  return false;
}

export function loadSavedDraft(): StoredDraftResult {
  let activeKind: DocKind = "invoice";
  try {
    const storedActive = getStoredItem(ACTIVE_KIND_KEY);
    if (storedActive === "invoice" || storedActive === "receipt") {
      activeKind = storedActive;
    }
  } catch {
    // ignore
  }

  try {
    const raw = getStoredItem(STORAGE_KEY);
    if (!raw) {
      return {
        activeKind,
        updatedAt: null,
        docs: {
          invoice: createDefaultDoc("invoice"),
          receipt: createDefaultDoc("receipt"),
        },
        isRestored: false,
      };
    }

    const parsed = JSON.parse(raw);
    const invoiceSource = parsed?.docs?.invoice || parsed?.invoice;
    const receiptSource = parsed?.docs?.receipt || parsed?.receipt;

    if (parsed?.activeKind === "invoice" || parsed?.activeKind === "receipt") {
      activeKind = parsed.activeKind;
    }

    const updatedAt = typeof parsed?.updatedAt === "number" ? parsed.updatedAt : null;

    const buildDoc = (kind: DocKind, source: Partial<BillingDoc> | undefined): BillingDoc => {
      if (source && typeof source === "object") {
        // Use existing docNumber if available to prevent burning next sequence numbers
        const base = createDefaultDoc(kind, source.docNumber || peekCurrentDocNumber(kind));
        const merged: BillingDoc = { ...base, ...source, kind };
        merged.items =
          Array.isArray(source.items) && source.items.length > 0 ? source.items : [emptyItem()];
        // Sync unedited default dates with current day date
        return syncDefaultDates(merged);
      }
      return createDefaultDoc(kind);
    };

    const invoice = buildDoc("invoice", invoiceSource);
    const receipt = buildDoc("receipt", receiptSource);

    const hasAnyContent = hasDraftContent(invoice) || hasDraftContent(receipt);

    return {
      activeKind,
      updatedAt,
      docs: { invoice, receipt },
      isRestored: hasAnyContent,
    };
  } catch {
    return {
      activeKind,
      updatedAt: null,
      docs: {
        invoice: createDefaultDoc("invoice"),
        receipt: createDefaultDoc("receipt"),
      },
      isRestored: false,
    };
  }
}

export function saveDraftToStorage(docs: Record<DocKind, BillingDoc>, activeKind: DocKind): number {
  const now = Date.now();
  const payload: BillingDraftStorage = {
    version: 2,
    activeKind,
    updatedAt: now,
    docs,
    invoice: docs.invoice,
    receipt: docs.receipt,
  };
  const serialized = JSON.stringify(payload);
  setStoredItem(STORAGE_KEY, serialized);
  setStoredItem(ACTIVE_KIND_KEY, activeKind);
  return now;
}

export function formatRelativeSavedTime(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 8000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
