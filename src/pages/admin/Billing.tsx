import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ReceiptText,
  FileDown,
  Building2,
  User,
  CalendarDays,
  Banknote,
  StickyNote,
  FilePlus2,
  CheckCircle2,
  ListChecks,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import sistalogoUrl from "@/assets/sistalogo.svg";
import sistastampUrl from "@/assets/sistastamp.svg";
import {
  type BillingDoc,
  type DocKind,
  type LineItem,
  STORAGE_KEY,
  computeTotals,
  emptyItem,
  money,
} from "./billing/types";
import { downloadBillingDocx } from "./billing/templateDocx";

// ─── Defaults ──────────────────────────────────────────────
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SEQ_KEY = "sista-events.billing.seq";

function seqKey(kind: DocKind): string {
  return `${SEQ_KEY}.${kind === "invoice" ? "inv" : "rct"}`;
}

function docNumberPrefix(kind: DocKind): string {
  return kind === "invoice" ? "INV" : "RCPT";
}

function formatDocNumber(kind: DocKind, year: number, n: number): string {
  return `${docNumberPrefix(kind)}-${year}-${String(n).padStart(3, "0")}`;
}

// Highest sequence already used by a saved document for this kind + year, so
// newly generated numbers never collide with existing (or imported) ones.
function maxDocNumberFromSaved(kind: DocKind, year: number): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const doc = saved && saved[kind] ? saved[kind] : null;
    const m = doc && doc.docNumber && /^[A-Z]{3}-(\d{4})-(\d+)$/.exec(doc.docNumber);
    if (!m) return 0;
    return Number(m[1]) === year ? Number(m[2]) : 0;
  } catch {
    return 0;
  }
}

function readSeq(kind: DocKind): { year: number; n: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(seqKey(kind)) || "null");
    if (parsed && typeof parsed.year === "number" && typeof parsed.n === "number") {
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return { year: new Date().getFullYear(), n: 0 };
}

function writeSeq(kind: DocKind, entry: { year: number; n: number }): void {
  localStorage.setItem(seqKey(kind), JSON.stringify(entry));
}

function nextDocNumber(kind: DocKind): string {
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

function createDefault(kind: DocKind): BillingDoc {
  const now = new Date();
  const due = new Date(now);
  due.setDate(now.getDate() + 14);
  return {
    kind,
    currency: "GHS",
    docNumber: nextDocNumber(kind),
    issueDate: iso(now),
    dueDate: iso(due),
    paidDate: iso(now),
    companyName: "Sista Events & Rentals",
    companyTagline: "Creating unforgettable moments with sizeable budget.",
    companyAddress: "Kasoa, Accra",
    companyEmail: "info@sistaevents.com",
    companyPhone: "0555 182 969",
    companyWebsite: "sistaevents.com",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    items: [emptyItem()],
    discountRate: 0,
    taxRate: 0,
    tt: 0,
    deposit: 0,
    notes:
      kind === "invoice"
        ? "A deposit secures your booking date. The balance is due before the event day. Please include your booking reference with any payment."
        : "This confirms payment for your booking. Keep this receipt for your records.",
    terms:
      "Convenience: no refunds for cancellations within 7 days of the event. Rescheduling is allowed up to 48 hours before the event, subject to availability.",
    paymentMethod:
      "MTN Mobile Money: 0555 182 969  ",
  };
}

function loadOrCreate(kind: DocKind): BillingDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const source = saved && saved[kind] ? saved[kind] : null;
    if (source) {
      const parsed: BillingDoc = { ...createDefault(kind), ...source, kind };
      parsed.items = Array.isArray(source.items) && source.items.length > 0 ? source.items : [emptyItem()];
      return parsed;
    }
  } catch {
    return createDefault(kind);
  }
  return createDefault(kind);
}

// ─── Small building blocks ─────────────────────────────────
function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-3 px-4 py-3 sm:flex-row">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

const inputCls =
  "h-9 text-sm rounded-xl border-slate-200/80 bg-white focus:border-amber-500 focus:ring-amber-500/20 transition-all";

// ─── Page ──────────────────────────────────────────────────
const Billing: React.FC = () => {
  const { toast } = useToast();
  const [kind, setKind] = useState<DocKind>("invoice");
  const [docs, setDocs] = useState<Record<DocKind, BillingDoc>>(() => ({
    invoice: loadOrCreate("invoice"),
    receipt: loadOrCreate("receipt"),
  }));
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const doc = docs[kind];

  // Autosave (debounced) + flash indicator
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1600);
      } catch {
        /* quota / private mode – ignore */
      }
    }, 650);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [docs]);

  const patchActive = useCallback((patch: Partial<BillingDoc> | ((d: BillingDoc) => BillingDoc)) => {
    setDocs((prev) => ({
      ...prev,
      [kind]: typeof patch === "function" ? patch(prev[kind]) : { ...prev[kind], ...patch },
    }));
  }, [kind]);

  // Item helpers
  const updateItem = (id: string, patch: Partial<LineItem>) => {
    patchActive((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const switchKind = (k: DocKind) => {
    setKind(k);
    setDocs((prev) => {
      if (prev[k]) return prev;
      return { ...prev, [k]: createDefault(k) };
    });
  };

  const newDocument = useCallback(() => {
    setDocs((prev) => ({ ...prev, [kind]: createDefault(kind) }));
    toast({ title: `New ${kind === "invoice" ? "invoice" : "receipt"}`, description: "Start filling in the details below." });
  }, [kind, toast]);

  const totals = useMemo(() => computeTotals(doc), [doc]);

  const handleDownload = useCallback(async () => {
    if (!doc.clientName.trim()) {
      toast({
        title: "Client name missing",
        description: "Add a client name before generating the document.",
        variant: "destructive",
      });
      return;
    }
    if (!doc.items.some((it) => it.description.trim() && it.qty > 0 && it.unitPrice > 0)) {
      toast({
        title: "No line items yet",
        description: "Add at least one item with description, quantity and price.",
        variant: "destructive",
      });
      return;
    }
    try {
      await downloadBillingDocx(doc);
      toast({
        title: `Your ${doc.kind} is ready`,
        description: `${money(totals.total, doc.currency)} .DOCX downloaded. Ready to share.`,
      });
    } catch (err) {
      toast({
        title: "Could not generate the document",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [doc, totals.total, toast]);

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="px-4 py-4 sm:px-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Billing</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                 fill in the details, preview live, download DOCX
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-saved
              </span>
            )}
            <button
              type="button"
              onClick={newDocument}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Kind switcher */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="inline-flex bg-slate-100/80 rounded-xl p-1 gap-1 w-full sm:w-auto">
            {(["invoice", "receipt"] as const).map((k) => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => switchKind(k)}
                  className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 flex-1 sm:flex-none ${
                    active
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {k} {!active && <span className="hidden sm:inline text-[10px] font-normal text-slate-400">{k === "invoice" ? "bill" : "paid"}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,460px] gap-6 items-start">
        {/* Form column */}
        <div className="space-y-5 min-w-0">
          {/* Document details */}
          <Section icon={<CalendarDays className="w-4 h-4" />} title="Document details" subtitle="IDs and dates">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Document no.">
                <Input value={doc.docNumber} onChange={(e) => patchActive({ docNumber: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Issue date">
                <Input type="date" value={doc.issueDate} onChange={(e) => patchActive({ issueDate: e.target.value })} className={inputCls} />
              </Field>
              <Field label={kind === "invoice" ? "Due date" : "Paid date"}>
                <Input
                  type="date"
                  value={kind === "invoice" ? doc.dueDate : doc.paidDate}
                  onChange={(e) => patchActive(kind === "invoice" ? { dueDate: e.target.value } : { paidDate: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* From */}
          <Section icon={<Building2 className="w-4 h-4" />} title="Business" subtitle="About the business">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Business name" className="sm:col-span-2">
                <Input value={doc.companyName} onChange={(e) => patchActive({ companyName: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tagline">
                <Input value={doc.companyTagline} onChange={(e) => patchActive({ companyTagline: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Address">
                <Input value={doc.companyAddress} onChange={(e) => patchActive({ companyAddress: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Email">
                <Input type="email" value={doc.companyEmail} onChange={(e) => patchActive({ companyEmail: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Phone">
                <Input value={doc.companyPhone} onChange={(e) => patchActive({ companyPhone: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Website" className="sm:col-span-2">
                <Input value={doc.companyWebsite} onChange={(e) => patchActive({ companyWebsite: e.target.value })} placeholder="e.g. sistaevents.com" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Bill to */}
          <Section icon={<User className="w-4 h-4" />} title="Client details" subtitle={`user ${kind} detailing`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Client name" className="sm:col-span-2">
                <Input value={doc.clientName} onChange={(e) => patchActive({ clientName: e.target.value })} placeholder="e.g. Ama Mensah" className={inputCls} />
              </Field>
              <Field label="Email">
                <Input type="email" value={doc.clientEmail} onChange={(e) => patchActive({ clientEmail: e.target.value })} placeholder="client@email.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <Input value={doc.clientPhone} onChange={(e) => patchActive({ clientPhone: e.target.value })} placeholder="e.g. 0244 000 000" className={inputCls} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Input value={doc.clientAddress} onChange={(e) => patchActive({ clientAddress: e.target.value })} placeholder="e.g. East Legon, Accra" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Line items */}
          <Section
            icon={<ListChecks className="w-4 h-4" />}
            title="items"
            subtitle="Description of services"
          >
            <div className="space-y-2">
              {kind === "invoice" ? (
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5 grid grid-cols-2 sm:grid-cols-[1fr,80px,110px,auto] gap-2 items-center">
                  {doc.items[0] && (
                    <>
                      <div className="col-span-2 sm:col-auto">
                        <Field label="Item">
                          <Input
                            value={doc.items[0].description}
                            onChange={(e) => updateItem(doc.items[0].id, { description: e.target.value })}
                            placeholder="e.g. Marquee tent (20×20 ft)"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <Field label="Qty">
                        <Input
                          type="number"
                          min={0}
                          value={Number.isFinite(doc.items[0].qty) ? doc.items[0].qty : 0}
                          onChange={(e) => updateItem(doc.items[0].id, { qty: Math.max(0, Number(e.target.value)) })}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Unit price">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={Number.isFinite(doc.items[0].unitPrice) ? doc.items[0].unitPrice : 0}
                          onChange={(e) => updateItem(doc.items[0].id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                          className={inputCls}
                        />
                      </Field>
                      <div className="flex flex-col items-start justify-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 hidden sm:block">Amount</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums whitespace-nowrap">
                          {money((doc.items[0].qty || 0) * (doc.items[0].unitPrice || 0), doc.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5">
                  {doc.items[0] && (
                    <Field label="Item">
                      <Input
                        value={doc.items[0].description}
                        onChange={(e) => updateItem(doc.items[0].id, { description: e.target.value })}
                        placeholder="e.g. Marquee tent (20×20 ft)"
                        className={inputCls}
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Totals & adjustments */}
          <Section icon={<Banknote className="w-4 h-4" />} title="Calculations" subtitle="Automated discounts and tax deposits">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label={`Discount %`}>
                <Input
                  type="number" min={0} max={100} step="0.5"
                  value={doc.discountRate}
                  onChange={(e) => patchActive({ discountRate: Math.max(0, Math.min(100, Number(e.target.value))) })}
                  className={inputCls}
                />
              </Field>
              <Field label="Tax %">
                <Input
                  type="number" min={0} max={100} step="0.5"
                  value={doc.taxRate}
                  onChange={(e) => patchActive({ taxRate: Math.max(0, Math.min(100, Number(e.target.value))) })}
                  className={inputCls}
                />
              </Field>
              <Field label="T & T amount" hint="Taxes & tariffs added to the bill">
                <Input
                  type="number" min={0} step="0.01"
                  value={doc.tt}
                  onChange={(e) => patchActive({ tt: Math.max(0, Number(e.target.value)) })}
                  className={inputCls}
                />
              </Field>
              {kind === "invoice" ? (
                <Field label="Deposit paid">
                  <Input
                    type="number" min={0} step="0.01"
                    value={doc.deposit}
                    onChange={(e) => patchActive({ deposit: Math.max(0, Number(e.target.value)) })}
                    className={inputCls}
                  />
                </Field>
              ) : (
                <Field label="Payment method (receipt)">
                  <Input
                    value={doc.paymentMethod}
                    onChange={(e) => patchActive({ paymentMethod: e.target.value })}
                    placeholder="e.g. MTN MoMo +2330 000 000"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>

            {/* Live totals strip */}
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50 to-white p-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <TotalChip label="Subtotal" value={money(totals.subtotal, doc.currency)} />
              {doc.discountRate > 0 && <TotalChip label={`Discount (-${doc.discountRate}%)`} value={`− ${money(totals.discountAmount, doc.currency)}`} muted />}
              {doc.taxRate > 0 && <TotalChip label={`Tax (+${doc.taxRate}%)`} value={money(totals.taxAmount, doc.currency)} muted />}
              {doc.tt > 0 && <TotalChip label="T & T" value={money(totals.tt, doc.currency)} muted />}
              {kind === "invoice" && doc.deposit > 0 && <TotalChip label="Deposit paid" value={`− ${money(doc.deposit, doc.currency)}`} muted />}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kind === "invoice" ? "Balance due" : "Amount paid"}</span>
                <span className="text-lg font-extrabold text-amber-600 tabular-nums">{money(kind === "invoice" ? totals.balanceDue : totals.total, doc.currency)}</span>
              </div>
            </div>
          </Section>

          {/* Payment / notes */}
          <Section icon={<StickyNote className="w-4 h-4" />} title="Payment details" subtitle="mode of client payments">
            <div className="space-y-3">
              <Field label={kind === "invoice" ? "Payment details" : "Payment summary"}>
                <textarea
                  value={doc.paymentMethod}
                  onChange={(e) => patchActive({ paymentMethod: e.target.value })}
                  rows={2}
                  className={`${inputCls} w-full h-auto py-2 resize-none`}
                  placeholder="Bank / mobile money details or a short summary"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Notes">
                  <textarea
                    value={doc.notes}
                    onChange={(e) => patchActive({ notes: e.target.value })}
                    rows={3}
                    className={`${inputCls} w-full h-auto py-2 resize-none`}
                  />
                </Field>
                <Field label={kind === "invoice" ? "Terms & conditions" : "Additional info"}>
                  <textarea
                    value={doc.terms}
                    onChange={(e) => patchActive({ terms: e.target.value })}
                    rows={3}
                    className={`${inputCls} w-full h-auto py-2 resize-none`}
                  />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* Preview column */}
        <div className="xl:sticky xl:top-0 space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="live-dot" />
                Live preview
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200/60 font-semibold">
              {doc.docNumber}
            </Badge>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-amber-500/70 via-amber-400/50 to-transparent" />
            <PreviewDocument doc={doc} />
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200/60 bg-white/60 backdrop-blur-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download {kind === "invoice" ? "Invoice" : "Receipt"} (.DOCX)
          </button>
        </div>
      </div>
    </div>
  );
};

function TotalChip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-widest ${muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <span className={`text-sm font-bold tabular-nums ${muted ? "text-slate-500" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

// ─── Live preview (mirrors the .DOCX template) ─────────────
function PreviewDocument({ doc }: { doc: BillingDoc }) {
  const totals = useMemo(() => computeTotals(doc), [doc]);
  const isInvoice = doc.kind === "invoice";
  const company = doc.companyName || "Sista Events & Rentals";
  const date = (d: string) => d.replace(/-/g, " / ");
  const grandTotal = isInvoice && doc.deposit > 0 ? totals.balanceDue : totals.total;

  return (
    <div className="bg-white text-slate-800 p-4 sm:p-7 text-[11px] leading-relaxed max-h-[640px] overflow-y-auto">
      {/* Header — Invoice left, logo + name right */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-2xl font-extrabold tracking-wide">{isInvoice ? "INVOICE" : "RECEIPT"}</h4>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <img src={sistalogoUrl} alt={`${company} logo`} className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-sm" />
          <h4 className="text-[13px] font-extrabold tracking-tight leading-tight text-right">{company}</h4>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-amber-500 to-amber-500/20 my-4" />

      {/* Bill to left + invoice details right */}
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Billed to</p>
          <p className="font-bold mt-1 text-slate-900">{doc.clientName || "Client Name"}</p>
          {doc.clientAddress && <p className="text-[10px] text-slate-500">{doc.clientAddress}</p>}
          {(doc.clientEmail || doc.clientPhone) && (
            <p className="text-[10px] text-slate-500">{[doc.clientEmail, doc.clientPhone].filter(Boolean).join(" / ")}</p>
          )}
        </div>
        <div className="text-right shrink-0 space-y-0.5 text-[10px]">
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest pb-1">
            {isInvoice ? "Invoice details" : "Receipt details"}
          </p>
          <p><span className="text-slate-400 font-semibold">NO. </span><span className="font-bold">{doc.docNumber}</span></p>
          <p><span className="text-slate-400">Issue </span>{date(doc.issueDate)}</p>
          <p>
            <span className="text-slate-400">{isInvoice ? "Due " : "Paid "}</span>
            {date(isInvoice ? doc.dueDate : doc.paidDate)}
          </p>
        </div>
      </div>

      {/* Line items — invoice: table with rate/qty/amount · receipt: description + centered bill total */}
      {isInvoice ? (
        <>
          <table className="w-full mt-4 text-[9px] sm:text-[10px] border-collapse">
            <thead>
              <tr className="text-white text-left">
                <th className="bg-slate-800 px-1.5 sm:px-2 py-1.5 font-semibold">Description</th>
                <th className="bg-slate-800 px-1.5 sm:px-2 py-1.5 font-semibold text-right">Rate</th>
                <th className="bg-slate-800 px-1.5 sm:px-2 py-1.5 font-semibold text-center">Qty</th>
                <th className="bg-slate-800 px-1.5 sm:px-2 py-1.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={it.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-1.5 sm:px-2 py-1.5 border border-slate-200 font-medium">{it.description || "Item"}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 border border-slate-200 text-right text-slate-500">{money(it.unitPrice || 0, doc.currency)}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 border border-slate-200 text-center text-slate-500">{it.qty || 0}</td>
                  <td className="px-1.5 sm:px-2 py-1.5 border border-slate-200 text-right font-bold">{money((it.qty || 0) * (it.unitPrice || 0), doc.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-3">
            <div>
              <div className="w-56 space-y-1 text-[10px]">
                <TotalLine label="Subtotal" value={money(totals.subtotal, doc.currency)} />
                <TotalLine label="T & T" value={money(totals.taxAmount - totals.discountAmount + totals.tt, doc.currency)} />
                {doc.deposit > 0 && <TotalLine label="Less deposit" value={`− ${money(doc.deposit, doc.currency)}`} />}
                <div className="flex justify-between items-center bg-orange-50 border border-slate-200 px-2 py-1 font-extrabold">
                  <span className="uppercase text-[9px] text-slate-700">Total</span>
                  <span className="tabular-nums text-amber-600 text-sm">{money(grandTotal, doc.currency)}</span>
                </div>
              </div>
              {/* Signature stamp — under the total */}
              <div className="flex justify-end mt-2">
                <img src={sistastampUrl} alt="Payment stamp" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Receipt — event description only */}
          <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50/40 px-3 divide-y divide-dashed divide-slate-200">
            {doc.items.map((it) => (
              <div key={it.id} className="py-1.5 font-semibold text-slate-800 leading-snug first:pt-2 last:pb-2">
                {it.description || "Item"}
              </div>
            ))}
          </div>

          {/* Receipt — bill total, centered */}
          <div className="text-center mt-5">
            <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1">{money(grandTotal, doc.currency)}</p>
          </div>
          {/* Signature stamp — under the total */}
          <div className="flex justify-end mt-2">
            <img src={sistastampUrl} alt="Payment stamp" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
          </div>
        </>
      )}

      {/* Footer — Ts & Cs */}
      <div className="mt-6 border-t-2 border-amber-500 pt-2 text-center">
        <p className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest">Ts &amp; Cs</p>
        <p className="text-[9px] text-slate-500 mt-1 px-2 whitespace-pre-wrap">
          {doc.terms ||
            "Payment confirms your booking. No refunds for cancellations within 7 days of the event; rescheduling is allowed up to 48 hours before the event, subject to availability."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 mt-2 text-[8px] text-slate-400 px-1">
          <Globe className="h-3 w-3 shrink-0" />
          <span>{doc.companyWebsite || "sistaevents.site"}</span>
          <span className="text-slate-300 mx-0.5"></span>
          <Phone className="h-3 w-3 shrink-0" />
          <span>{doc.companyPhone || "0555 182 969"}</span>
          <span className="text-slate-300 mx-0.5"></span>
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{doc.companyAddress || "Amanfro, Kasoa, Ghana"}</span>
        </div>
      </div>
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-slate-600">
      <span className="uppercase text-[9px] font-semibold text-slate-400 tracking-wide">{label}</span>
      <span className="tabular-nums font-semibold">{value}</span>
    </div>
  );
}

export default Billing;