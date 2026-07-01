import { rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export interface PdfGood {
  description: string;
  qty: number;
  weight?: number;
  cbm?: number;
}

const INK = rgb(0.1, 0.12, 0.18);
const MUTED = rgb(0.42, 0.47, 0.55);
const HEADER_BG = rgb(0.93, 0.94, 0.96);
const ALT = rgb(0.99, 0.99, 1);
const PANEL = rgb(0.97, 0.98, 0.99);
const LINE = rgb(0.88, 0.9, 0.93);

const MAX_ROWS = 12;

/**
 * Draw a light strip of label/value fields (e.g. freight type, weight/CBM,
 * rate) and return the new y cursor. Used on shipment documents so the customer
 * sees exactly the freight data that was entered.
 */
export function drawDetailStrip(opts: {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  x: number;
  y: number;
  width: number;
  fields: { label: string; value: string }[];
}): number {
  const { page, font, fontBold, x, width, fields } = opts;
  const y = opts.y;
  if (fields.length === 0) return y;

  const h = 34;
  page.drawRectangle({ x, y: y - h, width, height: h, color: PANEL, borderColor: LINE, borderWidth: 1 });

  const colW = width / fields.length;
  fields.forEach((f, i) => {
    const cx = x + i * colW + 12;
    page.drawText(f.label.toUpperCase(), { x: cx, y: y - 13, size: 7, font, color: MUTED });
    let val = f.value;
    while (val.length > 1 && fontBold.widthOfTextAtSize(val, 10) > colW - 18) val = val.slice(0, -1);
    page.drawText(val, { x: cx, y: y - 26, size: 10, font: fontBold, color: INK });
  });

  return y - h - 14;
}

/**
 * Draw a compact "Description of Goods" section (product name + qty + measured
 * size) and return the new y cursor. Shared by the quotation and receipt PDFs
 * for shipment documents. Only called when a goods list is supplied, so regular
 * quotations/invoices are unaffected.
 */
export function drawGoodsSection(opts: {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  x: number;
  y: number;
  width: number;
  goods: PdfGood[];
  /** Which measure column to show: KG (air freight) or CBM (sea freight). */
  unit: 'KG' | 'CBM';
  title?: string;
}): number {
  const { page, font, fontBold, x, width, goods, unit } = opts;
  let y = opts.y;
  const shown = goods.slice(0, MAX_ROWS);

  const colQtyX = x + width * 0.62;
  const colMeasureRight = x + width - 12;
  const maxDescW = colQtyX - (x + 12) - 8;

  page.drawText(opts.title || 'Description of Goods', { x, y, size: 11, font: fontBold, color: INK });
  y -= 20;

  // Header row: Product | Qty | Weight/Volume
  page.drawRectangle({ x, y: y - 4, width, height: 20, color: HEADER_BG });
  page.drawText('Product', { x: x + 12, y: y + 2, size: 8, font: fontBold, color: MUTED });
  page.drawText('Qty', { x: colQtyX, y: y + 2, size: 8, font: fontBold, color: MUTED });
  const measHead = unit === 'KG' ? 'Weight (KG)' : 'Volume (CBM)';
  page.drawText(measHead, {
    x: colMeasureRight - fontBold.widthOfTextAtSize(measHead, 8),
    y: y + 2,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  y -= 24;

  shown.forEach((g, i) => {
    if (i % 2 === 1) page.drawRectangle({ x, y: y - 4, width, height: 20, color: ALT });

    let desc = g.description;
    while (desc.length > 1 && font.widthOfTextAtSize(desc, 10) > maxDescW) desc = desc.slice(0, -1);
    if (desc.length < g.description.length) desc = `${desc.slice(0, -1)}…`;
    page.drawText(desc, { x: x + 12, y: y + 2, size: 10, font, color: INK });

    page.drawText(String(g.qty), { x: colQtyX, y: y + 2, size: 10, font, color: INK });

    const measVal =
      unit === 'KG'
        ? g.weight && g.weight > 0
          ? `${g.weight} KG`
          : '—'
        : g.cbm && g.cbm > 0
          ? `${g.cbm} CBM`
          : '—';
    page.drawText(measVal, {
      x: colMeasureRight - font.widthOfTextAtSize(measVal, 10),
      y: y + 2,
      size: 10,
      font,
      color: INK,
    });
    y -= 20;
  });

  if (goods.length > MAX_ROWS) {
    page.drawText(`+ ${goods.length - MAX_ROWS} more item(s)`, { x: x + 12, y: y + 2, size: 8, font, color: MUTED });
    y -= 16;
  }

  return y - 6;
}
