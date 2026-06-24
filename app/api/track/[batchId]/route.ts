import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Batch } from '@/lib/models/Batch';
import Shipment from '@/lib/models/Shipment';

export const dynamic = 'force-dynamic';

// Build the visible product lines for one shipment (same rule as the batch sheet:
// courier packages first, otherwise items). Returns a stable line identifier.
function buildLines(s: any) {
  if (Array.isArray(s.courierPackages) && s.courierPackages.length > 0) {
    return s.courierPackages.map((p: any, index: number) => ({
      lineType: 'courier' as const,
      index,
      product: p.goods || p.courier || '-',
      qty: p.qty || 1,
      tracking: p.trackingNumber || '',
      received: !!p.received,
    }));
  }
  if (Array.isArray(s.items) && s.items.length > 0) {
    return s.items.map((it: any, index: number) => ({
      lineType: 'item' as const,
      index,
      product: it.description || '-',
      qty: it.qty || 1,
      tracking: '',
      received: !!it.received,
    }));
  }
  return [{ lineType: 'none' as const, index: 0, product: '-', qty: 1, tracking: '', received: false }];
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

// PATCH: public, toggle a single product line's received flag
export async function PATCH(req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    await connectDB();
    const batch = await findBatch(batchId);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const body = await req.json();
    const { shipmentId, lineType, index, received } = body as {
      shipmentId?: string; lineType?: 'item' | 'courier'; index?: number; received?: boolean;
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

    arr[index].received = !!received;
    arr[index].receivedAt = received ? new Date() : undefined;
    shipment.markModified(lineType === 'courier' ? 'courierPackages' : 'items');
    await shipment.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update', details: err.message }, { status: 500 });
  }
}
