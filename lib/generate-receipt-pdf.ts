import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BRAND_FOOTER, BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import fs from 'fs';
import path from 'path';

export interface ReceiptLineItem {
  description: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentDate: string;
  freightType: string;
  goodsSummary: string;
  items: ReceiptLineItem[];
  subtotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  quotationDate?: string;
  /** Shipment receipts: show shipment # and charge-focused labels */
  shipmentNumber?: string;
  dateLabel?: string;
  itemsTitle?: string;
}

const MARGIN = 48;
const BRAND = rgb(241 / 255, 93 / 255, 56 / 255);
const BRAND_DARK = rgb(214 / 255, 68 / 255, 32 / 255);
const INK = rgb(0.1, 0.12, 0.18);
const MUTED = rgb(0.42, 0.47, 0.55);
const LINE = rgb(0.88, 0.9, 0.93);
const PANEL = rgb(0.97, 0.98, 0.99);
const WHITE = rgb(1, 1, 1);

function formatMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function drawField(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  x: number,
  y: number,
  label: string,
  value: string,
  maxWidth = 220
) {
  page.drawText(label.toUpperCase(), { x, y, size: 7, font, color: MUTED });
  let display = value;
  while (display.length > 2 && fontBold.widthOfTextAtSize(display, 10) > maxWidth) {
    display = `${display.slice(0, -4)}...`;
  }
  page.drawText(display, { x, y: y - 13, size: 10, font: fontBold, color: INK });
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const contentW = width - MARGIN * 2;

  // ── Header band ──
  const headerH = 108;
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: BRAND });
  page.drawRectangle({ x: 0, y: height - headerH - 4, width, height: 4, color: BRAND_DARK });

  page.drawText(BRAND_NAME, {
    x: MARGIN,
    y: height - 48,
    size: 24,
    font: fontBold,
    color: WHITE,
  });
  page.drawText(BRAND_TAGLINE, {
    x: MARGIN,
    y: height - 72,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  const invLabel = 'RECEIPT NO.';
  page.drawText(invLabel, {
    x: width - MARGIN - 140,
    y: height - 44,
    size: 7,
    font,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.invoiceNumber, {
    x: width - MARGIN - 140,
    y: height - 60,
    size: 14,
    font: fontBold,
    color: WHITE,
  });

  const statusText = data.paymentStatus === 'PAID' ? 'PAID IN FULL' : 'PARTIAL PAYMENT';
  const statusW = fontBold.widthOfTextAtSize(statusText, 8) + 16;
  page.drawRectangle({
    x: width - MARGIN - statusW,
    y: height - 88,
    width: statusW,
    height: 18,
    color: WHITE,
    borderColor: WHITE,
    borderWidth: 0,
  });
  page.drawText(statusText, {
    x: width - MARGIN - statusW + 8,
    y: height - 84,
    size: 8,
    font: fontBold,
    color: BRAND_DARK,
  });

  // ── Info panel (2×3 grid) ──
  let y = height - headerH - 28;
  const panelTop = y - 8;
  const panelH = 118;
  page.drawRectangle({
    x: MARGIN,
    y: panelTop - panelH,
    width: contentW,
    height: panelH,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 1,
  });

  const colL = MARGIN + 20;
  const colR = MARGIN + contentW / 2 + 12;
  const row1 = panelTop - 28;
  const row2 = panelTop - 62;
  const row3 = panelTop - 96;

  drawField(page, font, fontBold, colL, row1, 'Bill To', data.customerName, contentW / 2 - 40);
  drawField(page, font, fontBold, colR, row1, 'Phone', data.customerPhone, contentW / 2 - 40);
  drawField(page, font, fontBold, colL, row2, 'Payment Method', data.paymentMethod.replace(/_/g, ' '), contentW / 2 - 40);
  drawField(page, font, fontBold, colR, row2, 'Payment Date', formatDate(data.paymentDate), contentW / 2 - 40);
  if (data.shipmentNumber) {
    drawField(page, font, fontBold, colL, row3, 'Shipment No.', data.shipmentNumber, contentW / 2 - 40);
  } else {
    drawField(page, font, fontBold, colL, row3, 'Freight Type', `${data.freightType} Cargo`, contentW / 2 - 40);
  }
  drawField(
    page,
    font,
    fontBold,
    colR,
    row3,
    data.dateLabel || 'Quotation Date',
    formatDate(data.quotationDate || data.paymentDate),
    contentW / 2 - 40
  );

  y = panelTop - panelH - 32;

  // ── Line items table ──
  page.drawText(data.itemsTitle || 'Items & Services', { x: MARGIN, y, size: 11, font: fontBold, color: INK });
  y -= 22;

  const tableX = MARGIN;
  const tableW = contentW;
  const colQty = tableX + tableW * 0.58;
  const colUnit = tableX + tableW * 0.7;
  const colTotal = tableX + tableW;

  // Table header row
  page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 22, color: rgb(0.93, 0.94, 0.96) });
  page.drawText('Description', { x: tableX + 12, y: y + 2, size: 8, font: fontBold, color: MUTED });
  page.drawText('Qty', { x: colQty, y: y + 2, size: 8, font: fontBold, color: MUTED });
  page.drawText('Unit Price', { x: colUnit, y: y + 2, size: 8, font: fontBold, color: MUTED });
  const thTotal = 'Amount';
  page.drawText(thTotal, {
    x: colTotal - 12 - fontBold.widthOfTextAtSize(thTotal, 8),
    y: y + 2,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  y -= 26;

  const rows =
    data.items.length > 0
      ? data.items
      : [
          {
            description: data.goodsSummary || 'Cargo services',
            qty: 1,
            price: data.totalAmount,
            lineTotal: data.totalAmount,
          },
        ];

  rows.forEach((row, i) => {
    if (i % 2 === 1) {
      page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 22, color: rgb(0.99, 0.99, 1) });
    }
    const desc = row.description.length > 48 ? `${row.description.slice(0, 45)}…` : row.description;
    page.drawText(desc, { x: tableX + 12, y: y + 2, size: 10, font, color: INK });
    page.drawText(String(row.qty), { x: colQty, y: y + 2, size: 10, font, color: INK });
    page.drawText(formatMoney(row.price), { x: colUnit, y: y + 2, size: 10, font, color: INK });
    const lineStr = formatMoney(row.lineTotal);
    page.drawText(lineStr, {
      x: colTotal - 12 - fontBold.widthOfTextAtSize(lineStr, 10),
      y: y + 2,
      size: 10,
      font: fontBold,
      color: INK,
    });
    y -= 24;
  });

  y -= 8;
  page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 1, color: LINE });

  // ── Totals box (right-aligned) ──
  y -= 20;
  const totalsW = 240;
  const totalsX = tableX + tableW - totalsW;
  const totalsLines = [
    { label: 'Subtotal', value: formatMoney(data.subtotal), bold: false },
    { label: 'Total Due', value: formatMoney(data.totalAmount), bold: false },
    { label: 'Paid (this receipt)', value: formatMoney(data.amountPaid), bold: true },
  ];
  const totalsH = 24 + totalsLines.length * 22 + 36;

  page.drawRectangle({
    x: totalsX,
    y: y - totalsH,
    width: totalsW,
    height: totalsH,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 1,
  });

  let ty = y - 20;
  for (const line of totalsLines) {
    page.drawText(line.label, {
      x: totalsX + 16,
      y: ty,
      size: 9,
      font: line.bold ? fontBold : font,
      color: MUTED,
    });
    const f = line.bold ? fontBold : font;
    page.drawText(line.value, {
      x: totalsX + totalsW - 16 - f.widthOfTextAtSize(line.value, 10),
      y: ty,
      size: 10,
      font: f,
      color: INK,
    });
    ty -= 22;
  }

  ty -= 6;
  page.drawRectangle({
    x: totalsX + 12,
    y: ty - 28,
    width: totalsW - 24,
    height: 32,
    color: data.paymentStatus === 'PAID' ? rgb(0.9, 0.97, 0.93) : rgb(1, 0.96, 0.9),
    borderColor: data.paymentStatus === 'PAID' ? rgb(0.7, 0.9, 0.75) : rgb(0.95, 0.85, 0.7),
    borderWidth: 1,
  });
  const balLabel = data.paymentStatus === 'PAID' ? 'Balance Remaining' : 'Balance Due';
  const balVal = data.paymentStatus === 'PAID' ? formatMoney(0) : formatMoney(data.balanceDue);
  page.drawText(balLabel, { x: totalsX + 20, y: ty - 12, size: 8, font: fontBold, color: MUTED });
  page.drawText(balVal, {
    x: totalsX + totalsW - 20 - fontBold.widthOfTextAtSize(balVal, 13),
    y: ty - 14,
    size: 13,
    font: fontBold,
    color: data.paymentStatus === 'PAID' ? rgb(0.12, 0.55, 0.35) : BRAND_DARK,
  });

  // Stamp — bottom right above footer
  try {
    const stampPath = path.join(process.cwd(), 'public', 'Stamp.jpeg');
    const stampBytes = fs.readFileSync(stampPath);
    const stampImg = await doc.embedJpg(stampBytes);
    const stampDims = stampImg.scaleToFit(100, 100);
    page.drawImage(stampImg, {
      x: width - MARGIN - stampDims.width,
      y: 82,
      width: stampDims.width,
      height: stampDims.height,
      opacity: 0.9,
    });
  } catch { /* stamp is optional */ }

  // ── Footer ──
  page.drawLine({ start: { x: MARGIN, y: 72 }, end: { x: width - MARGIN, y: 72 }, thickness: 1, color: LINE });
  page.drawText(BRAND_FOOTER, {
    x: MARGIN,
    y: 52,
    size: 8,
    font,
    color: MUTED,
  });
  const footerNote =
    data.paymentStatus === 'PAID'
      ? 'This document confirms payment received in full. Please retain for your records.'
      : `Partial payment recorded. Outstanding balance: ${formatMoney(data.balanceDue)}.`;
  page.drawText(footerNote, { x: MARGIN, y: 38, size: 8, font, color: MUTED });

  return doc.save();
}
