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

const thin = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noneBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const cleanBorders = { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder };

const p = (children: (TextRun | string)[], opts: Partial<IParagraphOptions> = {}): Paragraph =>
  new Paragraph({
    children: children.map((c) => (typeof c === "string" ? new TextRun({ text: c }) : c)),
    spacing: { line: 276, after: 60, ...(opts.spacing ?? {}) },
    alignment: opts.alignment,
    border: opts.border,
  });

const run = (text: string, opts: { bold?: boolean; color?: string; size?: number; allCaps?: boolean } = {}): TextRun =>
  new TextRun({
    text,
    bold: opts.bold,
    color: opts.color ?? DARK,
    size: opts.size ?? 20,
    allCaps: opts.allCaps,
    font: "Calibri",
  });

const fill = (hex: string) => ({ type: ShadingType.CLEAR, fill: hex });

// ─── Section builders ──────────────────────────────────────

// Header: "INVOICE" inscription on the LEFT, logo + company name on the RIGHT.
function buildHeader(doc: BillingDoc, logoSvg?: string, logoPng?: Uint8Array): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";
  const title = doc.kind === "invoice" ? "INVOICE" : "RECEIPT";

  const lhs = [p([run(title, { bold: true, size: 44, color: DARK })], { spacing: { after: 30 } })];

  const rhsChildren: (Paragraph | Table)[] = logoPng
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            logoSvg
              ? new ImageRun({
                  type: "svg",
                  data: new TextEncoder().encode(logoSvg),
                  transformation: { width: 220, height: 220 },
                  fallback: { type: "png", data: logoPng },
                })
              : new ImageRun({
                  type: "png",
                  data: logoPng,
                  transformation: { width: 220, height: 220 },
                }),
          ],
        }),
      ]
    : (() => {
        const monogram = (doc.companyName || "Sista Events & Rentals").trim().charAt(0).toUpperCase() || "S";
        return [
          new Table({
            alignment: AlignmentType.CENTER,
            width: { size: 1000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [p([run(monogram, { bold: true, color: "FFFFFF", size: 36 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })],
                    width: { size: 1000, type: WidthType.DXA },
                    shading: fill(ACCENT),
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  }),
                ],
              }),
            ],
          }),
        ];
      })();

  const rhs = [
    ...rhsChildren,
    p([run(doc.companyName || "SISTA EVENTS & RENTALS", { bold: true, size: 24, color: DARK })], {
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 20 },
    }),
  ];

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: lhs,
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cleanBorders,
              verticalAlign: VerticalAlign.TOP,
            }),
            new TableCell({
              children: rhs,
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cleanBorders,
              verticalAlign: VerticalAlign.TOP,
            }),
          ],
        }),
      ],
    }),
    p([], {
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 3 } },
    }),
  ];
}

// Client details on the LEFT, invoice details on the RIGHT.
function buildClientDetails(doc: BillingDoc): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";

  const client: Paragraph[] = [
    p([run("BILLED TO", { bold: true, allCaps: true, color: ACCENT, size: 15 })], { spacing: { after: 40 } }),
    p([run(doc.clientName || "Client Name", { bold: true, size: 22 })], { spacing: { after: 20 } }),
  ];
  if (doc.clientAddress) {
    client.push(p([run(doc.clientAddress, { color: MUTED, size: 18 })], { spacing: { after: 20 } }));
  }
  client.push(
    p([run([doc.clientEmail, doc.clientPhone].filter(Boolean).join("   •   "), { color: MUTED, size: 18 })], {
      spacing: { after: 0 },
    })
  );

  const metaLine = (label: string, value: string) =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [run(label, { color: MUTED, size: 18 }), run(value, { bold: true, size: 18 })],
      spacing: { after: 90 },
    });

  const details = [
    p([run(isInvoice ? "INVOICE DETAILS" : "RECEIPT DETAILS", { bold: true, allCaps: true, color: ACCENT, size: 15 })], {
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
    }),
    metaLine("NO.   ", doc.docNumber || "—"),
    metaLine("ISSUE DATE   ", doc.issueDate || "—"),
    metaLine(isInvoice ? "DUE DATE   " : "PAID DATE   ", (isInvoice ? doc.dueDate : doc.paidDate) || "—"),
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
    p([], { spacing: { after: 160 } }),
  ];
}

// Itemised table: DESCRIPTION | RATE | QTY | AMOUNT, then Subtotal / T&T / Total.
function buildItemsTable(doc: BillingDoc, media?: BillingMedia): (Table | Paragraph)[] {
  const isInvoice = doc.kind === "invoice";
  const totals = computeTotals(doc);

  // Signature stamp — right-aligned, directly under the total.
  const stampParagraph = (): Paragraph | null => {
    if (!media?.stampSvg && !media?.stamp) return null;
    const children = media.stampSvg
      ? [
          new ImageRun({
            type: "svg",
            data: new TextEncoder().encode(media.stampSvg),
            transformation: { width: 90, height: 90 },
            fallback: media.stamp ? { type: "png", data: media.stamp } : undefined,
          }),
        ]
      : [new ImageRun({ type: "png", data: media.stamp!, transformation: { width: 90, height: 90 } })];
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 120, after: 0 },
      children,
    });
  };

  // Receipts: show only the event description(s) in a bordered box, then a centered bill total below.
  // Tight line spacing + cell padding keeps more items on a single standard sheet.
  if (!isInvoice) {
    const descriptionParagraphs = doc.items.map((it: LineItem, i: number) => {
      const isLast = i === doc.items.length - 1;
      return p([run(it.description || "Item", { size: 20, bold: !!it.description, color: DARK })], {
        alignment: AlignmentType.LEFT,
        spacing: { line: 240, after: isLast ? 0 : 30 },
        border: isLast ? undefined : { bottom: { style: BorderStyle.DOTTED, size: 4, color: "D0D0D0", space: 8 } },
      });
    });
    const descriptionsBox = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: descriptionParagraphs,
              borders: cellBorders,
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
            }),
          ],
        }),
      ],
    });
    const stamp = stampParagraph();
    return [
      descriptionsBox,
      p([run("TOTAL", { bold: true, allCaps: true, color: DARK, size: 16 })], {
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 20 },
      }),
      p([run(money(totals.total, doc.currency), { bold: true, color: ACCENT, size: 36 })], {
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }),
      ...(stamp ? [stamp] : []),
    ];
  }

  const columnWidths = [52, 16, 12, 20];
  const widthOf = (i: number) => ({ size: columnWidths[i], type: WidthType.PERCENTAGE });

  const headerCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType]) =>
    new TableCell({
      children: [p([run(text, { bold: true, color: "FFFFFF", size: 17 })], { alignment: align, spacing: { after: 0 } })],
      shading: fill(HEADER_FILL),
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
    });

  const head = new TableRow({
    tableHeader: true,
    children: [
      headerCell("DESCRIPTION", AlignmentType.LEFT),
      headerCell("RATE", AlignmentType.RIGHT),
      headerCell("QTY", AlignmentType.CENTER),
      headerCell("AMOUNT", AlignmentType.RIGHT),
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
          children: [p([run(it.description || "Item", { size: 19, bold: !!it.description })], { spacing: { after: 0 } })],
        }),
        new TableCell({
          ...common,
          children: [p([run(money(it.unitPrice || 0, doc.currency), { size: 18 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } })],
        }),
        new TableCell({
          ...common,
          children: [p([run(String(it.qty || 0), { size: 18 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })],
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
        }),
        new TableCell({
          ...common,
          children: [p([run(money((it.qty || 0) * (it.unitPrice || 0), doc.currency), { bold: true, size: 18 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } })],
        }),
      ],
    });
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [head, ...body],
  });

  // Totals — Subtotal, T & T, Total (with optional deposit row for invoices).
  const totalRow = (label: string, value: string, opts: { fill?: string; accent?: boolean } = {}) => {
    const blank = () =>
      new TableCell({
        children: [p([""], { spacing: { after: 0 } })],
        width: widthOf(0),
        borders: cleanBorders,
        margins: { top: 40, bottom: 40 },
      });
    const labelCell = new TableCell({
      children: [p([run(label, { bold: !opts.accent, color: opts.accent ? DARK : MUTED, size: 17 })], {
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
      })],
      width: widthOf(2),
      borders: cleanBorders,
      shading: opts.fill ? fill(opts.fill) : undefined,
      margins: { top: 70, bottom: 70, left: 140, right: 140 },
      verticalAlign: VerticalAlign.CENTER,
    });
    const valueCell = new TableCell({
      children: [p([run(value, { bold: true, color: opts.accent ? ACCENT : DARK, size: opts.accent ? 21 : 18 })], {
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
      })],
      width: widthOf(3),
      borders: opts.accent
        ? { top: thin, bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 0 }, left: cleanBorders.left, right: cleanBorders.right }
        : cleanBorders,
      shading: opts.fill ? fill(opts.fill) : undefined,
      margins: { top: 70, bottom: 70, left: 140, right: 140 },
      verticalAlign: VerticalAlign.CENTER,
    });
    return new TableRow({
      children: [
        blank(),
        new TableCell({
          children: [],
          width: widthOf(1),
          borders: cleanBorders,
        }),
        labelCell,
        valueCell,
      ],
    });
  };

  const totalsRows: TableRow[] = [totalRow("SUBTOTAL", money(totals.subtotal, doc.currency))];
  totalsRows.push(totalRow("T & T", money(totals.taxAmount - totals.discountAmount + totals.tt, doc.currency)));
  if (doc.deposit > 0) {
    totalsRows.push(totalRow("LESS DEPOSIT", `− ${money(doc.deposit, doc.currency)}`));
    totalsRows.push(totalRow("TOTAL", money(totals.balanceDue, doc.currency), { fill: TOTAL_FILL, accent: true }));
  } else {
    totalsRows.push(totalRow("TOTAL", money(totals.total, doc.currency), { fill: TOTAL_FILL, accent: true }));
  }

  const totalsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: totalsRows,
  });

  const stamp = stampParagraph();
  return [itemsTable, p([], { spacing: { after: 40 } }), totalsTable, ...(stamp ? [stamp] : [])];
}

// ─── Public API ────────────────────────────────────────────

export interface BillingMedia {
  logoSvg?: string;
  logo?: Uint8Array;
  stampSvg?: string;
  stamp?: Uint8Array;
  phone?: Uint8Array;
  location?: Uint8Array;
}

export function buildBillingDocx(doc: BillingDoc, media?: BillingMedia): Document {
  const isInvoice = doc.kind === "invoice";
  const terms =
    doc.terms ||
    "Payment confirms your booking. No refunds for cancellations within 7 days of the event.";

  return new Document({
    creator: "Sista Events & Rentals",
    title: `${isInvoice ? "Invoice" : "Receipt"} ${doc.docNumber || ""}`.trim(),
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
            margin: { top: 1100, bottom: 1700, left: 1247, right: 1247 },
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
                spacing: { before: 160 },
                children: [run("TS & CS", { bold: true, allCaps: true, color: ACCENT, size: 14 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 40 },
                children: [run(terms, { color: MUTED, size: 14 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 0 },
                children: [
                  run(` ${doc.companyWebsite || "sistaevents.site"}`, { color: MUTED, size: 12 }),
                  run("   •   ", { color: MUTED, size: 12 }),
                  ...(media?.phone
                    ? [new ImageRun({ type: "png", data: media.phone, transformation: { width: 16, height: 16 } })]
                    : []),
                  run(` ${doc.companyPhone || "0555182969"}`, { color: MUTED, size: 12 }),
                  run("   •   ", { color: MUTED, size: 12 }),
                  ...(media?.location
                    ? [new ImageRun({ type: "png", data: media.location, transformation: { width: 16, height: 16 } })]
                    : []),
                  run(` ${doc.companyAddress || "Kasoa, Accra"}`, { color: MUTED, size: 12 }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...buildHeader(doc, media?.logoSvg, media?.logo),
          ...buildClientDetails(doc),
          ...buildItemsTable(doc, media),
          p([], { spacing: { after: 200 } }),
        ],
      },
    ],
  });
}

export async function downloadBillingDocx(doc: BillingDoc): Promise<void> {
  const { loadLogoSvg, loadLogoPng, loadStampSvg, loadStampPng, loadSocialPngs } = await import("./logoRaster");
  const [logo, stamp, socials] = await Promise.all([loadLogoPng(), loadStampPng(), loadSocialPngs()]);
  const file = buildBillingDocx(doc, {
    logoSvg: loadLogoSvg(),
    logo,
    stampSvg: loadStampSvg(),
    stamp,
    phone: socials.phone,
    location: socials.location,
  });
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
  URL.revokeObjectURL(url);
}