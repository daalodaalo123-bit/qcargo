import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Batch } from '@/lib/models/Batch';
import Shipment from '@/lib/models/Shipment';

export const dynamic = 'force-dynamic';

// Build the visible product lines for one shipment — ONE line per product.
//
// A product line is stored in items[] (the master list: qty/KG/CBM/value). If it
// also has a tracking number, a parallel entry lives in courierPackages[] with
// goods === description. So we walk items[], pair the matching courier package to
// pull its tracking number onto the same line, and merge in any warehouse data
// (measured KG/CBM, notes, received) that may have been entered on either copy.
// Courier packages with no matching item become their own line (legacy data).
// PATCH targets the item for paired lines, so future edits consolidate there.
function buildLines(s: any) {
  const noteList = (n: any): { text: string; at: string }[] =>
    Array.isArray(n) ? n.map((x: any) => ({ text: x.text || '', at: x.at ? new Date(x.at).toISOString() : '' })) : [];
  const num = (v: any): number | null => (v === 0 || (typeof v === 'number' && !isNaN(v)) ? v : null);
  // Merge two note lists, dropping exact (text+timestamp) duplicates, oldest first.
  const mergeNotes = (a: any, b: any) => {
    const seen = new Set<string>();
    return [...noteList(a), ...noteList(b)]
      .filter((n) => { const k = `${n.text}|${n.at}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
  };

  const items: any[] = Array.isArray(s.items) ? s.items : [];
  const couriers: any[] = Array.isArray(s.courierPackages) ? s.courierPackages : [];
  const usedCourier = new Set<number>();

  const itemLines = items.map((it: any, index: number) => {
    const desc = it.description || '';
    // Pair the first not-yet-used courier package whose goods matches this item.
    let cpIdx = -1;
    for (let i = 0; i < couriers.length; i++) {
      if (usedCourier.has(i)) continue;
      if ((couriers[i].goods || '') === desc) { cpIdx = i; break; }
    }
    const cp = cpIdx >= 0 ? couriers[cpIdx] : null;
    if (cpIdx >= 0) usedCourier.add(cpIdx);

    return {
      lineType: 'item' as const,
      index,
      product: desc || '-',
      qty: it.qty || 1,
      tracking: cp ? cp.trackingNumber || '' : '',
      received: !!it.received || !!(cp && cp.received),
      measuredWeight: num(it.measuredWeight) ?? (cp ? num(cp.measuredWeight) : null),
      measuredCbm: num(it.measuredCbm) ?? (cp ? num(cp.measuredCbm) : null),
      notes: cp ? mergeNotes(it.warehouseNotes, cp.warehouseNotes) : noteList(it.warehouseNotes),
    };
  });

  // Any courier package not paired to an item shows on its own (legacy/edge data).
  const courierLines = couriers
    .map((p: any, index: number) => ({ p, index }))
    .filter(({ index }) => !usedCourier.has(index))
    .map(({ p, index }) => ({
      lineType: 'courier' as const,
      index,
      product: p.goods || p.courier || '-',
      qty: p.qty || 1,
      tracking: p.trackingNumber || '',
      received: !!p.received,
      measuredWeight: num(p.measuredWeight),
      measuredCbm: num(p.measuredCbm),
      notes: noteList(p.warehouseNotes),
    }));

  const lines = [...itemLines, ...courierLines];
  if (lines.length === 0) {
    return [{ lineType: 'none' as const, index: 0, product: '-', qty: 1, tracking: '', received: false, measuredWeight: null, measuredCbm: null, notes: [] }];
  }
  return lines;
}

async function findBatch(batchId: string) {
  return (await Batch.findOne({ batchId })) || (await Batch.findById(batchId).catch(() => null));
}

// GET: public, sanitized batch arrival data (no prices / payment info)
export async function GET(_req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    await connectDB();
    const batch = await findBatch(batchId);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const shipments = await Shipment.find({ batch: batch.batchId });

    let totalLines = 0;
    let receivedCount = 0;
    const customers = shipments.map((s: any) => {
      const lines = buildLines(s);
      lines.forEach((l: any) => { totalLines += 1; if (l.received) receivedCount += 1; });
      const weightLabel = s.type === 'AIR'
        ? `${Number(s.weight) || 0} KG`
        : `${Number(s.cbm) || 0} CBM`;
      return { shipmentId: String(s._id), customer: s.customer, weightLabel, type: s.type, lines };
    });

    return NextResponse.json({
      batchId: batch.batchId,
      type: batch.type,
      origin: batch.origin,
      destination: batch.destination,
      status: batch.status,
      totalLines,
      receivedCount,
      customers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load tracking data', details: err.message }, { status: 500 });
  }
}

// Parse a measured number field: accepts a number, or null/'' to clear it.
function parseMeasure(v: unknown): { ok: boolean; value: number | undefined } {
  if (v === null || v === '' || v === undefined) return { ok: true, value: undefined };
  const n = typeof v === 'number' ? v : Number(v);
  if (isNaN(n) || n < 0) return { ok: false, value: undefined };
  return { ok: true, value: n };
}

// PATCH: public — update a single product line. The warehouse keeper can toggle
// "received", fill in the measured KG/CBM, and append a timestamped note.
export async function PATCH(req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    await connectDB();
    const batch = await findBatch(batchId);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const body = await req.json();
    const { shipmentId, lineType, index, received, measuredWeight, measuredCbm, addNote } = body as {
      shipmentId?: string; lineType?: 'item' | 'courier'; index?: number;
      received?: boolean; measuredWeight?: number | null; measuredCbm?: number | null; addNote?: string;
    };

    if (!shipmentId || (lineType !== 'item' && lineType !== 'courier') || typeof index !== 'number') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment || shipment.batch !== batch.batchId) {
      return NextResponse.json({ error: 'Shipment not found in this batch' }, { status: 404 });
    }

    const arr: any[] = lineType === 'courier' ? shipment.courierPackages : shipment.items;
    if (!arr || !arr[index]) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 });
    }
    const line = arr[index];

    if (typeof received === 'boolean') {
      line.received = received;
      line.receivedAt = received ? new Date() : undefined;
    }

    if ('measuredWeight' in body) {
      const w = parseMeasure(measuredWeight);
      if (!w.ok) return NextResponse.json({ error: 'Invalid weight' }, { status: 400 });
      line.measuredWeight = w.value;
    }

    if ('measuredCbm' in body) {
      const c = parseMeasure(measuredCbm);
      if (!c.ok) return NextResponse.json({ error: 'Invalid CBM' }, { status: 400 });
      line.measuredCbm = c.value;
    }

    if (typeof addNote === 'string') {
      const text = addNote.trim();
      if (!text) return NextResponse.json({ error: 'Note is empty' }, { status: 400 });
      if (!Array.isArray(line.warehouseNotes)) line.warehouseNotes = [];
      line.warehouseNotes.push({ text: text.slice(0, 1000), at: new Date() });
    }

    shipment.markModified(lineType === 'courier' ? 'courierPackages' : 'items');
    await shipment.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update', details: err.message }, { status: 500 });
  }
}
