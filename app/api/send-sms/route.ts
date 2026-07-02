import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import { Batch } from '@/lib/models/Batch';

// Force dynamic rendering so environment variables are read at request time
export const dynamic = 'force-dynamic';

// Updates a batch's tracking status and cascades it to every shipment in the
// batch (so the Inventory page, public track sheet and customer dashboard all
// agree). It does NOT message customers: proactive customer WhatsApp only works
// reliably through an approved template, so that is handled separately by the
// arrival broadcast (/api/batches/notify-arrival) which the caller triggers
// explicitly. This keeps status changes instant and reliable.
export async function POST(request: Request) {
  try {
    await connectDB();
    const { batchId, status } = (await request.json()) as {
      batchId: string; // batchId string (e.g. FLT-2026-001) or Mongo _id
      status: string;
    };

    if (!batchId || !status) {
      return NextResponse.json({ success: false, error: 'batchId and status are required' }, { status: 400 });
    }

    // Resolve to the human-readable batchId and persist the batch status.
    let resolvedBatchId = batchId;
    const batchDoc = await Batch.findOne({ $or: [{ _id: batchId }, { batchId: batchId }] });
    if (!batchDoc) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }
    resolvedBatchId = batchDoc.batchId;
    batchDoc.status = status as any;
    await batchDoc.save();

    // Cascade the batch status down to every shipment in the batch. Shipment
    // statuses are PENDING | IN_TRANSIT | ARRIVED; map the batch's LOADING onto
    // IN_TRANSIT.
    const SHIPMENT_STATUS: Record<string, 'PENDING' | 'IN_TRANSIT' | 'ARRIVED'> = {
      PENDING: 'PENDING',
      IN_TRANSIT: 'IN_TRANSIT',
      LOADING: 'IN_TRANSIT',
      ARRIVED: 'ARRIVED',
    };
    const mappedStatus = SHIPMENT_STATUS[status];
    let updatedShipments = 0;
    if (mappedStatus) {
      const res = await Shipment.updateMany({ batch: resolvedBatchId }, { $set: { status: mappedStatus } });
      updatedShipments = res.modifiedCount ?? 0;
    }

    return NextResponse.json({ success: true, batchId: resolvedBatchId, updatedShipments });
  } catch (err: any) {
    console.error('Error in /api/send-sms:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
