import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import { Batch } from '@/lib/models/Batch';

export const dynamic = 'force-dynamic';

function statusToProgress(status: string): number {
  const map: Record<string, number> = {
    PENDING: 15,
    IN_TRANSIT: 65,
    ARRIVED: 90,
    DELIVERED: 100,
    COLLECTED: 100,
  };
  return map[status] ?? 15;
}

function buildTimeline(status: string, type: string, batchArrival?: string) {
  const steps = [
    { label: 'Shipment Received', location: 'Guangzhou, China' },
    { label: 'Consolidated & Loaded', location: 'Q Cargo Warehouse, GZ' },
    {
      label: type === 'AIR' ? 'Departed Guangzhou Baiyun Airport' : 'Departed Nansha Port',
      location: 'Guangzhou, China',
    },
    {
      label: type === 'AIR' ? 'In Transit – Air Freight' : 'In Transit – Indian Ocean',
      location: type === 'AIR' ? 'In Flight' : 'At Sea',
    },
    {
      label: type === 'AIR' ? 'Arrived Aden Adde Airport' : 'Arrived Berbera Port',
      location: 'Somaliland',
      date: batchArrival || undefined,
    },
    { label: 'Customs Cleared & Ready', location: 'Hargeisa, Somaliland' },
  ];

  const progressMap: Record<string, number> = {
    PENDING: 1,
    IN_TRANSIT: 3,
    ARRIVED: 4,
    DELIVERED: 5,
    COLLECTED: 5,
  };

  const doneUpTo = progressMap[status] ?? 1;

  return steps.map((s, i) => ({
    status: s.label,
    location: s.location,
    date: s.date || (i <= doneUpTo ? 'Completed' : 'Pending'),
    completed: i <= doneUpTo,
    current: i === doneUpTo,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
  }

  await connectDB();

  // Search shipment by shipmentNumber (case-insensitive)
  let shipment = await Shipment.findOne({
    shipmentNumber: { $regex: new RegExp(`^${q}$`, 'i') },
  });

  // Fallback: search by courier tracking number inside courierPackages
  if (!shipment) {
    shipment = await Shipment.findOne({
      'courierPackages.trackingNumber': { $regex: new RegExp(q, 'i') },
    });
  }

  // Fallback: search batch by batchId and return first shipment
  if (!shipment) {
    const batch = await Batch.findOne({ batchId: { $regex: new RegExp(`^${q}$`, 'i') } });
    if (batch) {
      shipment = await Shipment.findOne({ batch: batch.batchId });
    }
  }

  if (!shipment) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  // Fetch associated batch for arrival date
  let batchArrival: string | undefined;
  if (shipment.batch && shipment.batch !== 'UNASSIGNED') {
    const batch = await Batch.findOne({ batchId: shipment.batch });
    if (batch?.arrival) batchArrival = batch.arrival;
  }

  const timeline = buildTimeline(shipment.status, shipment.type, batchArrival);

  return NextResponse.json({
    found: true,
    id: shipment.shipmentNumber,
    customer: shipment.customer,
    goods: shipment.items?.map((i: any) => i.description).filter(Boolean).join(', ') || 'Cargo Shipment',
    status: shipment.status,
    type: shipment.type,
    origin: 'Guangzhou, China',
    destination: 'Hargeisa, Somaliland',
    progress: statusToProgress(shipment.status),
    estimatedArrival: batchArrival || 'Contact office for ETA',
    lastUpdate: new Date(shipment.updatedAt || shipment.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    batch: shipment.batch !== 'UNASSIGNED' ? shipment.batch : null,
    timeline,
    weight: shipment.weight,
    cbm: shipment.cbm,
    paymentStatus: shipment.paymentStatus,
  });
}
