import { rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export interface PdfGood {
  description: string;
  qty: number;
  detail?: string;
}

const INK = rgb(0.1, 0.12, 0.18);
const MUTED = rgb(0.42, 0.47, 0.55);
const HEADER_BG = rgb(0.93, 0.94, 0.96);
const ALT = rgb(0.99, 0.99, 1);

const MAX_ROWS = 12;

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
  title?: string;
}): number {
  const { page, font, fontBold, x, width, goods } = opts;
  let y = opts.y;
  const shown = goods.slice(0, MAX_ROWS);

  page.drawText(opts.title || 'Description of Goods', { x, y, size: 11, font: fontBold, color: INK });
  y -= 20;

  page.drawRectangle({ x, y: y - 4, width, height: 20, color: HEADER_BG });
  page.drawText('Item', { x: x + 12, y: y + 2, size: 8, font: fontBold, color: MUTED });
  const qtyHead = 'Qty / Measure';
  page.drawText(qtyHead, {
    x: x + width - 12 - fontBold.widthOfTextAtSize(qtyHead, 8),
    y: y + 2,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  y -= 24;

  shown.forEach((g, i) => {
    if (i % 2 === 1) page.drawRectangle({ x, y: y - 4, width, height: 20, color: ALT });
    let desc = g.description;
    while (desc.length > 1 && font.widthOfTextAtSize(desc, 10) > width * 0.6) desc = desc.slice(0, -1);
    if (desc.length < g.description.length) desc = `${desc.slice(0, -1)}…`;
    page.drawText(desc, { x: x + 12, y: y + 2, size: 10, font, color: INK });

    const right = `${g.qty} pcs${g.detail ? ` · ${g.detail}` : ''}`;
    page.drawText(right, {
      x: x + width - 12 - font.widthOfTextAtSize(right, 9),
      y: y + 2,
      size: 9,
      font,
      color: MUTED,
    });
    y -= 20;
  });

  if (goods.length > MAX_ROWS) {
    page.drawText(`+ ${goods.length - MAX_ROWS} more item(s)`, { x: x + 12, y: y + 2, size: 8, font, color: MUTED });
    y -= 16;
  }

  return y - 6;
}
