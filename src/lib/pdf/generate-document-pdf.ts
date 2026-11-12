import PDFDocument from "pdfkit";
import { formatMoney } from "@/lib/money";
import { safeDownloadFilename } from "@/lib/utils";

export type PdfDocumentType = "invoice" | "quote";

export type PdfLineItem = {
  description: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type PdfDocumentInput = {
  type: PdfDocumentType;
  number: string;
  issueDate: string;
  dueOrValidDate: string;
  dueOrValidLabel: string;
  template: "classic" | "modern" | "minimal";
  accentColour: string;
  currency: string;
  business: {
    tradingName: string;
    addressLines: string[];
    email?: string | null;
    telephone?: string | null;
    vatNumber?: string | null;
  };
  client: {
    name: string;
    addressLines: string[];
  };
  lineItems: PdfLineItem[];
  subtotalMinor: number;
  taxTotalMinor: number;
  discountTotalMinor: number;
  shippingMinor: number;
  grandTotalMinor: number;
  notes?: string | null;
  terms?: string | null;
  paymentInstructions?: string | null;
  footerNote?: string | null;
  showBranding?: boolean;
};

function formatUkAddress(parts: (string | null | undefined)[]): string[] {
  return parts.filter(Boolean).map((p) => p!.trim()).filter(Boolean);
}

export function buildAddressLines(snapshot: {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country?: string | null;
  contactName?: string;
  businessName?: string | null;
}): string[] {
  const name = snapshot.businessName ?? snapshot.contactName;
  return formatUkAddress([
    name,
    snapshot.line1,
    snapshot.line2,
    snapshot.city,
    snapshot.region,
    snapshot.postcode,
    snapshot.country === "GB" ? "United Kingdom" : snapshot.country,
  ]);
}

export function pdfFilename(type: PdfDocumentType, number: string): string {
  const prefix = type === "invoice" ? "Invoice" : "Quote";
  return safeDownloadFilename(`${prefix}-${number}.pdf`, `${prefix}.pdf`);
}

export async function generateDocumentPdf(
  input: PdfDocumentInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const accent = input.accentColour || "#1D4ED8";
    const title = input.type === "invoice" ? "INVOICE" : "QUOTE";

    if (input.template === "modern") {
      doc.rect(0, 0, doc.page.width, 90).fill(accent);
      doc.fillColor("#ffffff").fontSize(22).text(title, 50, 35);
      doc.fillColor("#ffffff").fontSize(11).text(input.number, 50, 62);
      doc.fillColor("#0f172a");
    } else if (input.template === "minimal") {
      doc.fontSize(20).fillColor("#0f172a").text(title, 50, 50);
      doc.fontSize(10).fillColor("#64748b").text(input.number, 50, 75);
    } else {
      doc.fontSize(24).fillColor(accent).text(title, 50, 50);
      doc.fontSize(11).fillColor("#475569").text(input.number, 50, 80);
    }

    const headerY = input.template === "modern" ? 110 : 110;

    doc.fontSize(10).fillColor("#0f172a");
    doc.text(input.business.tradingName, 50, headerY, { width: 220 });
    input.business.addressLines.forEach((line, i) => {
      doc.fillColor("#475569").text(line, 50, headerY + 14 + i * 12);
    });

    doc.fillColor("#0f172a").text("Bill to", 320, headerY);
    doc.text(input.client.name, 320, headerY + 14);
    input.client.addressLines.forEach((line, i) => {
      doc.fillColor("#475569").text(line, 320, headerY + 28 + i * 12);
    });

    const metaY = headerY + 90;
    doc.fillColor("#475569")
      .text(`Issue date: ${input.issueDate}`, 50, metaY)
      .text(`${input.dueOrValidLabel}: ${input.dueOrValidDate}`, 50, metaY + 14);

    if (input.business.vatNumber) {
      doc.text(`VAT: ${input.business.vatNumber}`, 320, metaY);
    }

    let tableY = metaY + 50;
    const colX = { desc: 50, qty: 300, unit: 350, price: 400, total: 480 };

    doc.rect(50, tableY, 495, 22).fill("#f1f5f9");
    doc.fillColor("#0f172a").fontSize(9);
    doc.text("Description", colX.desc + 5, tableY + 6);
    doc.text("Qty", colX.qty, tableY + 6);
    doc.text("Unit", colX.unit, tableY + 6);
    doc.text("Price", colX.price, tableY + 6);
    doc.text("Total", colX.total, tableY + 6);

    tableY += 28;

    for (const line of input.lineItems) {
      if (tableY > doc.page.height - 150) {
        doc.addPage();
        tableY = 50;
      }

      doc.fillColor("#0f172a").fontSize(9);
      doc.text(line.description, colX.desc + 5, tableY, { width: 230 });
      doc.text(line.quantity, colX.qty, tableY);
      doc.text(line.unit, colX.unit, tableY);
      doc.text(formatMoney(line.unitPriceMinor, input.currency), colX.price, tableY);
      doc.text(formatMoney(line.lineTotalMinor, input.currency), colX.total, tableY);

      tableY += Math.max(20, doc.heightOfString(line.description, { width: 230 }) + 8);
    }

    const totalsY = Math.max(tableY + 20, doc.page.height - 180);
    const rightX = 380;

    doc.fillColor("#475569").fontSize(9);
    doc.text("Subtotal", rightX, totalsY);
    doc.text(formatMoney(input.subtotalMinor, input.currency), 480, totalsY, {
      align: "right",
      width: 65,
    });

    if (input.discountTotalMinor > 0) {
      doc.text("Discount", rightX, totalsY + 14);
      doc.text(
        `-${formatMoney(input.discountTotalMinor, input.currency)}`,
        480,
        totalsY + 14,
        { align: "right", width: 65 },
      );
    }

    doc.text("VAT", rightX, totalsY + 28);
    doc.text(formatMoney(input.taxTotalMinor, input.currency), 480, totalsY + 28, {
      align: "right",
      width: 65,
    });

    if (input.shippingMinor > 0) {
      doc.text("Shipping", rightX, totalsY + 42);
      doc.text(formatMoney(input.shippingMinor, input.currency), 480, totalsY + 42, {
        align: "right",
        width: 65,
      });
    }

    doc.fontSize(11).fillColor(accent);
    doc.text("Total", rightX, totalsY + 60);
    doc.text(formatMoney(input.grandTotalMinor, input.currency), 480, totalsY + 60, {
      align: "right",
      width: 65,
    });

    let footerY = totalsY + 90;
    const addSection = (label: string, text?: string | null) => {
      if (!text) return;
      if (footerY > doc.page.height - 80) {
        doc.addPage();
        footerY = 50;
      }
      doc.fontSize(9).fillColor("#0f172a").text(label, 50, footerY);
      doc.fillColor("#475569").text(text, 50, footerY + 12, { width: 495 });
      footerY += 40;
    };

    addSection("Notes", input.notes);
    addSection("Payment instructions", input.paymentInstructions);
    addSection("Terms", input.terms);
    addSection("Footer", input.footerNote);

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#94a3b8");
      doc.text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 40, {
        align: "center",
        width: doc.page.width - 100,
      });
      if (input.showBranding !== false) {
        doc.text("Generated by InvoiceX", 50, doc.page.height - 28, {
          align: "center",
          width: doc.page.width - 100,
        });
      }
    }

    doc.end();
  });
}
