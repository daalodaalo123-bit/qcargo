import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BRAND_FOOTER, BRAND_NAME } from '@/lib/brand';
import fs from 'fs';
import path from 'path';

export interface QuotationPdfItem {
  description: string;
  notes?: string;
  specification?: string;
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

// Map characters Helvetica/WinAnsi cannot encode to safe equivalents, strip the rest.
const SPEC_CHAR_MAP: Record<string, string> = {
  '✓': '-', '✔': '-', '☑': '-', '•': '-', '·': '-', '◦': '-', '▪': '-', '■': '-',
  '–': '-', '—': '-', '×': 'x', '→': '->', '⇒': '=>', '…': '...',
  '“': '"', '”': '"', '‘': "'", '’': "'", ' ': ' ', '°': ' deg',
};
function sanitizeSpec(s: string): string {
  return s
    .replace(/\t/g, '  ')
    .replace(/[-￿]/g, (ch) => SPEC_CHAR_MAP[ch] ?? '')
    .replace(/[\x00-\x1F]/g, ' ');
}

// Append "Product Specification Sheet" page(s) rendering each item's spec text
// (markdown-ish: ## headings, * bullets, | tables |) with automatic pagination.
function addSpecificationPages(
  doc: PDFDocument,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  data: QuotationPdfData
) {
  const specItems = (data.items || []).filter((it) => (it.specification || '').trim());
  if (specItems.length === 0) return;

  const PW = 595;
  const PH = 842;
  const contentW = PW - MARGIN * 2;
  const BOTTOM = 64;
  const DARK = rgb(30 / 255, 36 / 255, 45 / 255);

  let page = doc.addPage([PW, PH]);
  let y = 0;

  const drawChrome = () => {
    page.drawRectangle({ x: 0, y: PH - 44, width: PW, height: 44, color: DARK });
    page.drawRectangle({ x: 0, y: PH - 44, width: PW, height: 3, color: BRAND_COLOR });
    page.drawText(BRAND_NAME, { x: MARGIN, y: PH - 30, size: 13, font: fontBold, color: WHITE });
    const tag = 'PRODUCT SPECIFICATION';
    page.drawText(tag, { x: PW - MARGIN - font.widthOfTextAtSize(tag, 8), y: PH - 28, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    page.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: PW - MARGIN, y: 50 }, thickness: 1, color: LINE });
    page.drawText(`${data.quoteNumber}  ·  ${data.customerName}`, { x: MARGIN, y: 36, size: 8, font, color: MUTED });
    y = PH - 70;
  };

  const newPage = () => { page = doc.addPage([PW, PH]); drawChrome(); };
  const ensure = (needed: number) => { if (y - needed < BOTTOM) newPage(); };

  const drawWrapped = (text: string, size: number, fnt: typeof font, color: ReturnType<typeof rgb>, indent = 0) => {
    const maxW = contentW - indent;
    const words = text.split(/\s+/).filter(Boolean);
    let line = '';
    const flush = () => {
      ensure(size + 4);
      page.drawText(line, { x: MARGIN + indent, y: y - size, size, font: fnt, color });
      y -= size + 4;
      line = '';
    };
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (fnt.widthOfTextAtSize(test, size) > maxW && line) { flush(); line = w; }
      else line = test;
    }
    if (line) flush();
  };

  const renderTable = (block: string[]) => {
    const rows = block
      .map((r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => sanitizeSpec(c.trim())))
      .filter((cells) => !cells.every((c) => c === '' || /^:?-{2,}:?$/.test(c)));
    if (rows.length === 0) return;
    const numCols = Math.max(...rows.map((r) => r.length));
    const colW = contentW / numCols;
    y -= 4;
    rows.forEach((cells, ri) => {
      const header = ri === 0;
      ensure(20);
      if (header) page.drawRectangle({ x: MARGIN, y: y - 14, width: contentW, height: 18, color: rgb(0.93, 0.94, 0.96) });
      for (let ci = 0; ci < numCols; ci++) {
        let txt = cells[ci] ?? '';
        const f = header ? fontBold : font;
        while (txt.length > 1 && f.widthOfTextAtSize(txt, 9) > colW - 10) txt = txt.slice(0, -2);
        page.drawText(txt, { x: MARGIN + ci * colW + 6, y: y - 10, size: 9, font: f, color: INK });
      }
      y -= 18;
      page.drawLine({ start: { x: MARGIN, y: y + 2 }, end: { x: MARGIN + contentW, y: y + 2 }, thickness: 0.5, color: LINE });
    });
    y -= 10;
  };

  const renderSpec = (raw: string) => {
    const lines = raw.replace(/\r/g, '').split('\n');
    let i = 0;
    while (i < lines.length) {
      const t = lines[i].trim();

      // Table block
      if (t.startsWith('|') && t.includes('|')) {
        const block: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { block.push(lines[i].trim()); i++; }
        renderTable(block);
        continue;
      }
      i++;

      if (!t) { y -= 6; continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
        ensure(12);
        page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: MARGIN + contentW, y: y - 4 }, thickness: 1, color: LINE });
        y -= 12;
        continue;
      }
      const h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = h[1].length;
        const size = level <= 1 ? 15 : level === 2 ? 13 : 11;
        y -= 8;
        ensure(size + 6);
        drawWrapped(sanitizeSpec(h[2]), size, fontBold, BRAND_DARK);
        y -= 3;
        continue;
      }
      const b = t.match(/^([*\-•✓])\s+(.*)$/);
      if (b) {
        ensure(16);
        page.drawText('-', { x: MARGIN + 6, y: y - 10, size: 10, font: fontBold, color: BRAND_COLOR });
        drawWrapped(sanitizeSpec(b[2]), 10, font, INK, 18);
        continue;
      }
      drawWrapped(sanitizeSpec(t), 10, font, INK);
    }
  };

  drawChrome();
  // Section title
  page.drawText('PRODUCT SPECIFICATION SHEET', { x: MARGIN, y, size: 16, font: fontBold, color: INK });
  y -= 28;

  for (const it of specItems) {
    ensure(40);
    page.drawRectangle({ x: MARGIN, y: y - 22, width: contentW, height: 26, color: BRAND_COLOR });
    let title = sanitizeSpec(it.description || 'Product');
    while (title.length > 1 && fontBold.widthOfTextAtSize(title, 12) > contentW - 20) title = title.slice(0, -2);
    page.drawText(title, { x: MARGIN + 10, y: y - 15, size: 12, font: fontBold, color: WHITE });
    y -= 38;
    renderSpec(it.specification || '');
    y -= 18;
  }
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

  // Note — below the totals box, 2 lines so it never reaches the total amount
  const noteY = y - boxH - 24;
  page.drawText('This is an estimate only.', { x: MARGIN, y: noteY, size: 8, font, color: MUTED });
  page.drawText('Final price may vary based on weight, dimensions and customs charges.', { x: MARGIN, y: noteY - 14, size: 8, font, color: MUTED });

  // Stamp — original black Stamp.jpeg, bottom-right corner, never covers text
  try {
    const stampPath = path.join(process.cwd(), 'public', 'Stamp.jpeg');
    const stampBytes = fs.readFileSync(stampPath);
    const stampImg = await doc.embedJpg(stampBytes);
    const stampDims = stampImg.scaleToFit(90, 90);
    page.drawImage(stampImg, {
      x: width - MARGIN - stampDims.width,
      y: 84,
      width: stampDims.width,
      height: stampDims.height,
    });
  } catch { /* stamp optional */ }

  // Footer
  page.drawLine({ start: { x: MARGIN, y: 72 }, end: { x: width - MARGIN, y: 72 }, thickness: 1, color: LINE });
  page.drawText(BRAND_FOOTER, { x: MARGIN, y: 52, size: 8, font, color: MUTED });
  page.drawText('To confirm this order, please contact us via WhatsApp or visit our office.', { x: MARGIN, y: 38, size: 8, font, color: MUTED });

  // Append product specification sheet page(s) when any item has detailed specs
  addSpecificationPages(doc, font, fontBold, data);

  return doc.save();
}
