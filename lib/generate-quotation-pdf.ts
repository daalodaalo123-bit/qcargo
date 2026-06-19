import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BRAND_FOOTER, BRAND_NAME } from '@/lib/brand';
import fs from 'fs';
import path from 'path';

export interface QuotationPdfItem {
  description: string;
  notes?: string;
  qty: number;
  price: number;
}

export interface QuotationPdfData {
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  freightType: string;
  items: QuotationPdfItem[];
  total: number;
  status: string;
  paymentStatus?: string;
  commissionRate?: number;
  commissionAmount?: number;
}

const MARGIN = 48;
const BRAND_COLOR = rgb(241 / 255, 93 / 255, 56 / 255);
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

export async function generateQuotationPdf(data: QuotationPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const contentW = width - MARGIN * 2;

  // Header: dark navy background (matches brand identity)
  const headerH = 120;
  const DARK = rgb(30 / 255, 36 / 255, 45 / 255);   // #1E242D
  const STATUS_APPROVED = rgb(22 / 255, 163 / 255, 74 / 255);   // green-600
  const STATUS_REJECTED = rgb(220 / 255, 38 / 255, 38 / 255);   // red-600
  const accentColor =
    data.status === 'APPROVED' ? STATUS_APPROVED :
    data.status === 'REJECTED' ? STATUS_REJECTED :
    BRAND_COLOR;
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: DARK });
  // Accent strip at bottom of header — color reflects quotation status
  page.drawRectangle({ x: 0, y: height - headerH, width, height: 4, color: accentColor });

  // Logo (dark bg version fits perfectly on dark header)
  const logoH = 80;
  const logoW = 200;
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'qcargo-logo-dark.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = await doc.embedPng(logoBytes);
    const dims = logoImg.scaleToFit(logoW, logoH);
    page.drawImage(logoImg, {
      x: MARGIN,
      y: height - headerH + (headerH - dims.height) / 2 + 2,
      width: dims.width,
      height: dims.height,
    });
    logoDrawn = true;
  } catch { /* fallback below */ }

  if (!logoDrawn) {
    page.drawText('Q CARGO', { x: MARGIN, y: height - 52, size: 26, font: fontBold, color: WHITE });
    page.drawText('Logistics & Freight', { x: MARGIN, y: height - 74, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
  }

  // Quotation number — right side
  page.drawText('QUOTATION', { x: width - MARGIN - 140, y: height - 44, size: 7, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(data.quoteNumber, { x: width - MARGIN - 140, y: height - 62, size: 14, font: fontBold, color: WHITE });

  const statusText = data.status.toUpperCase();
  const statusW = fontBold.widthOfTextAtSize(statusText, 8) + 16;
  page.drawRectangle({ x: width - MARGIN - statusW, y: height - 94, width: statusW, height: 18, color: accentColor });
  page.drawText(statusText, { x: width - MARGIN - statusW + 8, y: height - 90, size: 8, font: fontBold, color: WHITE });

  if (data.paymentStatus && data.paymentStatus !== 'UNPAID') {
    const payText = data.paymentStatus === 'PAID' ? 'PAID IN FULL' : 'PARTIAL PAYMENT';
    const payColor = data.paymentStatus === 'PAID' ? STATUS_APPROVED : rgb(234 / 255, 179 / 255, 8 / 255);
    const payW = fontBold.widthOfTextAtSize(payText, 8) + 16;
    page.drawRectangle({ x: width - MARGIN - payW, y: height - 116, width: payW, height: 18, color: payColor });
    page.drawText(payText, { x: width - MARGIN - payW + 8, y: height - 112, size: 8, font: fontBold, color: WHITE });
  }

  // Info panel
  let y = height - headerH - 28;
  const panelTop = y - 8;
  const panelH = 90;
  page.drawRectangle({ x: MARGIN, y: panelTop - panelH, width: contentW, height: panelH, color: PANEL, borderColor: LINE, borderWidth: 1 });

  const colL = MARGIN + 20;
  const colR = MARGIN + contentW / 2 + 12;
  const row1 = panelTop - 28;
  const row2 = panelTop - 62;

  drawField(page, font, fontBold, colL, row1, 'Prepared For', data.customerName, contentW / 2 - 40);
  drawField(page, font, fontBold, colR, row1, 'Phone', data.customerPhone, contentW / 2 - 40);
  drawField(page, font, fontBold, colL, row2, 'Freight Type', `${data.freightType} Cargo`, contentW / 2 - 40);
  drawField(page, font, fontBold, colR, row2, 'Quote Date', formatDate(data.date), contentW / 2 - 40);

  y = panelTop - panelH - 32;

  // Items table
  page.drawText('Description of Goods', { x: MARGIN, y, size: 11, font: fontBold, color: INK });
  y -= 22;

  const tableX = MARGIN;
  const tableW = contentW;
  const colQty = tableX + tableW * 0.58;
  const colUnit = tableX + tableW * 0.72;
  const colTotal = tableX + tableW;

  page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 22, color: rgb(0.93, 0.94, 0.96) });
  page.drawText('Description', { x: tableX + 12, y: y + 2, size: 8, font: fontBold, color: MUTED });
  page.drawText('Qty', { x: colQty, y: y + 2, size: 8, font: fontBold, color: MUTED });
  page.drawText('Unit Price', { x: colUnit, y: y + 2, size: 8, font: fontBold, color: MUTED });
  const thTotal = 'Total';
  page.drawText(thTotal, { x: colTotal - 12 - fontBold.widthOfTextAtSize(thTotal, 8), y: y + 2, size: 8, font: fontBold, color: MUTED });
  y -= 26;

  const rows = data.items.length > 0
    ? data.items
    : [{ description: 'General Cargo', qty: 1, price: data.total }];

  rows.forEach((row, i) => {
    const rowH = row.notes?.trim() ? 36 : 24;
    if (i % 2 === 1) {
      page.drawRectangle({ x: tableX, y: y - rowH + 18, width: tableW, height: rowH, color: rgb(0.99, 0.99, 1) });
    }
    const lineTotal = row.qty * row.price;
    const desc = row.description.length > 48 ? `${row.description.slice(0, 45)}…` : row.description;
    page.drawText(desc, { x: tableX + 12, y: y + 2, size: 10, font: fontBold, color: INK });
    if (row.notes?.trim()) {
      const noteText = row.notes.length > 60 ? `${row.notes.slice(0, 57)}…` : row.notes;
      page.drawText(noteText, { x: tableX + 12, y: y - 11, size: 8, font, color: MUTED });
    }
    page.drawText(String(row.qty), { x: colQty, y: y + 2, size: 10, font, color: INK });
    page.drawText(formatMoney(row.price), { x: colUnit, y: y + 2, size: 10, font, color: INK });
    const lineTotalStr = formatMoney(lineTotal);
    page.drawText(lineTotalStr, { x: colTotal - 12 - fontBold.widthOfTextAtSize(lineTotalStr, 10), y: y + 2, size: 10, font: fontBold, color: INK });
    y -= rowH;
  });

  y -= 8;
  page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 1, color: LINE });
  y -= 20;

  // Total box
  const totalsW = 220;
  const totalsX = tableX + tableW - totalsW;
  const hasCommission = (data.commissionRate ?? 0) > 0 && (data.commissionAmount ?? 0) > 0;
  const subtotalAmt = hasCommission ? data.total - (data.commissionAmount ?? 0) : data.total;
  const boxH = hasCommission ? 76 : 52;

  page.drawRectangle({ x: totalsX, y: y - boxH, width: totalsW, height: boxH, color: PANEL, borderColor: LINE, borderWidth: 1 });

  let ty = y - 16;
  page.drawText('Subtotal', { x: totalsX + 16, y: ty, size: 9, font, color: MUTED });
  const subtotalStr = formatMoney(subtotalAmt);
  page.drawText(subtotalStr, { x: totalsX + totalsW - 16 - font.widthOfTextAtSize(subtotalStr, 10), y: ty, size: 10, font, color: INK });

  if (hasCommission) {
    ty -= 22;
    const commLabel = `Commission (${data.commissionRate}%)`;
    page.drawText(commLabel, { x: totalsX + 16, y: ty, size: 9, font, color: MUTED });
    const commStr = formatMoney(data.commissionAmount ?? 0);
    page.drawText(commStr, { x: totalsX + totalsW - 16 - font.widthOfTextAtSize(commStr, 10), y: ty, size: 10, font, color: BRAND_COLOR });
  }

  page.drawRectangle({ x: totalsX + 12, y: y - boxH + 4, width: totalsW - 24, height: 24, color: BRAND_COLOR, borderWidth: 0 });
  page.drawText('ESTIMATED TOTAL', { x: totalsX + 20, y: y - boxH + 12, size: 7, font: fontBold, color: WHITE });
  const totalStr = formatMoney(data.total);
  page.drawText(totalStr, { x: totalsX + totalsW - 20 - fontBold.widthOfTextAtSize(totalStr, 12), y: y - boxH + 11, size: 12, font: fontBold, color: WHITE });

  // Note — positioned below the totals box, split into 2 lines
  const noteY = y - boxH - 24;
  const INK_BLUE = rgb(0, 48 / 255, 135 / 255);

  page.drawText('This is an estimate only.', {
    x: MARGIN, y: noteY, size: 8, font, color: MUTED,
  });
  page.drawText('Final price may vary based on weight, dimensions and customs charges.', {
    x: MARGIN, y: noteY - 14, size: 8, font, color: MUTED,
  });

  // Ink-blue stamp — right side, close to the note text
  const sX = width - MARGIN - 46;
  const sY = noteY - 12;
  const sR = 42;

  // Outer ring (white fill so it sits cleanly on the page)
  page.drawCircle({ x: sX, y: sY, size: sR, color: rgb(1, 1, 1), borderColor: INK_BLUE, borderWidth: 2.5 });
  // Inner ring
  page.drawCircle({ x: sX, y: sY, size: sR - 8, borderColor: INK_BLUE, borderWidth: 1 });
  // Top arc text
  const topTxt = 'Q  CARGO';
  page.drawText(topTxt, { x: sX - fontBold.widthOfTextAtSize(topTxt, 7) / 2, y: sY + sR - 16, size: 7, font: fontBold, color: INK_BLUE });
  // Centre dividers
  page.drawLine({ start: { x: sX - 22, y: sY + 6 },  end: { x: sX + 22, y: sY + 6 },  thickness: 0.75, color: INK_BLUE });
  page.drawLine({ start: { x: sX - 22, y: sY - 8 }, end: { x: sX + 22, y: sY - 8 }, thickness: 0.75, color: INK_BLUE });
  // Centre letter
  const qTxt = 'Q';
  page.drawText(qTxt, { x: sX - fontBold.widthOfTextAtSize(qTxt, 14) / 2, y: sY - 6, size: 14, font: fontBold, color: INK_BLUE });
  // Bottom arc text
  const botTxt = 'RELIABLE · SAFE';
  page.drawText(botTxt, { x: sX - font.widthOfTextAtSize(botTxt, 6) / 2, y: sY - sR + 9, size: 6, font, color: INK_BLUE });

  // Footer
  page.drawLine({ start: { x: MARGIN, y: 72 }, end: { x: width - MARGIN, y: 72 }, thickness: 1, color: LINE });
  page.drawText(BRAND_FOOTER, { x: MARGIN, y: 52, size: 8, font, color: MUTED });
  page.drawText('To confirm this order, please contact us via WhatsApp or visit our office.', { x: MARGIN, y: 38, size: 8, font, color: MUTED });

  return doc.save();
}
