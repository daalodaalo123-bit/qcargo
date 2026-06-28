// app/api/shipments/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import { Batch } from '@/lib/models/Batch';
import { ShipmentSchema, zodError } from '@/lib/validation';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const shipments = await Shipment.find({}).sort({ createdAt: -1 });
    return NextResponse.json(shipments);
  } catch (err: any) {
    console.error('Error fetching shipments:', err);
    return NextResponse.json({ error: 'Failed to fetch shipments', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const parsed = ShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    // Create new shipment document
    const user = await getSessionUser();
    const shipment = new Shipment({
      ...parsed.data,
      createdBy: user ? { id: user.id, name: user.name } : undefined,
    });
    await shipment.save();

    // If batch is assigned, we should update the shipments count on the Batch model
    if (body.batch && body.batch !== 'UNASSIGNED') {
      const count = await Shipment.countDocuments({ batch: body.batch });
      await Batch.findOneAndUpdate(
        { batchId: body.batch },
        { shipments: count }
      );
    }

    return NextResponse.json(shipment, { status: 201 });
  } catch (err: any) {
    console.error('Error creating shipment:', err);
    return NextResponse.json({ error: 'Failed to create shipment', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const existing = await Shipment.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const oldBatch = existing.batch;
    const shipment = await Shipment.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const batchesToUpdate = new Set<string>();
    if (oldBatch && oldBatch !== 'UNASSIGNED') batchesToUpdate.add(oldBatch);
    if (shipment.batch && shipment.batch !== 'UNASSIGNED') batchesToUpdate.add(shipment.batch);

    for (const batchId of batchesToUpdate) {
      const count = await Shipment.countDocuments({ batch: batchId });
      await Batch.findOneAndUpdate({ batchId }, { shipments: count });
    }

    return NextResponse.json(shipment);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error updating shipment:', err);
    return NextResponse.json({ error: 'Failed to update shipment', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }
    
    const shipment = await Shipment.findByIdAndDelete(id);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }
    
    // Decrement batch shipments count
    if (shipment.batch && shipment.batch !== 'UNASSIGNED') {
      const count = await Shipment.countDocuments({ batch: shipment.batch });
      await Batch.findOneAndUpdate(
        { batchId: shipment.batch },
        { shipments: count }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting shipment:', err);
    return NextResponse.json({ error: 'Failed to delete shipment', details: err.message }, { status: 500 });
  }
}

