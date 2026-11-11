import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type IParagraphOptions,
} from "docx";
import type { BillingDoc, LineItem } from "./types";
import { computeTotals, money } from "./types";

// ─── Shared style tokens ───────────────────────────────────
const ACCENT = "D97706";
const DARK = "1E293B";
const MUTED = "64748B";
const BORDER = "E2E8F0";
const LIGHT = "F8FAFC";
const HEADER_FILL = "1E293B";
const TOTAL_FILL = "FFF7ED";
const RECEIPT_PAPER = "FFF7DB";

const thin = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const cleanBorders = { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder };

const p = (children: (TextRun | string)[], opts: Partial<IParagraphOptions> = {}): Paragraph =>
  new Paragraph({
    children: children.map((c) => (typeof c === "string" ? new TextRun({ text: c }) : c)),
    spacing: { line: 276, after: 40, ...(opts.spacing ?? {}) },
    alignment: opts.alignment,
    border: opts.border,
  });

const run = (
  text: string,
  opts: { bold?: boolean; italics?: boolean; color?: string; size?: number; allCaps?: boolean } = {}
): TextRun =>
  new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? DARK,
    size: opts.size ?? 20,
    allCaps: opts.allCaps,
    font: "Calibri",
  });

const fill = (hex: string) => ({ type: ShadingType.CLEAR, fill: hex });

// Match the live preview formatting: "2026 / 09 / 30"
const fmtDate = (iso: string): string => (iso || "—").replace(/-/g, " / ");

// ─── Section builders ──────────────────────────────────────

// Header: "INVOICE" / "RECEIPT" on the LEFT, logo + company name on the RIGHT.
function buildHeader(doc: BillingDoc, logoPng?: Uint8Array): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";
  const title = isInvoice ? "INVOICE" : "RECEIPT";

  const lhs = [
    p([run(title, { bold: true, size: 38, color: DARK })], {
      spacing: { before: 20, after: 0 },
    }),
  ];

  const rhsChildren: (Paragraph | Table)[] = logoPng
    ? [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 20 },
          children: [
            new ImageRun({
              type: "png",
              data: logoPng,
              transformation: { width: 75, height: 75 },
            }),
          ],
        }),
      ]
    : (() => {
        const monogram = (doc.companyName || "Sista Events & Rentals").trim().charAt(0).toUpperCase() || "S";
        return [
          new Table({
            alignment: AlignmentType.RIGHT,
            width: { size: 900, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      p([run(monogram, { bold: true, color: "FFFFFF", size: 30 })], {
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                      }),
                    ],
                    width: { size: 900, type: WidthType.DXA },
                    shading: fill(ACCENT),
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  }),
                ],
              }),
            ],
          }),
        ];
      })();

  const rhs = [
    ...rhsChildren,
    p([run(doc.companyName || "Sista Events & Rentals", { bold: true, size: 21, color: DARK })], {
      alignment: AlignmentType.RIGHT,
      spacing: { before: 10, after: 0 },
    }),
  ];

  const headerBottomBorder = {
    top: noneBorder,
    left: noneBorder,
    right: noneBorder,
    bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT },
  };

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: lhs,
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: headerBottomBorder,
              verticalAlign: VerticalAlign.CENTER,
              margins: { bottom: 100 },
            }),
            new TableCell({
              children: rhs,
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: headerBottomBorder,
              verticalAlign: VerticalAlign.TOP,
              margins: { bottom: 100 },
            }),
          ],
        }),
      ],
    }),
    p([], { spacing: { after: 120 } }),
  ];
}

// Client details on the LEFT, invoice details on the RIGHT.
function buildClientDetails(doc: BillingDoc): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";

  const client: Paragraph[] = [
    p([run("BILLED TO", { bold: true, allCaps: true, color: ACCENT, size: 15 })], { spacing: { after: 30 } }),
    p([run(doc.clientName || "Client Name", { bold: true, size: 22 })], { spacing: { after: 15 } }),
  ];
  if (doc.clientAddress) {
    client.push(p([run(doc.clientAddress, { color: MUTED, size: 18 })], { spacing: { after: 15 } }));
  }
  if (doc.clientEmail || doc.clientPhone) {
    client.push(
      p([run([doc.clientEmail, doc.clientPhone].filter(Boolean).join(" / "), { color: MUTED, size: 18 })], {
        spacing: { after: 0 },
      })
    );
  }

  const metaLine = (label: string, value: string) =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        run(label, { color: MUTED, size: 18 }),
        run(value, { bold: true, size: 18 }),
      ],
      spacing: { after: 40 },
    });

  const details = [
    p([run(isInvoice ? "INVOICE DETAILS" : "RECEIPT DETAILS", { bold: true, allCaps: true, color: ACCENT, size: 15 })], {
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
    }),
    metaLine("NO.   ", doc.docNumber || "—"),
    metaLine("Issue   ", fmtDate(doc.issueDate)),
    metaLine(isInvoice ? "Due   " : "Paid   ", fmtDate(isInvoice ? doc.dueDate : doc.paidDate)),
  ];

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: client,
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: cleanBorders,
              verticalAlign: VerticalAlign.TOP,
            }),
            new TableCell({
              children: details,
              width: { size: 45, type: WidthType.PERCENTAGE },
              borders: cleanBorders,
              verticalAlign: VerticalAlign.TOP,
            }),
          ],
        }),
      ],
    }),
    p([], { spacing: { after: 120 } }),
  ];
}

// Itemised table: DESCRIPTION | RATE | QTY | AMOUNT, then Subtotal / T&T / Total.
function buildItemsTable(doc: BillingDoc, media?: BillingMedia): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";
  const totals = computeTotals(doc);

  // Signature stamp — right-aligned, directly under the total.
  const stampParagraph = (): Paragraph | null => {
    if (!media?.stamp) return null;
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 80, after: 0 },
      children: [
        new ImageRun({
          type: "png",
          data: media.stamp,
          transformation: { width: 68, height: 68 },
        }),
      ],
    });
  };

  // Receipts: show all event items formatted in bold italic font, followed by the centered total and right stamp.
  if (!isInvoice) {
    const itemParagraphs = (doc.items.length > 0 ? doc.items : [{ id: "1", description: "Event Services", qty: 1, unitPrice: 0 }]).map(
      (it: LineItem, index: number) =>
        p(
          [
            run(it.description || "Item", {
              size: 22,
              bold: true,
              italics: true,
              color: DARK,
            }),
          ],
          {
            alignment: AlignmentType.LEFT,
            spacing: {
              line: 300,
              before: index === 0 ? 80 : 30,
              after: 30,
            },
          }
        )
    );

    const stamp = stampParagraph();
    const receiptAmount = doc.deposit > 0 ? doc.deposit : totals.total;
    const receiptLabel = doc.deposit > 0 ? "DEPOSIT PAID" : "TOTAL";

    return [
      ...itemParagraphs,
      p([run(receiptLabel, { bold: true, allCaps: true, color: MUTED, size: 16 })], {
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 40 },
      }),
      p([run(money(receiptAmount, doc.currency), { bold: true, color: ACCENT, size: 40 })], {
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
      ...(doc.deposit > 0 && totals.total > doc.deposit
        ? [
            p(
              [
                run(
                  `Total bill: ${money(totals.total, doc.currency)}   •   Balance due: ${money(totals.balanceDue, doc.currency)}`,
                  { color: MUTED, size: 18 }
                ),
              ],
              { alignment: AlignmentType.CENTER, spacing: { after: 60 } }
            ),
          ]
        : []),
      ...(doc.paymentMethod
        ? [
            p(
              [
                run("Payment: ", { bold: true, color: MUTED, size: 16 }),
                run(doc.paymentMethod, { color: DARK, size: 16 }),
              ],
              { alignment: AlignmentType.CENTER, spacing: { before: 20, after: 20 } }
            ),
          ]
        : []),
      ...(doc.notes
        ? [
            p(
              [
                run("Note: ", { bold: true, color: MUTED, size: 16 }),
                run(doc.notes, { color: DARK, size: 16 }),
              ],
              { alignment: AlignmentType.CENTER, spacing: { before: 20, after: 20 } }
            ),
          ]
        : []),
      ...(stamp ? [stamp] : []),
    ];
  }

  // Invoices: 4-column breakdown with guaranteed rigid widths [50%, 18%, 12%, 20%]
  const colWidths = [50, 18, 12, 20];
  const widthOf = (i: number) => ({ size: colWidths[i], type: WidthType.PERCENTAGE });

  const headerCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType], colIdx: number) =>
    new TableCell({
      width: widthOf(colIdx),
      children: [p([run(text, { bold: true, color: "FFFFFF", size: 17 })], { alignment: align, spacing: { after: 0 } })],
      shading: fill(HEADER_FILL),
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
    });

  const head = new TableRow({
    tableHeader: true,
    children: [
      headerCell("DESCRIPTION", AlignmentType.LEFT, 0),
      headerCell("RATE", AlignmentType.RIGHT, 1),
      headerCell("QTY", AlignmentType.CENTER, 2),
      headerCell("AMOUNT", AlignmentType.RIGHT, 3),
    ],
  });

  const body = doc.items.map((it: LineItem, i) => {
    const zebra = i % 2 === 0 ? "FFFFFF" : LIGHT;
    const common = {
      borders: cellBorders,
      verticalAlign: VerticalAlign.CENTER,
      shading: fill(zebra),
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
    };
    return new TableRow({
      children: [
        new TableCell({
          ...common,
          width: widthOf(0),
          children: [p([run(it.description || "Item", { size: 19, bold: !!it.description })], { spacing: { after: 0 } })],
        }),
        new TableCell({
          ...common,
          width: widthOf(1),
          children: [p([run(money(it.unitPrice || 0, doc.currency), { size: 18 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } })],
        }),
        new TableCell({
          ...common,
          width: widthOf(2),
          children: [p([run(String(it.qty || 0), { size: 18 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })],
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
        }),
        new TableCell({
          ...common,
          width: widthOf(3),
          children: [p([run(money((it.qty || 0) * (it.unitPrice || 0), doc.currency), { bold: true, size: 18 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } })],
        }),
      ],
    });
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [head, ...body],
  });

  // Totals & adjustments
  const ttCombined = (totals.taxAmount || 0) - (totals.discountAmount || 0) + (totals.tt || 0);

  const totalsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: cleanBorders,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              p([run("SUBTOTAL", { bold: true, color: MUTED, size: 16 })], {
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: cleanBorders,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              p([run(money(totals.subtotal, doc.currency), { bold: true, color: DARK, size: 18 })], {
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
              }),
            ],
          }),
        ],
      }),
      ...(ttCombined !== 0
        ? [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: cleanBorders,
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    p([run("T & T", { bold: true, color: MUTED, size: 16 })], {
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 0 },
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: cleanBorders,
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    p([run(money(ttCombined, doc.currency), { bold: true, color: DARK, size: 18 })], {
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 0 },
                    }),
                  ],
                }),
              ],
            }),
          ]
        : []),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: {
              top: thin,
              bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 0 },
              left: thin,
              right: noneBorder,
            },
            shading: fill(TOTAL_FILL),
            margins: { top: 80, bottom: 80, left: 100, right: 60 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              p([run("TOTAL", { bold: true, color: DARK, size: 18 })], {
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: {
              top: thin,
              bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 0 },
              left: noneBorder,
              right: thin,
            },
            shading: fill(TOTAL_FILL),
            margins: { top: 80, bottom: 80, left: 60, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              p([run(money(totals.total, doc.currency), { bold: true, color: ACCENT, size: 22 })], {
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const stamp = stampParagraph();

  // Left column: payment info / notes if filled
  const leftInfo: Paragraph[] = [];
  if (doc.paymentMethod) {
    leftInfo.push(
      p([run("PAYMENT DETAILS", { bold: true, allCaps: true, color: ACCENT, size: 15 })], {
        spacing: { before: 40, after: 20 },
      }),
      p([run(doc.paymentMethod, { color: MUTED, size: 17 })], { spacing: { after: 40 } })
    );
  }
  if (doc.notes) {
    leftInfo.push(
      p([run("NOTES", { bold: true, allCaps: true, color: ACCENT, size: 15 })], {
        spacing: { before: 20, after: 20 },
      }),
      p([run(doc.notes, { color: MUTED, size: 17 })], { spacing: { after: 40 } })
    );
  }
  if (leftInfo.length === 0) {
    leftInfo.push(p([""], { spacing: { after: 0 } }));
  }

  const summaryLayout = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: cleanBorders,
            verticalAlign: VerticalAlign.TOP,
            children: leftInfo,
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: cleanBorders,
            verticalAlign: VerticalAlign.TOP,
            children: [
              totalsTable,
              ...(stamp ? [stamp] : []),
            ],
          }),
        ],
      }),
    ],
  });

  return [
    itemsTable,
    p([], { spacing: { after: 80 } }),
    summaryLayout,
  ];
}

// ─── Public API ────────────────────────────────────────────

export interface BillingMedia {
  logo?: Uint8Array;
  stamp?: Uint8Array;
}

export function buildBillingDocx(doc: BillingDoc, media?: BillingMedia): Document {
  const isInvoice = doc.kind === "invoice";
  const terms =
    doc.terms ||
    "Payment confirms your booking. No refunds for cancellations within 7 days of the event; rescheduling is allowed up to 48 hours before the event, subject to availability.";

  return new Document({
    creator: "Sista Events & Rentals",
    title: `${isInvoice ? "Invoice" : "Receipt"} ${doc.docNumber || ""}`.trim(),
    ...(isInvoice ? {} : { background: { color: RECEIPT_PAPER } }),
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 }, paragraph: { spacing: { line: 276 } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1000, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 },
                },
                spacing: { before: 120 },
                children: [run("Ts & Cs", { bold: true, color: ACCENT, size: 15 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 30, after: 30 },
                children: [run(terms, { color: MUTED, size: 17 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 30, after: 0 },
                children: [
                  run(
                    `${doc.companyWebsite || "sistaevents.site"}   •   ${doc.companyPhone || "0555 182 969"}   •   ${doc.companyAddress || "Amanfro, Kasoa, Ghana"}`,
                    { color: MUTED, size: 15 }
                  ),
                ],
              }),
            ],
          }),
        },
        children: [
          ...buildHeader(doc, media?.logo),
          ...buildClientDetails(doc),
          ...buildItemsTable(doc, media),
        ],
      },
    ],
  });
}

export async function downloadBillingDocx(doc: BillingDoc): Promise<void> {
  let logo: Uint8Array | undefined;
  let stamp: Uint8Array | undefined;

  try {
    const { loadLogoPng, loadStampPng } = await import("./logoRaster");
    const results = await Promise.allSettled([loadLogoPng(300), loadStampPng(256)]);
    if (results[0].status === "fulfilled") logo = results[0].value;
    if (results[1].status === "fulfilled") stamp = results[1].value;
  } catch {
    // Proceed with fallback text rendering if image rasterization fails
  }

  const file = buildBillingDocx(doc, { logo, stamp });
  const blob = await Packer.toBlob(file);
  const kind = doc.kind === "invoice" ? "Invoice" : "Receipt";
  const safeNumber = (doc.docNumber || "draft").replace(/[^\w-]+/g, "-");
  const filename = `${kind}-${safeNumber}-${new Date().toISOString().slice(0, 10)}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
