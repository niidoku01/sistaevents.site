import type { BillingDoc } from "./types";
import { computeTotals, money } from "./types";
import logoRaw from "@/assets/sistalogo.svg?raw";
import stampRaw from "@/assets/sistastamp.svg?raw";

const RECEIPT_PAPER = "#FFF7DB";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function text(value: string | undefined, fallback = ""): string {
  return escapeHtml(value?.trim() || fallback);
}

function date(value: string): string {
  return text(value.replace(/-/g, " / "), "-");
}

function dataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function itemRows(doc: BillingDoc): string {
  return doc.items
    .map(
      (item, index) => `
        <tr>
          <td>${text(item.description, "Item")}</td>
          <td class="number">${money(item.unitPrice || 0, doc.currency)}</td>
          <td class="number center">${item.qty || 0}</td>
          <td class="number">${money((item.qty || 0) * (item.unitPrice || 0), doc.currency)}</td>
        </tr>`
    )
    .join("");
}

export function buildBillingHtml(doc: BillingDoc): string {
  const totals = computeTotals(doc);
  const isInvoice = doc.kind === "invoice";
  const totalLabel = doc.deposit > 0 ? "Deposit paid" : "Total";
  const totalValue = doc.deposit > 0 ? doc.deposit : totals.total;
  const logo = dataUrl(logoRaw);
  const stamp = dataUrl(stampRaw);
  const terms = doc.terms || "No refunds for cancellations within 7 days of the event.";

  const invoiceBody = `
    <table class="items">
      <thead><tr><th>Description</th><th class="number">Rate</th><th class="center">Qty</th><th class="number">Amount</th></tr></thead>
      <tbody>${itemRows(doc)}</tbody>
    </table>
    <div class="summary-grid">
      <div class="notes">
        ${doc.paymentMethod ? `<h3>Payment details</h3><p>${text(doc.paymentMethod)}</p>` : ""}
        ${doc.notes ? `<h3>Notes</h3><p>${text(doc.notes)}</p>` : ""}
      </div>
      <div class="totals">
        <div><span>Subtotal</span><strong>${money(totals.subtotal, doc.currency)}</strong></div>
        <div><span>T &amp; T</span><strong>${money(totals.taxAmount - totals.discountAmount + totals.tt, doc.currency)}</strong></div>
        <div class="grand-total"><span>Total</span><strong>${money(totals.total, doc.currency)}</strong></div>
        <img class="stamp" src="${stamp}" alt="Payment stamp" />
      </div>
    </div>`;

  const receiptBody = `
    <div class="receipt-items">${doc.items.map((item) => `<p>${text(item.description, "Item")}</p>`).join("")}</div>
    <div class="receipt-total"><h3>${totalLabel}</h3><strong>${money(totalValue, doc.currency)}</strong>
      ${doc.deposit > 0 && totals.total > doc.deposit ? `<p>Total bill: ${money(totals.total, doc.currency)} | Balance due: ${money(totals.balanceDue, doc.currency)}</p>` : ""}
    </div>
    ${doc.paymentMethod ? `<p class="center muted"><b>Payment:</b> ${text(doc.paymentMethod)}</p>` : ""}
    ${doc.notes ? `<p class="center muted"><b>Note:</b> ${text(doc.notes)}</p>` : ""}
    <img class="stamp receipt-stamp" src="${stamp}" alt="Payment stamp" />`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${text(isInvoice ? "Invoice" : "Receipt")} ${text(doc.docNumber, "draft")}</title>
<style>
  :root { color-scheme: light; }
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e2e8f0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
  body { min-width: 0; }
  .paper { width: min(794px, 100%); min-height: 1123px; margin: 24px auto; padding: 56px 58px 66px; background: ${isInvoice ? "#ffffff" : RECEIPT_PAPER}; position: relative; overflow: hidden; }
  .paper, .paper * { max-width: 100%; }
  .header, .details, .summary-grid { display: table; width: 100%; table-layout: fixed; }
  .header > *, .details > *, .summary-grid > * { display: table-cell; vertical-align: top; }
  .header { border-bottom: 2px solid #ffea06cc; padding-bottom: 14px; }
  .header h1 { margin: 0; font-size: 31px; letter-spacing: 1px; }
  .brand { text-align: right; }
  .logo { display: block; width: 76px; height: 76px; object-fit: contain; margin: 0 0 5px auto; }
  .company { margin: 0; font-size: 14px; }
  .details { margin-top: 25px; }
  .details > :first-child { width: 58%; padding-right: 20px; }
  .details > :last-child { width: 42%; text-align: right; }
  h2, h3, p { margin-top: 0; }
  .eyebrow, h3 { color: #efe711b7; text-transform: uppercase; letter-spacing: 1px; font-size: 9px; font-weight: 700; }
  .client { font-weight: 700; font-size: 13px; margin: 5px 0; }
  .muted { color: #000000d0; }
  .meta p { margin: 0 0 4px; white-space: nowrap; }
  .items { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 28px; page-break-inside: avoid; }
  .items th, .items td { padding: 9px 10px; border: 1px solid #e2e8f0; overflow-wrap: anywhere; }
  .items th { background: #040404be; color: #fff; text-align: left; font-size: 10px; }
  .items th:nth-child(1), .items td:nth-child(1) { width: 50%; }
  .items th:nth-child(2), .items td:nth-child(2) { width: 18%; }
  .items th:nth-child(3), .items td:nth-child(3) { width: 12%; }
  .items th:nth-child(4), .items td:nth-child(4) { width: 20%; }
  .items tbody tr:nth-child(even) { background: #f8fafc; }
  .number { text-align: right; white-space: nowrap; }
  .center { text-align: center; }
  .summary-grid { margin-top: 20px; page-break-inside: avoid; }
  .notes { width: 55%; padding-right: 24px; }
  .totals { width: 45%; text-align: right; }
  .totals > div { display: flex; justify-content: space-between; gap: 18px; padding: 4px 8px; }
  .grand-total { margin-top: 5px; background: #fff7ed; border: 1px solid #e2e8f0; border-bottom: 2px solid #d97706; font-size: 14px; }
  .stamp { display: block; width: 68px; height: 68px; object-fit: contain; margin: 10px 0 0 auto; }
  .receipt-items { margin-top: 30px; }
  .receipt-items p { margin: 0 0 8px; font-size: 15px; font-style: italic; font-weight: 700; overflow-wrap: anywhere; }
  .receipt-total { text-align: center; margin: 42px 0 18px; }
  .receipt-total h3 { color: #070708e4; margin-bottom: 7px; }
  .receipt-total strong { color: #f9e611e0; font-size: 30px; }
  .receipt-total p { color: #000000d6; margin: 8px 0 0; }
  .receipt-stamp { margin-top: 18px; }
  .footer { position: absolute; left: 58px; right: 58px; bottom: 25px; border-top: 2px solid #d97706; padding-top: 8px; text-align: center; }
  .footer p { margin: 3px 0; color: #64748b; font-size: 9px; overflow-wrap: anywhere; }
  .footer .eyebrow { color: #eeee06e8; }
  @media screen { .paper { box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75); } }
  @media screen and (max-width: 600px) {
    .paper { min-height: 0; margin: 0 auto; padding: 28px 20px 34px; }
    .header h1 { font-size: 24px; }
    .logo { width: 58px; height: 58px; }
    .company { font-size: 12px; }
    .details { margin-top: 20px; }
    .details > :first-child { width: 55%; padding-right: 12px; }
    .details > :last-child { width: 45%; }
    .items { margin-top: 22px; font-size: 10px; }
    .items th, .items td { padding: 7px 5px; }
    .summary-grid { display: block; }
    .notes, .totals { display: block; width: 100%; padding-right: 0; }
    .totals { margin-top: 16px; }
    .footer { position: static; margin-top: 32px; }
  }
  @media print {
    html, body { width: 210mm; min-width: 0; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .paper { width: 210mm; min-height: 297mm; margin: 0; padding: 15mm 15.5mm 18mm; box-shadow: none; page-break-after: always; }
    .footer { left: 15.5mm; right: 15.5mm; bottom: 7mm; }
    .items tr, .items img, .summary-grid { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <main class="paper">
    <header class="header"><div><h1>${isInvoice ? "INVOICE" : "RECEIPT"}</h1></div><div class="brand"><img class="logo" src="${logo}" alt="${text(doc.companyName, "Company")} logo" /><p class="company">${text(doc.companyName, "Sista Events & Rentals")}</p></div></header>
    <section class="details"><div><div class="eyebrow">Billed to</div><p class="client">${text(doc.clientName, "Client Name")}</p>${doc.clientAddress ? `<p class="muted">${text(doc.clientAddress)}</p>` : ""}${doc.clientEmail || doc.clientPhone ? `<p class="muted">${text([doc.clientEmail, doc.clientPhone].filter(Boolean).join(" / "))}</p>` : ""}</div><div class="meta"><div class="eyebrow">${isInvoice ? "Invoice" : "Receipt"} details</div><p><span class="muted">NO. </span><b>${text(doc.docNumber, "-")}</b></p><p><span class="muted">Issue </span>${date(doc.issueDate)}</p><p><span class="muted">${isInvoice ? "Due" : "Paid"} </span>${date(isInvoice ? doc.dueDate : doc.paidDate)}</p></div></section>
    ${isInvoice ? invoiceBody : receiptBody}
    <footer class="footer"><p class="eyebrow">Ts &amp; Cs</p><p>${text(terms)}</p><p>${text(doc.companyWebsite, "sistaevents.site")} | ${text(doc.companyPhone, "0555 182 969")} | ${text(doc.companyAddress, "Amanfro, Kasoa, Ghana")}</p></footer>
  </main>
</body>
</html>`;
}

export function downloadBillingHtml(doc: BillingDoc): void {
  const blob = new Blob([buildBillingHtml(doc)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const kind = doc.kind === "invoice" ? "Invoice" : "Receipt";
  const safeNumber = (doc.docNumber || "draft").replace(/[^\w-]+/g, "-");
  link.href = url;
  link.download = `${kind}-${safeNumber}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
