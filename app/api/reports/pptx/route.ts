import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import Invoice from '@/lib/models/Invoice';
import Customer from '@/lib/models/Customer';
import { Batch } from '@/lib/models/Batch';
import Quotation from '@/lib/models/Quotation';
import Sourcing from '@/lib/models/Sourcing';
import PricingRequest from '@/lib/models/PricingRequest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PptxGenJS = require('pptxgenjs');

// Q Cargo brand colors
const C = {
  teal:       '0d9488',
  orange:     'F15D38',
  dark:       '0B0F19',
  darkCard:   '131B2E',
  slate:      '1E293B',
  slateLight: '334155',
  white:      'FFFFFF',
  offWhite:   'F8FAFC',
  muted:      '94A3B8',
  green:      '10B981',
  red:        'EF4444',
  amber:      'F59E0B',
};

function dateFilter(from?: string, to?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f: Record<string, any> = {};
  if (from || to) {
    f.createdAt = {};
    if (from) f.createdAt.$gte = new Date(from);
    if (to)   f.createdAt.$lte = new Date(to + 'T23:59:59');
  }
  return f;
}

function fmtUSD(n: number) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function periodLabel(from?: string, to?: string) {
  if (from && to) return `${from} — ${to}`;
  if (from) return `From ${from}`;
  if (to)   return `Up to ${to}`;
  return 'All Time';
}

// ── Slide helpers ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDarkSlide(prs: any) {
  const slide = prs.addSlide();
  slide.background = { color: C.dark };
  return slide;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addLightSlide(prs: any) {
  const slide = prs.addSlide();
  slide.background = { color: C.offWhite };
  return slide;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSlideTitle(slide: any, prs: any, title: string, subtitle?: string) {
  // teal left edge marker
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: 0.08, h: '100%', fill: { color: C.teal },
  });
  slide.addText(title, {
    x: 0.5, y: 0.28, w: '90%', h: 0.6,
    fontSize: 26, bold: true, color: C.dark, fontFace: 'Calibri',
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.82, w: '90%', h: 0.3,
      fontSize: 11, color: C.muted, fontFace: 'Calibri', bold: true,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addKpiCard(prs: any, slide: any, x: number, y: number, w: number, h: number,
  label: string, value: string, sub?: string, accent = C.teal) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: C.darkCard },
    line: { color: accent, width: 1.5 },
  });
  slide.addText(value, {
    x: x + 0.1, y: y + 0.1, w: w - 0.2, h: h * 0.45,
    fontSize: 26, bold: true, color: accent, fontFace: 'Calibri', align: 'center',
  });
  slide.addText(label, {
    x: x + 0.1, y: y + h * 0.52, w: w - 0.2, h: h * 0.28,
    fontSize: 9, bold: true, color: C.white, fontFace: 'Calibri', align: 'center',
  });
  if (sub) {
    slide.addText(sub, {
      x: x + 0.1, y: y + h * 0.78, w: w - 0.2, h: h * 0.2,
      fontSize: 8, color: C.muted, fontFace: 'Calibri', align: 'center',
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFooter(slide: any, dark = false) {
  slide.addText('Q CARGO LOGISTICS  ·  CONFIDENTIAL', {
    x: 0, y: 7.2, w: '100%', h: 0.25,
    fontSize: 7, bold: true, color: dark ? C.muted : C.slateLight,
    fontFace: 'Calibri', align: 'center',
  });
}

// ── COVER SLIDE ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCover(prs: any, reportTitle: string, period: string) {
  const slide = addDarkSlide(prs);

  slide.addShape(prs.ShapeType.rect, { x: 7.5, y: 0, w: 2.5, h: 7.5, fill: { color: C.orange } });
  slide.addShape(prs.ShapeType.rect, { x: 6.8, y: 0, w: 0.75, h: 7.5, fill: { color: C.teal } });

  slide.addText('Q CARGO', { x: 0.6, y: 1.2, w: 5.5, h: 0.9, fontSize: 52, bold: true, color: C.white, fontFace: 'Calibri' });
  slide.addText('LOGISTICS', { x: 0.6, y: 2.0, w: 5.5, h: 0.5, fontSize: 22, bold: true, color: C.teal, fontFace: 'Calibri' });
  slide.addShape(prs.ShapeType.rect, { x: 0.6, y: 2.7, w: 3.5, h: 0.05, fill: { color: C.orange } });
  slide.addText(reportTitle, { x: 0.6, y: 2.9, w: 5.8, h: 0.9, fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri' });
  slide.addText(period, { x: 0.6, y: 3.8, w: 5.5, h: 0.4, fontSize: 14, color: C.muted, fontFace: 'Calibri' });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  slide.addText(`Generated: ${today}`, { x: 0.6, y: 6.6, w: 5, h: 0.3, fontSize: 9, color: C.muted, fontFace: 'Calibri' });
  addFooter(slide, true);
}

// ── SECTION DIVIDER ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSectionDivider(prs: any, sectionName: string, emoji: string) {
  const slide = addDarkSlide(prs);
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.3, h: '100%', fill: { color: C.teal } });
  slide.addText(emoji,       { x: 0.8, y: 2.3, w: 1.2, h: 1.0, fontSize: 48, align: 'center' });
  slide.addText(sectionName, { x: 0.5, y: 3.4, w: 9, h: 1.0, fontSize: 40, bold: true, color: C.white, fontFace: 'Calibri' });
  addFooter(slide, true);
}

// ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildExecutiveSummary(prs: any, filter: Record<string, unknown>, period: string) {
  const [shipments, invoices, customers, batches] = await Promise.all([
    Shipment.find(filter).lean(),
    Invoice.find(filter).lean(),
    Customer.find(filter).lean(),
    Batch.find(filter).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iArr = invoices  as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sArr = shipments as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bArr = batches   as any[];

  const totalRevenue   = iArr.reduce((s: number, i: { totalAmount?: number }) => s + (i.totalAmount || 0), 0);
  const totalCollected = iArr.reduce((s: number, i: { amountPaid?: number })  => s + (i.amountPaid  || 0), 0);
  const outstanding    = totalRevenue - totalCollected;
  const airCount       = sArr.filter((s: { type?: string }) => s.type === 'AIR').length;
  const seaCount       = sArr.filter((s: { type?: string }) => s.type === 'SEA').length;
  const arrivedBatches = bArr.filter((b: { status?: string }) => b.status === 'ARRIVED').length;

  buildSectionDivider(prs, 'Executive Summary', '📊');

  const slide = addLightSlide(prs);
  addSlideTitle(slide, prs, 'Executive Summary', period);
  addFooter(slide);

  const kW = 2.8, kH = 1.3, gap = 0.14, sx = 0.5;
  addKpiCard(prs, slide, sx,               1.2, kW, kH, 'TOTAL REVENUE',       fmtUSD(totalRevenue),   'Invoiced',   C.teal);
  addKpiCard(prs, slide, sx + kW + gap,    1.2, kW, kH, 'AMOUNT COLLECTED',    fmtUSD(totalCollected), 'Cash in',    C.green);
  addKpiCard(prs, slide, sx + (kW+gap)*2,  1.2, kW, kH, 'OUTSTANDING BALANCE', fmtUSD(outstanding),   'Still owed', C.orange);

  addKpiCard(prs, slide, sx,               2.7, kW, kH, 'TOTAL SHIPMENTS',  String(sArr.length),    `AIR ${airCount} · SEA ${seaCount}`, C.teal);
  addKpiCard(prs, slide, sx + kW + gap,    2.7, kW, kH, 'ACTIVE CUSTOMERS', String(customers.length),'Registered',                       C.orange);
  addKpiCard(prs, slide, sx + (kW+gap)*2,  2.7, kW, kH, 'BATCHES ARRIVED',  String(arrivedBatches), `of ${bArr.length} total`,           C.green);
}

// ── OPERATIONS REPORT ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildOperations(prs: any, filter: Record<string, unknown>, period: string) {
  const [shipments, batches] = await Promise.all([
    Shipment.find(filter).lean(),
    Batch.find(filter).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sArr = shipments as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bArr = batches   as any[];

  const pending   = sArr.filter((s: { status?: string }) => s.status === 'PENDING').length;
  const inTransit = sArr.filter((s: { status?: string }) => s.status === 'IN_TRANSIT').length;
  const arrived   = sArr.filter((s: { status?: string }) => s.status === 'ARRIVED').length;
  const airShips  = sArr.filter((s: { type?: string }) => s.type === 'AIR').length;
  const seaShips  = sArr.filter((s: { type?: string }) => s.type === 'SEA').length;
  const totalWeight = sArr.reduce((s: number, sh: { weight?: number }) => s + (sh.weight || 0), 0);

  buildSectionDivider(prs, 'Operations Report', '🚢');

  // Slide 1: Shipment status
  const slide1 = addLightSlide(prs);
  addSlideTitle(slide1, prs, 'Shipment Overview', period);
  addFooter(slide1);

  const kW = 2.0, kH = 1.2, gap = 0.2, sx = 0.6;
  addKpiCard(prs, slide1, sx,              1.2, kW, kH, 'PENDING',    String(pending),    'Awaiting',   C.amber);
  addKpiCard(prs, slide1, sx + kW + gap,   1.2, kW, kH, 'IN TRANSIT', String(inTransit),  'En route',   C.teal);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,   1.2, kW, kH, 'ARRIVED',    String(arrived),    'Delivered',  C.green);
  addKpiCard(prs, slide1, sx+(kW+gap)*3,   1.2, kW, kH, 'TOTAL',      String(sArr.length),'All',        C.orange);

  if (sArr.length > 0) {
    slide1.addChart(prs.ChartType.pie, [
      { name: 'Freight Type', labels: ['AIR', 'SEA'], values: [airShips || 0, seaShips || 0] },
    ], {
      x: 0.4, y: 2.7, w: 4.8, h: 3.8,
      chartColors: [C.teal, C.orange],
      showLegend: true, legendPos: 'b',
      showLabel: true, showPercent: true,
      dataLabelFontSize: 12, dataLabelFontBold: true,
      title: 'AIR vs SEA Freight Mix',
      titleFontSize: 12, titleBold: true, titleColor: C.dark,
    });
  }

  slide1.addText(`Total Cargo Weight:`, { x: 5.5, y: 3.0, w: 4, h: 0.35, fontSize: 11, bold: true, color: C.dark, fontFace: 'Calibri' });
  slide1.addText(`${totalWeight.toLocaleString()} KG`, { x: 5.5, y: 3.35, w: 4, h: 0.45, fontSize: 22, bold: true, color: C.teal, fontFace: 'Calibri' });

  slide1.addText('Active Batches:', { x: 5.5, y: 4.1, w: 4, h: 0.35, fontSize: 11, bold: true, color: C.dark, fontFace: 'Calibri' });
  slide1.addText(String(bArr.filter((b: { status?: string }) => b.status !== 'ARRIVED').length), { x: 5.5, y: 4.45, w: 4, h: 0.45, fontSize: 22, bold: true, color: C.orange, fontFace: 'Calibri' });

  slide1.addText('Completed Batches:', { x: 5.5, y: 5.2, w: 4, h: 0.35, fontSize: 11, bold: true, color: C.dark, fontFace: 'Calibri' });
  slide1.addText(String(bArr.filter((b: { status?: string }) => b.status === 'ARRIVED').length), { x: 5.5, y: 5.55, w: 4, h: 0.45, fontSize: 22, bold: true, color: C.green, fontFace: 'Calibri' });

  // Slide 2: Batch table
  if (bArr.length > 0) {
    const slide2 = addLightSlide(prs);
    addSlideTitle(slide2, prs, 'Batch Status Overview', period);
    addFooter(slide2);

    const rows = [
      ['Batch ID', 'Type', 'Route', 'Status', 'Arrival'],
      ...bArr.slice(0, 14).map((b: { batchId?: string; type?: string; origin?: string; destination?: string; status?: string; arrival?: string }) => [
        b.batchId || '—',
        b.type    || '—',
        `${b.origin || '?'} → ${b.destination || '?'}`,
        b.status  || '—',
        b.arrival ? String(b.arrival).slice(0, 10) : '—',
      ]),
    ];

    slide2.addTable(rows, {
      x: 0.4, y: 1.2, w: 9.2, colW: [1.8, 0.9, 3.0, 1.8, 1.7],
      fontSize: 9, fontFace: 'Calibri',
      border: { pt: 0.5, color: C.slateLight },
      rowH: 0.36,
    });
  }
}

// ── SALES & REVENUE ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildSalesRevenue(prs: any, filter: Record<string, unknown>, period: string) {
  const [invoices, shipments] = await Promise.all([
    Invoice.find(filter).lean(),
    Shipment.find(filter).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iArr = invoices  as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sArr = shipments as any[];

  const totalRevenue = iArr.reduce((s: number, i: { totalAmount?: number }) => s + (i.totalAmount || 0), 0);
  const totalPaid    = iArr.reduce((s: number, i: { amountPaid?:  number }) => s + (i.amountPaid  || 0), 0);
  const outstanding  = totalRevenue - totalPaid;
  const paidCount    = iArr.filter((i: { paymentStatus?: string }) => i.paymentStatus === 'PAID').length;
  const partialCount = iArr.filter((i: { paymentStatus?: string }) => i.paymentStatus === 'PARTIAL').length;
  const unpaidCount  = iArr.filter((i: { paymentStatus?: string }) => i.paymentStatus === 'UNPAID').length;
  const airRevenue   = iArr.filter((i: { freightType?: string }) => i.freightType === 'AIR').reduce((s: number, i: { totalAmount?: number }) => s + (i.totalAmount || 0), 0);
  const seaRevenue   = iArr.filter((i: { freightType?: string }) => i.freightType === 'SEA').reduce((s: number, i: { totalAmount?: number }) => s + (i.totalAmount || 0), 0);

  const methodMap: Record<string, number> = {};
  for (const inv of iArr) {
    const m = (inv.paymentMethod as string) || 'OTHER';
    methodMap[m] = (methodMap[m] || 0) + (inv.amountPaid || 0);
  }

  buildSectionDivider(prs, 'Sales & Revenue', '💰');

  // Slide 1: KPIs
  const slide1 = addLightSlide(prs);
  addSlideTitle(slide1, prs, 'Revenue Overview', period);
  addFooter(slide1);

  const kW = 2.8, kH = 1.3, gap = 0.14, sx = 0.5;
  addKpiCard(prs, slide1, sx,              1.2, kW, kH, 'TOTAL INVOICED',   fmtUSD(totalRevenue), 'Gross revenue', C.teal);
  addKpiCard(prs, slide1, sx + kW + gap,   1.2, kW, kH, 'COLLECTED',        fmtUSD(totalPaid),    'Cash in',       C.green);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,   1.2, kW, kH, 'OUTSTANDING',      fmtUSD(outstanding),  'Balance owed',  C.orange);

  addKpiCard(prs, slide1, sx,              2.7, kW, kH, 'PAID INVOICES',    String(paidCount),    'Fully settled', C.green);
  addKpiCard(prs, slide1, sx + kW + gap,   2.7, kW, kH, 'PARTIAL',          String(partialCount), 'Part paid',     C.amber);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,   2.7, kW, kH, 'UNPAID',           String(unpaidCount),  'Needs follow',  C.red);

  if (airRevenue + seaRevenue > 0) {
    slide1.addChart(prs.ChartType.bar, [
      { name: 'Revenue (USD)', labels: ['AIR Freight', 'SEA Freight'], values: [airRevenue, seaRevenue] },
    ], {
      x: 0.4, y: 4.2, w: 9.2, h: 2.8,
      chartColors: [C.teal, C.orange],
      showValue: true, dataLabelFontSize: 10, dataLabelFontBold: true,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
      title: 'Revenue by Freight Type (USD)',
      titleFontSize: 12, titleBold: true, titleColor: C.dark,
      barDir: 'col',
    });
  }

  // Slide 2: Payment methods
  const methods = Object.entries(methodMap).sort((a, b) => b[1] - a[1]);
  if (methods.length > 0) {
    const slide2 = addLightSlide(prs);
    addSlideTitle(slide2, prs, 'Payment Method Breakdown', period);
    addFooter(slide2);

    slide2.addChart(prs.ChartType.bar, [
      { name: 'Collected (USD)', labels: methods.map(m => m[0]), values: methods.map(m => m[1]) },
    ], {
      x: 0.4, y: 1.2, w: 9.2, h: 5.8,
      chartColors: [C.teal, C.orange, C.green, C.amber, C.red, C.slateLight],
      showValue: true, dataLabelFontSize: 10,
      title: 'Collections by Payment Method (USD)',
      titleFontSize: 12, titleBold: true, titleColor: C.dark,
      barDir: 'col',
    });
  }

  // Slide 3: Collection rate
  const rate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;
  const slide3 = addLightSlide(prs);
  addSlideTitle(slide3, prs, 'Invoice Payment Status', period);
  addFooter(slide3);

  if (iArr.length > 0) {
    slide3.addChart(prs.ChartType.pie, [
      { name: 'Status', labels: ['Paid', 'Partial', 'Unpaid'], values: [paidCount || 0, partialCount || 0, unpaidCount || 0] },
    ], {
      x: 0.4, y: 1.2, w: 5, h: 5.5,
      chartColors: [C.green, C.amber, C.red],
      showLegend: true, legendPos: 'b',
      showLabel: true, showPercent: true,
      dataLabelFontSize: 12, dataLabelFontBold: true,
      title: 'Invoice Status Distribution',
      titleFontSize: 12, titleBold: true, titleColor: C.dark,
    });
  }

  const rateColor = rate >= 80 ? C.green : rate >= 50 ? C.amber : C.red;
  slide3.addText('Collection Rate', { x: 5.6, y: 2.2, w: 3.8, h: 0.4, fontSize: 13, bold: true, color: C.dark, fontFace: 'Calibri', align: 'center' });
  slide3.addText(`${rate}%`, { x: 5.6, y: 2.6, w: 3.8, h: 1.1, fontSize: 56, bold: true, color: rateColor, fontFace: 'Calibri', align: 'center' });
  slide3.addText(rate >= 80 ? 'Excellent' : rate >= 50 ? 'Needs Attention' : 'Critical', { x: 5.6, y: 3.7, w: 3.8, h: 0.4, fontSize: 13, bold: true, color: rateColor, fontFace: 'Calibri', align: 'center' });

  slide3.addText('Shipment Revenue Total:', { x: 5.6, y: 5.0, w: 3.8, h: 0.35, fontSize: 11, bold: true, color: C.dark, fontFace: 'Calibri', align: 'center' });
  slide3.addText(fmtUSD(sArr.reduce((s: number, sh: { total?: number }) => s + (sh.total || 0), 0)), { x: 5.6, y: 5.35, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: C.teal, fontFace: 'Calibri', align: 'center' });
}

// ── CUSTOMER REPORT ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildCustomers(prs: any, filter: Record<string, unknown>, period: string) {
  const [customers, shipments, invoices] = await Promise.all([
    Customer.find(filter).lean(),
    Shipment.find(filter).lean(),
    Invoice.find(filter).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cArr = customers as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iArr = invoices  as any[];

  const activeCustomers = cArr.filter((c: { status?: string }) => c.status === 'ACTIVE').length;
  const totalSpent      = cArr.reduce((s: number, c: { totalSpent?: number }) => s + (c.totalSpent || 0), 0);
  const avgSpend        = cArr.length > 0 ? totalSpent / cArr.length : 0;

  const custRevMap: Record<string, { invoiced: number; paid: number }> = {};
  for (const inv of iArr) {
    const n = (inv.customerName as string) || 'Unknown';
    if (!custRevMap[n]) custRevMap[n] = { invoiced: 0, paid: 0 };
    custRevMap[n].invoiced += inv.totalAmount || 0;
    custRevMap[n].paid     += inv.amountPaid  || 0;
  }
  const top10 = Object.entries(custRevMap).sort((a, b) => b[1].invoiced - a[1].invoiced).slice(0, 10);

  buildSectionDivider(prs, 'Customer Report', '👥');

  // Slide 1: KPIs
  const slide1 = addLightSlide(prs);
  addSlideTitle(slide1, prs, 'Customer Overview', period);
  addFooter(slide1);

  const kW = 2.8, kH = 1.3, gap = 0.14, sx = 0.5;
  addKpiCard(prs, slide1, sx,             1.2, kW, kH, 'TOTAL CUSTOMERS', String(cArr.length),    'Registered', C.teal);
  addKpiCard(prs, slide1, sx + kW + gap,  1.2, kW, kH, 'ACTIVE',          String(activeCustomers),'Active',     C.green);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,  1.2, kW, kH, 'TOTAL SPENT',     fmtUSD(totalSpent),     'All time',   C.orange);

  addKpiCard(prs, slide1, sx,             2.7, kW, kH, 'AVG. SPEND',      fmtUSD(avgSpend),       'Per customer', C.teal);
  addKpiCard(prs, slide1, sx + kW + gap,  2.7, kW, kH, 'TOTAL SHIPMENTS', String(shipments.length),'All',         C.orange);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,  2.7, kW, kH, 'INVOICED TOTAL',  fmtUSD(iArr.reduce((s: number, i: { totalAmount?: number }) => s + (i.totalAmount || 0), 0)), 'Billed', C.green);

  // Slide 2: Top customers chart
  if (top10.length > 0) {
    const slide2 = addLightSlide(prs);
    addSlideTitle(slide2, prs, 'Top Customers by Revenue', period);
    addFooter(slide2);

    slide2.addChart(prs.ChartType.bar, [
      { name: 'Invoiced (USD)',  labels: top10.map(([n]) => n.length > 16 ? n.slice(0, 14) + '…' : n), values: top10.map(([, v]) => v.invoiced) },
      { name: 'Collected (USD)', labels: top10.map(([n]) => n.length > 16 ? n.slice(0, 14) + '…' : n), values: top10.map(([, v]) => v.paid) },
    ], {
      x: 0.3, y: 1.2, w: 9.4, h: 5.8,
      chartColors: [C.teal, C.green],
      showValue: true, dataLabelFontSize: 8,
      catAxisLabelFontSize: 8, valAxisLabelFontSize: 8,
      title: 'Top 10 Customers — Invoiced vs Collected (USD)',
      titleFontSize: 12, titleBold: true, titleColor: C.dark,
      barDir: 'col', barGrouping: 'clustered',
    });
  }

  // Slide 3: Customer table
  if (cArr.length > 0) {
    const slide3 = addLightSlide(prs);
    addSlideTitle(slide3, prs, 'Customer List', period);
    addFooter(slide3);

    const rows = [
      ['Customer', 'City', 'Shipments', 'Total Spent', 'Status'],
      ...cArr.slice(0, 14).map((c: { name?: string; city?: string; totalShipments?: number; totalSpent?: number; status?: string }) => [
        c.name || '—',
        c.city || 'Hargeisa',
        String(c.totalShipments || 0),
        fmtUSD(c.totalSpent || 0),
        c.status || 'ACTIVE',
      ]),
    ];

    slide3.addTable(rows, {
      x: 0.4, y: 1.2, w: 9.2, colW: [3.0, 1.5, 1.5, 1.9, 1.3],
      fontSize: 9, fontFace: 'Calibri',
      border: { pt: 0.5, color: C.slateLight },
      rowH: 0.36,
    });
  }
}

// ── SOURCING REPORT ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildSourcing(prs: any, filter: Record<string, unknown>, period: string) {
  const [quotations, sourcingOrders, pricingRequests] = await Promise.all([
    Quotation.find(filter).lean(),
    Sourcing.find(filter).lean(),
    PricingRequest.find(filter).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qArr = quotations      as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sArr = sourcingOrders  as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pArr = pricingRequests as any[];

  const sentQuotes     = qArr.filter((q: { status?: string }) => q.status === 'SENT').length;
  const approvedQuotes = qArr.filter((q: { status?: string }) => q.status === 'APPROVED').length;
  const conversionRate = sentQuotes > 0 ? Math.round((approvedQuotes / sentQuotes) * 100) : 0;
  const totalCommission = qArr.reduce((s: number, q: { commissionAmount?: number }) => s + (q.commissionAmount || 0), 0);
  const sourcingTotal  = sArr.reduce((s: number, o: { totalUSD?: number }) => s + (o.totalUSD || 0), 0);
  const sourcingPaid   = sArr.reduce((s: number, o: { paidUSD?:  number }) => s + (o.paidUSD  || 0), 0);
  const openRequests   = pArr.filter((p: { status?: string }) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length;

  buildSectionDivider(prs, 'Sourcing Report', '🔍');

  const slide1 = addLightSlide(prs);
  addSlideTitle(slide1, prs, 'Sourcing & Quotations', period);
  addFooter(slide1);

  const kW = 2.05, kH = 1.2, gap = 0.14, sx = 0.5;
  addKpiCard(prs, slide1, sx,              1.2, kW, kH, 'QUOTES SENT',      String(sentQuotes),     'To customers', C.teal);
  addKpiCard(prs, slide1, sx + kW + gap,   1.2, kW, kH, 'APPROVED',          String(approvedQuotes), 'Closed deals', C.green);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,   1.2, kW, kH, 'CONVERSION RATE',   `${conversionRate}%`,   'Quote→Deal',   C.orange);
  addKpiCard(prs, slide1, sx+(kW+gap)*3,   1.2, kW, kH, 'COMMISSION EARNED', fmtUSD(totalCommission),'Total',        C.teal);

  addKpiCard(prs, slide1, sx,              2.6, kW, kH, 'SOURCING ORDERS', String(sArr.length),  'Total orders', C.orange);
  addKpiCard(prs, slide1, sx + kW + gap,   2.6, kW, kH, 'ORDER VALUE',     fmtUSD(sourcingTotal),'USD',          C.teal);
  addKpiCard(prs, slide1, sx+(kW+gap)*2,   2.6, kW, kH, 'AMOUNT PAID',     fmtUSD(sourcingPaid), 'Collected',    C.green);
  addKpiCard(prs, slide1, sx+(kW+gap)*3,   2.6, kW, kH, 'OPEN REQUESTS',   String(openRequests), 'Awaiting',     C.amber);

  if (qArr.length > 0) {
    const statuses = ['SENT', 'APPROVED', 'DRAFT', 'REJECTED'];
    const counts   = statuses.map(st => qArr.filter((q: { status?: string }) => q.status === st).length);

    slide1.addChart(prs.ChartType.pie, [
      { name: 'Quote Status', labels: statuses, values: counts },
    ], {
      x: 0.4, y: 4.0, w: 4.5, h: 3.2,
      chartColors: [C.teal, C.green, C.muted, C.red],
      showLegend: true, legendPos: 'b',
      showLabel: true, showPercent: true,
      dataLabelFontSize: 11, dataLabelFontBold: true,
      title: 'Quotation Status Breakdown',
      titleFontSize: 11, titleBold: true, titleColor: C.dark,
    });
  }
}

// ── CLOSING SLIDE ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildClosing(prs: any) {
  const slide = addDarkSlide(prs);
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.3, h: '100%', fill: { color: C.orange } });
  slide.addText('Thank You', { x: 1, y: 1.8, w: 8, h: 1.0, fontSize: 52, bold: true, color: C.white, fontFace: 'Calibri' });
  slide.addText('Q Cargo Logistics — Connecting Somalia to the World', { x: 1, y: 3.0, w: 8, h: 0.5, fontSize: 16, color: C.teal, fontFace: 'Calibri' });
  slide.addText('qcargologistic@gmail.com  ·  Hargeisa, Somaliland', { x: 1, y: 3.6, w: 8, h: 0.35, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
  addFooter(slide, true);
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'full';
    const from = searchParams.get('from') || '';
    const to   = searchParams.get('to')   || '';

    const filter = dateFilter(from || undefined, to || undefined);
    const period = periodLabel(from || undefined, to || undefined);

    const titleMap: Record<string, string> = {
      executive:  'Executive Summary Report',
      operations: 'Operations Report',
      sales:      'Sales & Revenue Report',
      customers:  'Customer Report',
      sourcing:   'Sourcing & Quotations Report',
      full:       'Full Company Report',
    };

    const prs = new PptxGenJS();
    prs.layout  = 'LAYOUT_WIDE';
    prs.author  = 'Q Cargo ERP';
    prs.company = 'Q Cargo Logistics';
    prs.subject = titleMap[type] || 'Q Cargo Report';
    prs.title   = prs.subject;

    buildCover(prs, titleMap[type] || 'Company Report', period);

    if (type === 'executive' || type === 'full') await buildExecutiveSummary(prs, filter, period);
    if (type === 'operations'|| type === 'full') await buildOperations(prs, filter, period);
    if (type === 'sales'     || type === 'full') await buildSalesRevenue(prs, filter, period);
    if (type === 'customers' || type === 'full') await buildCustomers(prs, filter, period);
    if (type === 'sourcing'  || type === 'full') await buildSourcing(prs, filter, period);

    buildClosing(prs);

    const buffer: Buffer = await prs.write({ outputType: 'nodebuffer' });

    const slug     = type.charAt(0).toUpperCase() + type.slice(1);
    const dateStr  = new Date().toISOString().slice(0, 10);
    const filename = `QCargo-${slug}-Report-${dateStr}.pptx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[/api/reports/pptx]', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
