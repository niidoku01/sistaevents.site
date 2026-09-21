export type DocKind = "invoice" | "receipt";

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface BillingDoc {
  kind: DocKind;
  currency: string;
  docNumber: string;
  issueDate: string;
  dueDate: string;
  paidDate: string;
  companyName: string;
  companyTagline: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: LineItem[];
  discountRate: number;
  taxRate: number;
  tt: number;
  deposit: number;
  notes: string;
  terms: string;
  paymentMethod: string;
}

export interface Totals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tt: number;
  total: number;
  deposit: number;
  balanceDue: number;
}

export function computeTotals(doc: BillingDoc): Totals {
  const subtotal = doc.items.reduce((sum, it) => sum + (it.unitPrice || 0) * (it.qty || 0), 0);
  const discountAmount = (subtotal * (doc.discountRate || 0)) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * (doc.taxRate || 0)) / 100;
  const tt = Math.max(0, doc.tt || 0);
  const total = taxable + taxAmount + tt;
  const deposit = Math.min(Math.max(0, doc.deposit || 0), total);
  return { subtotal, discountAmount, taxAmount, tt, total, deposit, balanceDue: total - deposit };
}

export function emptyItem(): LineItem {
  return { id: crypto.randomUUID().slice(0, 8), description: "", qty: 1, unitPrice: 0 };
}

export function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${currency} ${(value || 0).toFixed(2)}`;
  }
}

export const CURRENCIES = [
  { code: "GHS", label: "GHS — Ghana Cedi" },
  { code: "USD", label: "USD — US Dollar" },
];

export const STORAGE_KEY = "sista-events.billing.v1";