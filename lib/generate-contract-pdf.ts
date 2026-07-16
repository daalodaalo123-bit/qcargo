import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { BRAND_FOOTER, BRAND_NAME, CONTACT_SITE_HOST } from '@/lib/brand';
import fs from 'fs';
import path from 'path';

export interface ContractPdfItem {
  description: string;
  qty: number;
  price: number;
}

export interface ContractTermSection {
  heading: string;
  body: string;                // plain text; lines starting with "- " render as bullets
}

export interface ContractPdfData {
  ref: string;
  customerName: string;
  customerPhone: string;
  email?: string;
  deliveryTo?: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  issuedDate: string;          // ISO yyyy-mm-dd
  quotationDate?: string;      // ISO yyyy-mm-dd — date of the underlying quotation
  freightType: 'AIR' | 'SEA' | string;
  items: ContractPdfItem[];
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  receiptNo?: string;          // e.g. INV-32133196
  paymentMethod?: string;      // e.g. eDahab, Zaad, Bank
  paymentDate?: string;        // ISO yyyy-mm-dd
  terms?: ContractTermSection[]; // custom (edited) terms; empty/undefined = standard terms
}

const PW = 595;
const PH = 842;
const MARGIN = 48;
const CONTENT_W = PW - MARGIN * 2;
const FOOTER_TOP = 78;

const BRAND = rgb(241 / 255, 93 / 255, 56 / 255);   // #F15D38 orange
const DARK = rgb(30 / 255, 36 / 255, 45 / 255);      // #1E242D navy
const INK = rgb(0.1, 0.12, 0.18);
const MUTED = rgb(0.42, 0.47, 0.55);
const LINE = rgb(0.86, 0.88, 0.91);
const PANEL = rgb(0.97, 0.98, 0.99);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(22 / 255, 163 / 255, 74 / 255);   // emerald-600
const RED = rgb(220 / 255, 38 / 255, 38 / 255);      // red-600

function money(n: number) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Keep text inside WinAnsi/Helvetica so pdf-lib never throws on customer input.
function safe(s: string): string {
  return (s || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

// ─── Terms & Conditions content (standard Q Cargo Service Agreement — covers ALL
// services: sourcing, purchasing, freight, customs and delivery; approved 2026-07-16) ──
type TermBlock = string | { bullets: string[] };
interface TermSection { heading: string; blocks: TermBlock[]; }

function buildTerms(data: ContractPdfData): TermSection[] {
  const isAir = (data.freightType || 'SEA').toUpperCase() === 'AIR';
  const mode = isAir ? 'air' : 'sea';
  const transit = isAir
    ? 'Air cargo to the destination typically takes approximately 7 to 15 days from departure.'
    : 'Sea cargo to the destination typically takes approximately 30 to 60 days from departure.';

  // Payment acknowledgement — every figure (paid, percentage, balance) is calculated
  // by the system from the contract, never typed by hand.
  const paid = data.amountPaid ?? 0;
  const bal = data.balanceDue != null ? data.balanceDue : Math.max(0, data.total - paid);
  let paymentLine: string;
  if (paid > 0) {
    const receipt = [
      data.receiptNo ? `Receipt ${data.receiptNo}` : '',
      [
        data.paymentMethod ? `paid by ${data.paymentMethod}` : '',
        data.paymentDate ? `on ${formatDate(data.paymentDate)}` : '',
      ].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');
    const pct = data.total > 0 ? Math.round((paid / data.total) * 100) : 0;
    paymentLine = bal > 0.01
      ? `Payment received to date: ${money(paid)}${receipt ? ` (${receipt})` : ''}, representing ${pct}% of the estimated total. The outstanding balance of ${money(bal)} is payable in full before the Goods are released or delivered.`
      : `Payment received to date: ${money(paid)}${receipt ? ` (${receipt})` : ''}. The estimated total has been paid in full.`;
  } else {
    paymentLine = 'A deposit of at least fifty percent (50%) of the estimated total is payable to confirm the booking.';
  }

  return [
    { heading: '1. DEFINITIONS', blocks: [
      `"Company" / "${BRAND_NAME}" means ${BRAND_NAME} of Hargeisa, Somaliland, acting as the Customer's sourcing, purchasing, freight forwarding, customs coordination and delivery service provider. "Customer" means the party named in this Agreement, the purchaser and final recipient of the Goods. "Goods" means the items listed in Schedule A. "Quotation" means quotation ${data.ref} together with any specifications or amendments accepted by both parties. "Services" means the services described in Section 2.`,
    ] },
    { heading: '2. SCOPE OF SERVICES', blocks: [
      'The Company agrees to provide the following services with reasonable care and professional standards:',
      { bullets: [
        'Source and purchase the Goods on behalf of the Customer, where included in the Quotation.',
        'Coordinate with suppliers and manufacturers.',
        'Package and prepare the Goods for shipment.',
        `Arrange international ${mode} freight and transportation.`,
        'Coordinate customs clearance, and pay customs duties and taxes where included in the agreed Quotation.',
        "Arrange final delivery to the Customer's delivery address.",
      ] },
      'The Company may engage shipping lines, carriers, suppliers, customs brokers, warehouses and other third parties to perform the Services.',
    ] },
    { heading: '3. SOURCING AND PURCHASING', blocks: [
      { bullets: [
        "Where the Company purchases Goods on the Customer's behalf, it does so according to the descriptions, specifications and quantities approved by the Customer.",
        'The Company is not the manufacturer of the Goods. The Company will take reasonable steps to check quantity and visible condition before shipment, but does not give any warranty of quality, fitness or performance beyond that given by the supplier.',
        'Any change to the approved Goods requested by the Customer after purchase may change the price and delivery time, and costs already committed are payable by the Customer.',
      ] },
    ] },
    { heading: '4. CHARGES AND ESTIMATES', blocks: [
      { bullets: [
        `The total shown in Schedule A (${money(data.total)}) is an ESTIMATE and not a fixed final price. Final charges follow the actual weight, volume and dimensions of the Goods as measured at loading, and may increase or decrease accordingly.`,
        `A service commission of ${data.commissionRate}% applies as shown in Schedule A.`,
        'Unless expressly stated, charges do not include customs duties, import taxes, port charges, inspection fees, demurrage, storage or government levies at destination, all of which are payable by the Customer - except where the Quotation expressly includes them.',
        'The Company will notify the Customer of any material change to the estimated charges as soon as reasonably practicable.',
      ] },
    ] },
    { heading: '5. PAYMENT TERMS', blocks: [
      { bullets: [
        'A deposit is payable to confirm the booking; the Company is not obliged to purchase, ship, release or deliver the Goods until the sums due at each stage have been paid.',
        paymentLine,
        'All bank and transfer fees are borne by the Customer. Sums not paid when due may delay shipment or release and may attract storage charges.',
      ] },
    ] },
    { heading: '6. DELIVERY AND TRANSIT TIMES', blocks: [
      { bullets: [
        `Any transit or delivery time quoted is an estimate given in good faith and is not guaranteed. ${transit}`,
        'The Company shall not be liable for any delay caused by suppliers, shipping lines, carriers, weather, port congestion, customs, inspections, strikes, or any cause beyond its reasonable control. Time shall not be of the essence in respect of delivery.',
      ] },
    ] },
    { heading: "7. CUSTOMER'S OBLIGATIONS AND WARRANTIES", blocks: [
      'The Customer warrants and undertakes that:',
      { bullets: [
        'all information and descriptions provided about the Goods (including nature, value, weight and quantity) are complete and accurate;',
        'the Goods are lawful to export, ship and import, and are not prohibited, restricted, counterfeit, stolen or dangerous;',
        'the Customer holds all permits, licences and authorisations required for the import and receipt of the Goods;',
        'the Customer will respond promptly to requests for approvals, documents or payments needed to progress the order; and',
        'the Customer shall indemnify and hold the Company harmless against any loss, fine, penalty, duty, claim or expense arising from any breach of these warranties, any misdeclaration, or any inaccurate or incomplete information.',
      ] },
    ] },
    { heading: '8. PROHIBITED AND RESTRICTED GOODS', blocks: [
      { bullets: [
        'The Customer shall not order or ship any goods that are illegal, hazardous, explosive, flammable, perishable (unless agreed in writing), narcotic, counterfeit, or otherwise prohibited or restricted by law or by any carrier.',
        "The Company may open, inspect, scan or x-ray any consignment at any time without notice, and may refuse, hold, return or dispose of any Goods found or reasonably suspected to be prohibited or restricted, at the Customer's cost and without liability.",
      ] },
    ] },
    { heading: '9. CUSTOMS, DUTIES AND TAXES', blocks: [
      { bullets: [
        'Where the Quotation includes customs duties and taxes, the Company pays them as part of the Services. Otherwise, all customs clearance, import duties, taxes, levies and related charges at the destination are the responsibility of the Customer.',
        'The Company shall not be liable for any delay, cost, seizure, detention or loss arising from the action or requirements of customs or any other government authority.',
      ] },
    ] },
    { heading: '10. RISK, TITLE AND INSURANCE', blocks: [
      { bullets: [
        "The Goods travel at the Customer's risk. Insurance is NOT included in the charges unless expressly stated in writing. The Company strongly recommends cargo insurance and can arrange it on the Customer's written request, at additional cost.",
        "Goods purchased with the Customer's funds belong to the Customer; however, the Company holds a lien (right to retain) over the Goods until all sums due have been paid in full.",
        'Where the Customer chooses not to insure the Goods, the Customer accepts the risk of loss or damage in transit and the limitations of liability set out in this Agreement.',
      ] },
    ] },
    { heading: '11. LIABILITY AND LIMITATION OF LIABILITY', blocks: [
      { bullets: [
        "The Company's liability, if any, is limited to loss or damage directly caused by the Company's own proven negligence in performing the Services.",
        "The Company's total liability for any claim shall not exceed the service charges paid for the affected consignment, or the declared value of the affected Goods, whichever is lower - except where the Goods are insured, in which case the insurance terms apply.",
        'The Company shall not be liable for indirect, consequential or economic loss; loss of profit, business or opportunity; loss or damage due to inherent defect, natural deterioration, or inadequate packing by the supplier or the Customer; or any event of Force Majeure.',
        'Any claim must be notified to the Company in writing within seven (7) days of delivery (or of the expected delivery date, where the Goods are not delivered), failing which the claim is waived.',
      ] },
    ] },
    { heading: '12. STORAGE AND UNCOLLECTED GOODS', blocks: [
      { bullets: [
        "The Customer must take delivery or collect the Goods within sixteen (16) days of the Company's notice of arrival.",
        "After that period, the Goods are stored at the Customer's risk and cost, and storage charges apply at the Company's prevailing rates.",
        'Where Goods remain uncollected and charges unpaid for more than sixty (60) days, the Company may sell or dispose of the Goods and apply the proceeds towards outstanding charges, without further liability to the Customer.',
      ] },
    ] },
    { heading: '13. CANCELLATION AND REFUNDS', blocks: [
      { bullets: [
        'Any cancellation must be made in writing.',
        "Before the Goods are purchased or shipment is booked, the deposit - less any costs and administration fees already incurred by the Company - may be refunded at the Company's discretion.",
        'Once the Goods have been purchased from a supplier, booked with a carrier, loaded or shipped, charges are non-refundable to the extent of costs committed or incurred.',
      ] },
    ] },
    { heading: '14. FORCE MAJEURE', blocks: [
      'Neither party shall be liable for any failure or delay in performing its obligations caused by events beyond its reasonable control, including but not limited to acts of God, weather, war, civil unrest, government action, strikes, port closures, carrier or supplier failure, pandemic or accident.',
    ] },
    { heading: '15. CONFIDENTIALITY', blocks: [
      'Each party shall keep confidential the commercial information of the other disclosed in connection with this Agreement and use it only for the purpose of performing this Agreement.',
    ] },
    { heading: '16. GOVERNING LAW AND DISPUTE RESOLUTION', blocks: [
      { bullets: [
        'This Agreement is governed by the laws of Somaliland.',
        'The parties shall first seek to resolve any dispute amicably and in good faith. Any dispute not so resolved may be referred to the competent courts in Hargeisa, Somaliland.',
      ] },
    ] },
    { heading: '17. GENERAL', blocks: [
      { bullets: [
        'This Agreement, together with the Quotation and Schedule A, constitutes the entire agreement between the parties and supersedes any prior discussions or representations.',
        'No variation is effective unless agreed in writing by both parties.',
        'If any provision is held invalid or unenforceable, the remaining provisions continue in full force.',
        'The Company may perform the Services through subcontractors and agents.',
      ] },
    ] },
  ];
}

// Standard terms in editable form: one plain-text body per section, "- " lines = bullets.
// Used to prefill the contract editor and to render contracts with no custom terms.
export function defaultContractTerms(data: ContractPdfData): ContractTermSection[] {
  return buildTerms(data).map((sec) => ({
    heading: sec.heading,
    body: sec.blocks
      .map((b) => (typeof b === 'string' ? b : b.bullets.map((x) => `- ${x}`).join('\n')))
      .join('\n'),
  }));
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export async function generateContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let logoImg: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'qcargo-logo-dark.png'));
    logoImg = await doc.embedPng(logoBytes);
  } catch { /* logo optional */ }

  let stampImg: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
  try {
    const stampBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Stamp.jpeg'));
    stampImg = await doc.embedJpg(stampBytes);
  } catch { /* stamp optional */ }

  let page: PDFPage = doc.addPage([PW, PH]);
  let y = 0;

  // Draws the dark header band + footer chrome on the current page.
  const drawChrome = () => {
    const headerH = 70;
    page.drawRectangle({ x: 0, y: PH - headerH, width: PW, height: headerH, color: DARK });
    page.drawRectangle({ x: 0, y: PH - headerH, width: PW, height: 3, color: BRAND });
    if (logoImg) {
      const dims = logoImg.scaleToFit(150, 46);
      page.drawImage(logoImg, { x: MARGIN, y: PH - headerH + (headerH - dims.height) / 2, width: dims.width, height: dims.height });
    } else {
      page.drawText(BRAND_NAME, { x: MARGIN, y: PH - 42, size: 20, font: fontBold, color: WHITE });
    }
    if (logoImg) {
      page.drawText('R E L I A B L E   ·   S A F E', { x: MARGIN + 2, y: PH - headerH + 8, size: 6, font: fontBold, color: rgb(0.55, 0.6, 0.68) });
    }
    const title = 'Q CARGO SERVICE AGREEMENT';
    page.drawText(title, { x: PW - MARGIN - fontBold.widthOfTextAtSize(title, 12), y: PH - 34, size: 12, font: fontBold, color: WHITE });
    const refLine = `Agreement Ref: ${data.ref}`;
    page.drawText(refLine, { x: PW - MARGIN - font.widthOfTextAtSize(refLine, 8), y: PH - 50, size: 8, font, color: BRAND });
    // Footer
    page.drawLine({ start: { x: MARGIN, y: FOOTER_TOP }, end: { x: PW - MARGIN, y: FOOTER_TOP }, thickness: 1, color: LINE });
    page.drawText(safe(BRAND_FOOTER), { x: MARGIN, y: 58, size: 8, font, color: MUTED });
    page.drawText('To confirm this order, please contact us via WhatsApp or visit our office.', { x: MARGIN, y: 44, size: 8, font: fontItalic, color: MUTED });
    const pageNo = `Agreement ${data.ref}`;
    page.drawText(pageNo, { x: PW - MARGIN - font.widthOfTextAtSize(pageNo, 8), y: 44, size: 8, font, color: MUTED });
    y = PH - 70 - 24;
  };

  const newPage = () => { page = doc.addPage([PW, PH]); drawChrome(); };
  const ensure = (needed: number) => { if (y - needed < FOOTER_TOP + 12) newPage(); };

  const wrap = (text: string, f: PDFFont, size: number, maxW: number): string[] => {
    const words = safe(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  const paragraph = (text: string, f: PDFFont, size: number, color: ReturnType<typeof rgb>, x = MARGIN, maxW = CONTENT_W, lead = 3) => {
    for (const ln of wrap(text, f, size, maxW)) {
      ensure(size + lead);
      page.drawText(ln, { x, y: y - size, size, font: f, color });
      y -= size + lead;
    }
  };

  const bullet = (text: string, size = 9) => {
    const indent = 14;
    const lines = wrap(text, font, size, CONTENT_W - indent);
    ensure(size + 3);
    page.drawText('-', { x: MARGIN + 2, y: y - size, size, font: fontBold, color: BRAND });
    lines.forEach((ln, i) => {
      if (i > 0) ensure(size + 3);
      page.drawText(ln, { x: MARGIN + indent, y: y - size, size, font, color: INK });
      y -= size + 3;
    });
    y -= 2;
  };

  const sectionHeader = (text: string) => {
    ensure(46);
    y -= 8; // top padding so the band never overlaps preceding content
    const bandH = 22;
    page.drawRectangle({ x: MARGIN, y: y - bandH, width: CONTENT_W, height: bandH, color: DARK });
    page.drawRectangle({ x: MARGIN, y: y - bandH, width: 3, height: bandH, color: BRAND });
    page.drawText(text, { x: MARGIN + 12, y: y - 15, size: 10, font: fontBold, color: WHITE });
    y -= bandH + 12;
  };

  // ── PAGE 1 ──
  drawChrome();

  // Brand sub-line + issue date (same row)
  page.drawText('SOURCING  ·  PURCHASING  ·  SEA & AIR CARGO  ·  HARGEISA, SOMALILAND', { x: MARGIN, y: y - 8, size: 7.5, font: fontBold, color: BRAND });
  const issued = `Issued: ${formatDate(data.issuedDate)}`;
  page.drawText(issued, { x: PW - MARGIN - font.widthOfTextAtSize(issued, 8), y: y - 8, size: 8, font, color: MUTED });
  y -= 14;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PW - MARGIN, y }, thickness: 0.75, color: LINE });
  y -= 16;

  // Intro paragraph — "made on the 13th day of July 2026", quotation date shown separately.
  const issuedD = new Date(data.issuedDate.includes('T') ? data.issuedDate : `${data.issuedDate}T12:00:00`);
  const madeOn = `the ${ordinal(issuedD.getDate())} day of ${issuedD.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
  const intro = `This Service Agreement (the "Agreement") is made on ${madeOn} between ${BRAND_NAME} of Hargeisa, Somaliland (the "Company", "we", "us"), and the Customer named below (the "Customer", "you"). This Agreement is issued in connection with Quotation ${data.ref} dated ${formatDate(data.quotationDate || data.issuedDate)} and governs the sourcing, purchasing, shipping, customs clearance and delivery of the goods described in Schedule A. By signing this Agreement, confirming the booking in writing, or paying any deposit, the Customer accepts the Terms and Conditions set out below.`;
  paragraph(intro, font, 9, INK, MARGIN, CONTENT_W, 3);
  y -= 8;

  // Parties + delivery panel — delivery address gets its own full-width block so it never gets cut off.
  sectionHeader('PARTIES & DELIVERY DETAILS');
  const delAddrLines = data.deliveryTo ? wrap(data.deliveryTo, fontBold, 9.5, CONTENT_W - 32) : [];
  const delContact = [
    data.deliveryPhone ? `Telephone: ${safe(data.deliveryPhone)}` : '',
    data.deliveryEmail ? `Email: ${safe(data.deliveryEmail)}` : '',
  ].filter(Boolean).join('        ');
  const topH = 92;
  const delH = 24 + Math.max(1, delAddrLines.length) * 13 + (delContact ? 13 : 0);
  const panelH = topH + delH;
  ensure(panelH);
  page.drawRectangle({ x: MARGIN, y: y - panelH, width: CONTENT_W, height: panelH, color: PANEL, borderColor: LINE, borderWidth: 1 });
  const colL = MARGIN + 16;
  const colR = MARGIN + CONTENT_W / 2 + 12;
  let py = y - 18;
  page.drawText('THE COMPANY (SERVICE PROVIDER)', { x: colL, y: py, size: 7, font: fontBold, color: MUTED });
  page.drawText('THE CUSTOMER (PURCHASER & CONSIGNEE)', { x: colR, y: py, size: 7, font: fontBold, color: MUTED });
  py -= 15;
  page.drawText(BRAND_NAME, { x: colL, y: py, size: 11, font: fontBold, color: INK });
  page.drawText(safe(data.customerName) || '—', { x: colR, y: py, size: 11, font: fontBold, color: INK });
  py -= 14;
  page.drawText('Hargeisa, Somaliland', { x: colL, y: py, size: 9, font, color: INK });
  page.drawText(safe(`Telephone: ${data.customerPhone || '—'}`), { x: colR, y: py, size: 9, font, color: INK });
  py -= 13;
  page.drawText(CONTACT_SITE_HOST, { x: colL, y: py, size: 9, font, color: INK });
  page.drawText(safe(`Email: ${data.email || '______________________'}`), { x: colR, y: py, size: 9, font, color: INK });
  py -= 13;
  page.drawText(`Freight Type: ${(data.freightType || 'SEA').toUpperCase() === 'AIR' ? 'Air' : 'Sea'} Cargo`, { x: colL, y: py, size: 9, font, color: INK });
  // Delivery block (full width, under a divider)
  py = y - topH + 4;
  page.drawLine({ start: { x: MARGIN + 12, y: py }, end: { x: MARGIN + CONTENT_W - 12, y: py }, thickness: 0.6, color: LINE });
  py -= 13;
  page.drawText('DELIVERY ADDRESS', { x: colL, y: py, size: 7, font: fontBold, color: MUTED });
  py -= 13;
  if (delAddrLines.length) {
    for (const ln of delAddrLines) {
      page.drawText(ln, { x: colL, y: py, size: 9.5, font: fontBold, color: INK });
      py -= 13;
    }
  } else {
    page.drawText('________________________________________________', { x: colL, y: py, size: 9, font, color: INK });
    py -= 13;
  }
  if (delContact) page.drawText(delContact, { x: colL, y: py, size: 9, font, color: INK });
  y -= panelH + 14;

  // Schedule A — goods table
  sectionHeader('SCHEDULE A - DESCRIPTION OF GOODS');
  const colQty = MARGIN + CONTENT_W * 0.56;
  const colUnit = MARGIN + CONTENT_W * 0.72;
  const colTot = MARGIN + CONTENT_W;
  ensure(24);
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 20, color: rgb(0.93, 0.94, 0.96) });
  page.drawText('DESCRIPTION', { x: MARGIN + 10, y: y + 1, size: 8, font: fontBold, color: MUTED });
  page.drawText('QTY', { x: colQty, y: y + 1, size: 8, font: fontBold, color: MUTED });
  page.drawText('UNIT PRICE', { x: colUnit, y: y + 1, size: 8, font: fontBold, color: MUTED });
  page.drawText('TOTAL', { x: colTot - 10 - fontBold.widthOfTextAtSize('TOTAL', 8), y: y + 1, size: 8, font: fontBold, color: MUTED });
  y -= 24;

  const items = data.items.length ? data.items : [{ description: 'General Cargo', qty: 1, price: data.subtotal }];
  items.forEach((it, i) => {
    const descLines = wrap(it.description, fontBold, 9, CONTENT_W * 0.52);
    const rowH = Math.max(20, descLines.length * 12 + 8);
    ensure(rowH);
    if (i % 2 === 1) page.drawRectangle({ x: MARGIN, y: y - rowH + 14, width: CONTENT_W, height: rowH, color: rgb(0.99, 0.99, 1) });
    descLines.forEach((ln, li) => {
      page.drawText(ln, { x: MARGIN + 10, y: y + 1 - li * 12, size: 9, font: fontBold, color: INK });
    });
    const lineTotal = (it.qty || 0) * (it.price || 0);
    page.drawText(String(it.qty ?? 1), { x: colQty, y: y + 1, size: 9, font, color: INK });
    page.drawText(money(it.price), { x: colUnit, y: y + 1, size: 9, font, color: INK });
    const tStr = money(lineTotal);
    page.drawText(tStr, { x: colTot - 10 - fontBold.widthOfTextAtSize(tStr, 9), y: y + 1, size: 9, font: fontBold, color: INK });
    y -= rowH;
    page.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: colTot, y: y + 12 }, thickness: 0.5, color: LINE });
  });

  // Totals block (right aligned)
  y -= 6;
  const boxX = MARGIN + CONTENT_W - 240;
  const rowLbl = (label: string, value: string, color = INK, bold = false) => {
    ensure(18);
    page.drawText(label, { x: boxX, y: y - 10, size: 9, font, color: MUTED });
    const vf = bold ? fontBold : font;
    page.drawText(value, { x: colTot - fontBold.widthOfTextAtSize(value, 9), y: y - 10, size: 9, font: vf, color });
    y -= 18;
  };
  rowLbl('Subtotal', money(data.subtotal));
  if (data.commissionAmount > 0) rowLbl(`Commission (${data.commissionRate}%)`, money(data.commissionAmount), BRAND);
  ensure(26);
  page.drawRectangle({ x: boxX, y: y - 22, width: colTot - boxX, height: 24, color: BRAND });
  page.drawText('ESTIMATED TOTAL', { x: boxX + 10, y: y - 15, size: 8, font: fontBold, color: WHITE });
  const totStr = money(data.total);
  page.drawText(totStr, { x: colTot - 10 - fontBold.widthOfTextAtSize(totStr, 12), y: y - 16, size: 12, font: fontBold, color: WHITE });
  y -= 34;

  // Payment summary — what the customer has paid and still owes.
  const paid = data.amountPaid ?? 0;
  const bal = data.balanceDue != null ? data.balanceDue : Math.max(0, data.total - paid);
  if (data.paymentStatus || paid > 0) {
    rowLbl('Amount Paid', money(paid), GREEN);
    // Receipt detail (e.g. "Receipt INV-32133196 · EDAHAB · 13 Jul 2026") under the paid row.
    const receiptBits = [
      data.receiptNo ? `Receipt ${safe(data.receiptNo)}` : '',
      data.paymentMethod ? safe(data.paymentMethod).toUpperCase() : '',
      data.paymentDate ? formatDate(data.paymentDate) : '',
    ].filter(Boolean).join('  ·  ');
    if (paid > 0 && receiptBits) {
      ensure(12);
      page.drawText(receiptBits, { x: colTot - font.widthOfTextAtSize(receiptBits, 7.5), y: y - 6, size: 7.5, font, color: MUTED });
      y -= 13;
    }
    const balLabel = data.paymentStatus === 'PAID' || bal <= 0.01 ? 'Paid in Full' : 'Balance Due';
    rowLbl(balLabel, money(Math.max(0, bal)), bal > 0.01 ? RED : GREEN, true);
    y -= 6;
  }

  paragraph('This is an estimate only. The final price may vary based on actual weight, dimensions, customs duties and related charges.', fontItalic, 8, MUTED, MARGIN, CONTENT_W, 2);
  y -= 10;

  // ── TERMS ── (custom/edited terms when present, otherwise the standard set)
  sectionHeader('TERMS AND CONDITIONS');
  const termsList: ContractTermSection[] = data.terms && data.terms.length ? data.terms : defaultContractTerms(data);
  for (const sec of termsList) {
    ensure(26);
    page.drawText(safe(sec.heading), { x: MARGIN, y: y - 11, size: 10, font: fontBold, color: BRAND });
    y -= 20;
    for (const rawLine of (sec.body || '').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) { y -= 4; continue; }
      if (line.startsWith('- ')) bullet(line.slice(2), 9);
      else { paragraph(line, font, 9, INK, MARGIN, CONTENT_W, 3); y -= 3; }
    }
    y -= 6;
  }

  // ── SIGNATURES ── (keep together on a fresh page if not enough room)
  if (y - 200 < FOOTER_TOP + 12) newPage();
  sectionHeader('SIGNATURES');
  paragraph('Signed by the parties in acceptance of this Agreement and its Terms and Conditions.', font, 9, INK);
  y -= 12;
  const sigColW = (CONTENT_W - 30) / 2;
  const sigLeft = MARGIN;
  const sigRight = MARGIN + sigColW + 30;
  page.drawText('FOR AND ON BEHALF OF', { x: sigLeft, y: y - 8, size: 7, font: fontBold, color: MUTED });
  page.drawText('THE CUSTOMER', { x: sigRight, y: y - 8, size: 7, font: fontBold, color: MUTED });
  y -= 20;
  page.drawText(BRAND_NAME, { x: sigLeft, y: y - 8, size: 10, font: fontBold, color: INK });
  page.drawText(safe(data.customerName) || '—', { x: sigRight, y: y - 8, size: 10, font: fontBold, color: INK });
  y -= 40;
  const sigTop = y;
  // Company signs with Name/Title/Date; the customer with Name/Signature/Date (as in the signed sample).
  const sigRows: [string, string][] = [['Name:', 'Name:'], ['Title:', 'Signature:'], ['Date:', 'Date:']];
  for (const [labelL, labelR] of sigRows) {
    page.drawText(labelL, { x: sigLeft, y: y - 8, size: 9, font, color: INK });
    page.drawLine({ start: { x: sigLeft + 55, y: y - 8 }, end: { x: sigLeft + sigColW, y: y - 8 }, thickness: 0.6, color: LINE });
    page.drawText(labelR, { x: sigRight, y: y - 8, size: 9, font, color: INK });
    page.drawLine({ start: { x: sigRight + 55, y: y - 8 }, end: { x: sigRight + sigColW, y: y - 8 }, thickness: 0.6, color: LINE });
    y -= 26;
  }

  // Company stamp — centered over the Company (left) signature lines, like a real stamped agreement.
  if (stampImg) {
    const sd = stampImg.scaleToFit(96, 96);
    page.drawImage(stampImg, {
      x: sigLeft + 55 + (sigColW - 55 - sd.width) / 2,
      y: sigTop - 70,
      width: sd.width,
      height: sd.height,
    });
    page.drawText('Authorised Signatory & Company Stamp', { x: sigLeft, y: y - 4, size: 6.5, font: fontItalic, color: MUTED });
  }

  y -= 12;
  page.drawText('Place of signing:', { x: sigLeft, y: y - 8, size: 9, font, color: INK });
  page.drawLine({ start: { x: sigLeft + 85, y: y - 8 }, end: { x: MARGIN + CONTENT_W, y: y - 8 }, thickness: 0.6, color: LINE });

  return doc.save();
}
