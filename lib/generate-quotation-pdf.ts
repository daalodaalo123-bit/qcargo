import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BRAND_FOOTER, BRAND_NAME } from '@/lib/brand';
import fs from 'fs';
import path from 'path';

export interface QuotationPdfItem {
  description: string;
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

  // Header band
  const headerH = 108;
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: BRAND_COLOR });
  page.drawRectangle({ x: 0, y: height - headerH - 4, width, height: 4, color: BRAND_DARK });

  // Embed logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'qcargo-logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = await doc.embedPng(logoBytes);
    const logoSize = 64;
    page.drawImage(logoImg, { x: MARGIN, y: height - headerH + (headerH - logoSize) / 2, width: logoSize, height: logoSize });
    page.drawText(BRAND_NAME, { x: MARGIN + logoSize + 10, y: height - 48, size: 22, font: fontBold, color: WHITE });
    page.drawText('Logistics & Freight', { x: MARGIN + logoSize + 10, y: height - 70, size: 10, font, color: WHITE });
  } catch {
    // Fallback: no logo
    page.drawText(BRAND_NAME, { x: MARGIN, y: height - 48, size: 24, font: fontBold, color: WHITE });
    page.drawText('Logistics & Freight', { x: MARGIN, y: height - 72, size: 10, font, color: WHITE });
  }

  page.drawText('QUOTATION', { x: width - MARGIN - 140, y: height - 44, size: 7, font, color: WHITE });
  page.drawText(data.quoteNumber, { x: width - MARGIN - 140, y: height - 60, size: 14, font: fontBold, color: WHITE });

  const statusText = data.status.toUpperCase();
  const statusW = fontBold.widthOfTextAtSize(statusText, 8) + 16;
  page.drawRectangle({ x: width - MARGIN - statusW, y: height - 88, width: statusW, height: 18, color: WHITE });
  page.drawText(statusText, { x: width - MARGIN - statusW + 8, y: height - 84, size: 8, font: fontBold, color: BRAND_DARK });

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
    if (i % 2 === 1) {
      page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 22, color: rgb(0.99, 0.99, 1) });
    }
    const lineTotal = row.qty * row.price;
    const desc = row.description.length > 48 ? `${row.description.slice(0, 45)}…` : row.description;
    page.drawText(desc, { x: tableX + 12, y: y + 2, size: 10, font, color: INK });
    page.drawText(String(row.qty), { x: colQty, y: y + 2, size: 10, font, color: INK });
    page.drawText(formatMoney(row.price), { x: colUnit, y: y + 2, size: 10, font, color: INK });
    const lineTotalStr = formatMoney(lineTotal);
    page.drawText(lineTotalStr, { x: colTotal - 12 - fontBold.widthOfTextAtSize(lineTotalStr, 10), y: y + 2, size: 10, font: fontBold, color: INK });
    y -= 24;
  });

  y -= 8;
  page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 1, color: LINE });
  y -= 20;

  // Total box
  const totalsW = 200;
  const totalsX = tableX + tableW - totalsW;
  page.drawRectangle({ x: totalsX, y: y - 52, width: totalsW, height: 52, color: PANEL, borderColor: LINE, borderWidth: 1 });
  page.drawText('Subtotal', { x: totalsX + 16, y: y - 16, size: 9, font, color: MUTED });
  const subtotalStr = formatMoney(data.total);
  page.drawText(subtotalStr, { x: totalsX + totalsW - 16 - font.widthOfTextAtSize(subtotalStr, 10), y: y - 16, size: 10, font, color: INK });

  page.drawRectangle({ x: totalsX + 12, y: y - 48, width: totalsW - 24, height: 24, color: BRAND_COLOR, borderWidth: 0 });
  page.drawText('ESTIMATED TOTAL', { x: totalsX + 20, y: y - 40, size: 7, font: fontBold, color: WHITE });
  const totalStr = formatMoney(data.total);
  page.drawText(totalStr, { x: totalsX + totalsW - 20 - fontBold.widthOfTextAtSize(totalStr, 12), y: y - 41, size: 12, font: fontBold, color: WHITE });

  // Note
  y -= 72;
  page.drawText('This is an estimate only. Final price may vary based on weight, dimensions and customs charges.', {
    x: MARGIN, y, size: 8, font, color: MUTED,
  });

  // Footer
  page.drawLine({ start: { x: MARGIN, y: 72 }, end: { x: width - MARGIN, y: 72 }, thickness: 1, color: LINE });
  page.drawText(BRAND_FOOTER, { x: MARGIN, y: 52, size: 8, font, color: MUTED });
  page.drawText('To confirm this order, please contact us via WhatsApp or visit our office.', { x: MARGIN, y: 38, size: 8, font, color: MUTED });

  return doc.save();
}
