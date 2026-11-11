import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import {
  ReceiptText,
  FileDown,
  Eye,
  Save,
  Building2,
  User,
  CalendarDays,
  Banknote,
  Calculator,
  StickyNote,
  FilePlus2,
  CheckCircle2,
  ListChecks,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Globe,
  WifiOff,
  Loader2,
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
import { buildBillingHtml, downloadBillingHtml } from "./billing/templateHtml";
import {
  loadSavedDraft,
  saveDraftToStorage,
  createDefaultDoc,
  nextDocNumber,
  hasDraftContent,
  formatRelativeSavedTime,
  localIsoDate,
  defaultDueDate,
  syncDefaultDates,
} from "./billing/storage";

// ─── Small building blocks ─────────────────────────────────
function Field({
  label,
  hint,
  action,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</span>
        {action}
      </div>
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
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-xs hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 px-4 py-3 sm:flex-row">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-100 to-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
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
  const { confirm } = useAdminConfirm();

  // Load existing draft from storage (supports offline, tab break restoration, and previous active tab)
  const initialDraft = useMemo(() => loadSavedDraft(), []);

  const [kind, setKind] = useState<DocKind>(initialDraft.activeKind);
  const [docs, setDocs] = useState<Record<DocKind, BillingDoc>>(initialDraft.docs);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(initialDraft.updatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const [, setTimeTick] = useState(0);

  const doc = docs[kind];

  // Up-to-date refs for synchronous flushes without stale closure issues
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const kindRef = useRef(kind);
  kindRef.current = kind;
  const isDirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  // Synchronous flush: immediately commits any pending in-memory edits to storage
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      const savedTime = saveDraftToStorage(docsRef.current, kindRef.current);
      isDirtyRef.current = false;
      setLastSavedAt(savedTime);
      setIsSaving(false);
    }
  }, []);

  // Synchronizes unedited dates with current day date on mount, navigation, or visibility changes
  const syncCurrentDayDates = useCallback(() => {
    setDocs((prev) => {
      const syncedInvoice = syncDefaultDates(prev.invoice);
      const syncedReceipt = syncDefaultDates(prev.receipt);
      if (syncedInvoice === prev.invoice && syncedReceipt === prev.receipt) {
        return prev;
      }
      const updated = { invoice: syncedInvoice, receipt: syncedReceipt };
      docsRef.current = updated;
      saveDraftToStorage(updated, kindRef.current);
      return updated;
    });
  }, []);

  useEffect(() => {
    syncCurrentDayDates();
  }, [syncCurrentDayDates]);

  // 1. Unmount cleanup: flushes edits immediately when navigating between admin tabs
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  // 2. Tab visibility changes: switching browser tabs or minimizing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSave();
      } else if (document.visibilityState === "visible") {
        // Tab became active again:
        // Sync default dates with current day date
        syncCurrentDayDates();
        // Sync if updated by another tab while hidden
        try {
          const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              typeof parsed?.updatedAt === "number" &&
              parsed.updatedAt > (lastSavedAt || 0) &&
              !isDirtyRef.current
            ) {
              const latest = loadSavedDraft();
              setDocs(latest.docs);
              docsRef.current = latest.docs;
              if (latest.updatedAt) setLastSavedAt(latest.updatedAt);
            }
          }
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flushSave, lastSavedAt, syncCurrentDayDates]);

  // 3. Window closing or page reload: synchronous save
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [flushSave]);

  // 4. Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.docs && !isDirtyRef.current) {
            setDocs(parsed.docs);
            docsRef.current = parsed.docs;
            if (parsed.activeKind && (parsed.activeKind === "invoice" || parsed.activeKind === "receipt")) {
              setKind(parsed.activeKind);
              kindRef.current = parsed.activeKind;
            }
            if (typeof parsed.updatedAt === "number") {
              setLastSavedAt(parsed.updatedAt);
            }
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 5. Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Your network connection is restored.",
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      flushSave();
      toast({
        title: "Working offline",
        description: "All changes continue to be autosaved locally.",
      });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushSave, toast]);

  // 6. Live relative time tick every 10 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  // Persist every edit immediately so the latest input survives interruptions.
  const patchActive = useCallback(
    (patch: Partial<BillingDoc> | ((d: BillingDoc) => BillingDoc)) => {
      const current = docsRef.current;
      const nextDoc =
        typeof patch === "function" ? patch(current[kind]) : { ...current[kind], ...patch };
      const updated = { ...current, [kind]: nextDoc };
      docsRef.current = updated;
      setDocs(updated);
      const savedTime = saveDraftToStorage(updated, kind);
      isDirtyRef.current = false;
      setLastSavedAt(savedTime);
      setIsSaving(false);
    },
    [kind]
  );

  // Item helpers
  const updateItem = (id: string, patch: Partial<LineItem>) => {
    patchActive((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    patchActive((d) => ({ ...d, items: [...d.items, emptyItem()] }));
  };

  const removeItem = (id: string) => {
    patchActive((d) => {
      const items = d.items.filter((it) => it.id !== id);
      return { ...d, items: items.length > 0 ? items : [emptyItem()] };
    });
  };

  const switchKind = (k: DocKind) => {
    if (k === kind) return;
    flushSave();
    setKind(k);
    kindRef.current = k;
    setDocs((prev) => {
      const target = prev[k] ? syncDefaultDates(prev[k]) : createDefaultDoc(k);
      const updated = { ...prev, [k]: target };
      docsRef.current = updated;
      saveDraftToStorage(updated, k);
      return updated;
    });
  };

  const newDocument = useCallback(async () => {
    if (hasDraftContent(doc)) {
      const confirmed = await confirm({
        title: `Start new ${kind === "invoice" ? "invoice" : "receipt"}?`,
        description: `You have filled in details on this ${kind}. Starting a new document will clear the current draft and assign the next document number.`,
        confirmLabel: "Start New",
        cancelLabel: "Keep Editing",
        destructive: true,
      });
      if (!confirmed) return;
    }
    const fresh = createDefaultDoc(kind, nextDocNumber(kind));
    setDocs((prev) => {
      const updated = { ...prev, [kind]: fresh };
      docsRef.current = updated;
      saveDraftToStorage(updated, kind);
      return updated;
    });
    setLastSavedAt(Date.now());
    isDirtyRef.current = false;
    toast({
      title: `New ${kind === "invoice" ? "invoice" : "receipt"} created`,
      description: `Document ${fresh.docNumber} is ready for details.`,
    });
  }, [confirm, doc, kind, toast]);

  const totals = useMemo(() => computeTotals(doc), [doc]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openBrowserPreview = useCallback(() => {
    flushSave();
    const blob = new Blob([buildBillingHtml(doc)], { type: "text/html;charset=utf-8" });
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(blob);
    });
  }, [doc, flushSave]);

  const closeBrowserPreview = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  const printBrowserPreview = useCallback(() => {
    previewFrameRef.current?.contentWindow?.focus();
    previewFrameRef.current?.contentWindow?.print();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!doc.clientName.trim()) {
      toast({
        title: "Client name missing",
        description: "Add a client name before generating the document.",
        variant: "destructive",
      });
      return;
    }
    const hasRequiredContent = doc.kind === "receipt"
      ? doc.items.some((it) => it.description.trim()) && (doc.deposit > 0 || totals.total > 0)
      : doc.items.some((it) => it.description.trim() && it.qty > 0 && it.unitPrice > 0);
    if (!hasRequiredContent) {
      toast({
        title: doc.kind === "receipt" ? "Receipt details missing" : "No line items yet",
        description: doc.kind === "receipt"
          ? "Add a receipt description and an amount or deposit."
          : "Add at least one item with description, quantity and price.",
        variant: "destructive",
      });
      return;
    }
    try {
      flushSave();
      await downloadBillingDocx(doc);
      const downloadedAmount = doc.kind === "receipt" ? (doc.deposit > 0 ? doc.deposit : totals.total) : totals.total;
      toast({
        title: `Your ${doc.kind} is ready`,
        description: `${money(downloadedAmount, doc.currency)} .DOCX downloaded. Ready to share.`,
      });
    } catch (err) {
      toast({
        title: "Could not generate the document",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [doc, totals, toast, flushSave]);

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-xs overflow-hidden">
        <div className="h-[2px] bg-linear-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Billing</h2>
              </div>
            </div>
          </div>

          {/* Status pill & Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Autosave / Online status pill */}
            {!isOnline ? (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50/90 border border-amber-200/80 rounded-full px-2.5 py-1 shadow-xs"
                title="You are working offline. Everything is autosaved locally on this browser."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Offline • Saved locally</span>
              </span>
            ) : isSaving ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100/90 border border-slate-200/60 rounded-full px-2.5 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Saving draft...</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 rounded-full px-2.5 py-1 shadow-xs transition-all"
                title="Your billing draft is autosaved and preserved across tab switches and offline sessions."
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autosaved {formatRelativeSavedTime(lastSavedAt)}</span>
              </span>
            )}

            <button
              type="button"
              onClick={newDocument}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200/60"
              title="Start a new document"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
              title="Download Word (.docx) document"
            >
              <FileDown className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={openBrowserPreview}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-slate-200/70 bg-white/70"
              title="Preview this document in the browser"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
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
                      ? "bg-white text-amber-600 shadow-xs"
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

      {/* Offline banner notification */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-amber-300/80 bg-amber-50/90 text-amber-900 text-xs shadow-xs">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Offline mode </span>
          </div>
        </div>
      )}

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

              {/* Issue Date with Auto-sync with current day date */}
              <Field
                label="Issue date"
                action={
                  doc.customDates?.issueDate ? (
                    <button
                      type="button"
                      onClick={() =>
                        patchActive((d) => ({
                          ...d,
                          issueDate: localIsoDate(),
                          customDates: { ...d.customDates, issueDate: false },
                        }))
                      }
                      className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                      title="Sync back to current day date"
                    >
                      Today
                    </button>
                  ) : null
                }
              >
                <Input
                  type="date"
                  value={doc.issueDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isToday = val === localIsoDate();
                    patchActive((d) => ({
                      ...d,
                      issueDate: val,
                      customDates: { ...d.customDates, issueDate: !isToday },
                    }));
                  }}
                  className={inputCls}
                />
              </Field>

              {/* Due Date (invoice) / Paid Date (receipt) with Auto-sync with current day date */}
              <Field
                label={kind === "invoice" ? "Due date" : "Paid date"}
                action={
                  kind === "invoice" ? (
                    doc.customDates?.dueDate ? (
                      <button
                        type="button"
                        onClick={() =>
                          patchActive((d) => ({
                            ...d,
                            dueDate: defaultDueDate(new Date(), 14),
                            customDates: { ...d.customDates, dueDate: false },
                          }))
                        }
                        className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                        title="Reset to default due date (+14 days)"
                      >
                        Reset (+14d)
                      </button>
                    ) : null
                  ) : doc.customDates?.paidDate ? (
                    <button
                      type="button"
                      onClick={() =>
                        patchActive((d) => ({
                          ...d,
                          paidDate: localIsoDate(),
                          customDates: { ...d.customDates, paidDate: false },
                        }))
                      }
                      className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                      title="Sync back to current day date"
                    >
                      Today
                    </button>
                  ) : null
                }
              >
                <Input
                  type="date"
                  value={kind === "invoice" ? doc.dueDate : doc.paidDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (kind === "invoice") {
                      const isDefaultDue = val === defaultDueDate(new Date(), 14);
                      patchActive((d) => ({
                        ...d,
                        dueDate: val,
                        customDates: { ...d.customDates, dueDate: !isDefaultDue },
                      }));
                    } else {
                      const isToday = val === localIsoDate();
                      patchActive((d) => ({
                        ...d,
                        paidDate: val,
                        customDates: { ...d.customDates, paidDate: !isToday },
                      }));
                    }
                  }}
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
            title="Items"
            subtitle={undefined}
          >
            <div className="space-y-2.5">
              {kind === "invoice" ? (
                <div className="space-y-2">
                  {doc.items.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5 grid grid-cols-2 sm:grid-cols-[1fr,80px,110px,110px,auto] gap-2 items-end"
                    >
                      <div className="col-span-2 sm:col-auto">
                        <Field label="Item">
                          <Input
                            value={it.description}
                            onChange={(e) => updateItem(it.id, { description: e.target.value })}
                            placeholder="e.g. Cheese tent (20×20 ft)"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <Field label="Qty">
                        <Input
                          type="number"
                          min={0}
                          value={Number.isFinite(it.qty) ? it.qty : 0}
                          onChange={(e) => updateItem(it.id, { qty: Math.max(0, Number(e.target.value)) })}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Unit price">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={Number.isFinite(it.unitPrice) ? it.unitPrice : 0}
                          onChange={(e) => updateItem(it.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                          className={inputCls}
                        />
                      </Field>
                      <div className="flex flex-col items-start justify-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 hidden sm:block">Amount</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums whitespace-nowrap">
                          {money(it.qty * it.unitPrice, doc.currency)}
                        </span>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {doc.items.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5 flex items-end gap-2"
                    >
                      <div className="flex-1">
                        <Field label="Item">
                          <Input
                            value={it.description}
                            onChange={(e) => updateItem(it.id, { description: e.target.value })}
                            placeholder="e.g. Cheese tent (20×20 ft)"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(it.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full rounded-xl border-dashed border-slate-300/80 text-slate-500 hover:text-amber-600 hover:border-amber-400/70 hover:bg-amber-50/50 text-xs font-semibold h-9"
              >
                <Plus className="w-4 h-4" />
                Add another {kind === "invoice" ? "service" : "item"}
              </Button>
            </div>
          </Section>

          {/* Totals & adjustments */}
          <Section icon={<Banknote className="w-4 h-4" />} title="Calculations" subtitle="Automated discounts, tax, and payment totals">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${kind === "invoice" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-3`}>
              {kind === "invoice" && (
                <Field label="Discount %">
                  <Input
                    type="number" min={0} max={100} step="0.5"
                    value={doc.discountRate}
                    onChange={(e) => patchActive({ discountRate: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    className={inputCls}
                  />
                </Field>
              )}
              {kind === "invoice" && (
                <Field label="Tax %">
                  <Input
                    type="number" min={0} max={100} step="0.5"
                    value={doc.taxRate}
                    onChange={(e) => patchActive({ taxRate: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    className={inputCls}
                  />
                </Field>
              )}
              {kind === "invoice" && (
                <Field label="T & T amount" hint="Taxes & tariffs added to the bill">
                  <Input
                    type="number" min={0} step="0.01"
                    value={doc.tt}
                    onChange={(e) => patchActive({ tt: Math.max(0, Number(e.target.value)) })}
                    className={inputCls}
                  />
                </Field>
              )}
              {kind === "receipt" && (
                <Field label="Deposit paid" hint="Amount deposited for this receipt">
                  <Input
                    type="number" min={0} step="0.01"
                    value={doc.deposit}
                    onChange={(e) => patchActive({ deposit: Math.max(0, Number(e.target.value)) })}
                    className={inputCls}
                  />
                </Field>
              )}
            </div>

            {/* Live totals strip */}
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-linear-to-r from-slate-50 to-white p-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <TotalChip label="Subtotal" value={money(totals.subtotal, doc.currency)} />
              {kind === "invoice" && doc.discountRate > 0 && <TotalChip label={`Discount (-${doc.discountRate}%)`} value={`− ${money(totals.discountAmount, doc.currency)}`} muted />}
              {kind === "invoice" && doc.taxRate > 0 && <TotalChip label={`Tax (+${doc.taxRate}%)`} value={money(totals.taxAmount, doc.currency)} muted />}
              {kind === "invoice" && doc.tt > 0 && <TotalChip label="T & T" value={money(totals.tt, doc.currency)} muted />}
              {kind === "receipt" && doc.deposit > 0 && <TotalChip label="Deposit paid" value={money(doc.deposit, doc.currency)} muted />}
              {kind === "receipt" && doc.deposit > 0 && totals.total > doc.deposit && (
                <TotalChip label="Balance due" value={money(totals.balanceDue, doc.currency)} muted />
              )}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {kind === "invoice" ? "Total amount" : doc.deposit > 0 ? "Deposit paid" : "Total amount"}
                </span>
                <span className="text-lg font-extrabold text-amber-600 tabular-nums">
                  {money(kind === "invoice" ? totals.total : (doc.deposit > 0 ? doc.deposit : totals.total), doc.currency)}
                </span>
              </div>
            </div>
          </Section>

          {/* Payment / terms */}
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
              {kind === "invoice" && (
                <Field label="Notes">
                  <textarea
                    value={doc.notes}
                    onChange={(e) => patchActive({ notes: e.target.value })}
                    rows={3}
                    className={`${inputCls} w-full h-auto py-2 resize-none`}
                  />
                </Field>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Ts & Cs" className="sm:col-span-2">
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
                Preview
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200/60 font-semibold">
              {doc.docNumber}
            </Badge>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-[2px] bg-linear-to-r from-amber-500/70 via-amber-400/50 to-transparent" />
            <PreviewDocument doc={doc} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={printBrowserPreview}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
              title="Print or save as PDF from the browser"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => downloadBillingHtml(doc)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200/60 bg-white/60 transition-colors"
              title="Download a self-contained HTML document"
            >
              <FileDown className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${kind} browser preview`}>
          <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{kind === "invoice" ? "Invoice" : "Receipt"} preview</h3>

              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={printBrowserPreview} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button type="button" onClick={closeBrowserPreview} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
            <iframe
              ref={previewFrameRef}
              src={previewUrl}
              title={`${kind} document preview`}
              className="min-h-0 flex-1 border-0 bg-slate-200"
            />
          </div>
        </div>
      )}
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
const RECEIPT_PAPER = "#FFF7DB";

function PreviewDocument({ doc }: { doc: BillingDoc }) {
  const totals = useMemo(() => computeTotals(doc), [doc]);
  const isInvoice = doc.kind === "invoice";
  const company = doc.companyName || "Sista Events & Rentals";
  const date = (d: string) => d.replace(/-/g, " / ");
  const grandTotal = totals.total;

  return (
    <div
      className={`text-slate-800 p-4 sm:p-7 text-[11px] leading-relaxed max-h-[640px] overflow-y-auto ${
        isInvoice ? "bg-white" : ""
      }`}
      style={isInvoice ? undefined : { backgroundColor: RECEIPT_PAPER }}
    >
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

      <div className="h-px bg-linear-to-r from-amber-500 to-amber-500/20 my-4" />

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

          {/* Totals & payment details */}
          <div className="flex justify-between items-start gap-4 mt-3">
            <div className="text-[10px] space-y-2 max-w-[50%]">
              {doc.paymentMethod && (
                <div>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Payment details</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{doc.paymentMethod}</p>
                </div>
              )}
              {doc.notes && (
                <div>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Notes</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{doc.notes}</p>
                </div>
              )}
            </div>
            <div>
              <div className="w-56 space-y-1 text-[10px]">
                <TotalLine label="Subtotal" value={money(totals.subtotal, doc.currency)} />
                <TotalLine label="T & T" value={money(totals.taxAmount - totals.discountAmount + totals.tt, doc.currency)} />
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
          {/* Receipt — event description in bold italic font */}
          <div className="mt-4 px-1 space-y-1.5">
            {doc.items.map((it) => (
              <div
                key={it.id}
                className="text-[12px] font-bold italic text-slate-800 leading-relaxed tracking-tight"
              >
                {it.description || "Item"}
              </div>
            ))}
          </div>

          {/* Receipt — bill total / deposit paid, centered */}
          <div className="text-center mt-5">
            <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">
              {doc.deposit > 0 ? "Deposit Paid" : "Total"}
            </p>
            <p className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1">
              {money(doc.deposit > 0 ? doc.deposit : totals.total, doc.currency)}
            </p>
            {doc.deposit > 0 && totals.total > doc.deposit && (
              <p className="text-[10px] text-slate-500 mt-1">
                Total bill: {money(totals.total, doc.currency)} · Balance due: {money(totals.balanceDue, doc.currency)}
              </p>
            )}
          </div>
          {/* Receipt — payment info if present */}
          {(doc.paymentMethod || doc.notes) && (
            <div className="mt-3 pt-2 text-[10px] space-y-1 text-center">
              {doc.paymentMethod && (
                <p className="text-slate-600"><span className="font-semibold text-slate-500">Payment: </span>{doc.paymentMethod}</p>
              )}
              {doc.notes && (
                <p className="text-slate-600"><span className="font-semibold text-slate-500">Note: </span>{doc.notes}</p>
              )}
            </div>
          )}
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
            " No refunds for cancellations within 7 days to your event."}
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
