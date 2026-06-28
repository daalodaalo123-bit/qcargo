// app/api/batches/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Batch } from '@/lib/models/Batch';
import Shipment from '@/lib/models/Shipment';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch single batch by ID (or batchId)
      const batch = await Batch.findById(id) || await Batch.findOne({ batchId: id });
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }

      // Fetch shipments belonging to this batch
      const shipments = await Shipment.find({ batch: batch.batchId });

      // Calculate totals
      let totalWeight = 0;
      let totalCBM = 0;
      let totalCartons = 0;

      shipments.forEach((s: any) => {
        if (s.type === 'AIR') {
          totalWeight += Number(s.weight) || 0;
        } else {
          totalCBM += Number(s.cbm) || 0;
        }

        let cartons = 0;
        if (s.courierPackages && s.courierPackages.length > 0) {
          cartons = s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
        } else if (s.items && s.items.length > 0) {
          cartons = s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
        } else {
          cartons = 1;
        }
        totalCartons += cartons;
      });

      const batchObj = batch.toObject ? batch.toObject() : batch;
      const responseObj = {
        ...batchObj,
        id: batchObj._id.toString(),
        shipments: shipments.length,
        weight: batch.type === 'AIR' ? `${totalWeight.toFixed(1)} KG` : `${totalCBM.toFixed(2)} CBM`,
        totalCartons,
        shipmentsList: shipments.map((s: any) => ({
          ...s.toObject ? s.toObject() : s,
          id: s._id.toString()
        }))
      };

      return NextResponse.json(responseObj);
    }

    // Fetch all batches
    const batches = await Batch.find({}).sort({ createdAt: -1 });
    
    // Fetch all shipments to map their batch values
    const allShipments = await Shipment.find({});

    const enrichedBatches = batches.map((batch) => {
      const batchShipments = allShipments.filter((s) => s.batch === batch.batchId);
      
      let totalWeight = 0;
      let totalCBM = 0;
      let totalCartons = 0;
      let totalLines = 0;
      let receivedCount = 0;

      batchShipments.forEach((s: any) => {
        if (s.type === 'AIR') {
          totalWeight += Number(s.weight) || 0;
        } else {
          totalCBM += Number(s.cbm) || 0;
        }

        let cartons = 0;
        if (s.courierPackages && s.courierPackages.length > 0) {
          cartons = s.courierPackages.reduce((sum: number, p: any) => sum + (p.qty || 1), 0);
        } else if (s.items && s.items.length > 0) {
          cartons = s.items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
        } else {
          cartons = 1;
        }
        totalCartons += cartons;

        // Arrival progress: ONE line per product, matching the public track sheet
        // so the counts always agree. Walk items[] (the master list) and pair each
        // with the courier package carrying its tracking number; any leftover
        // courier package counts as its own line.
        const itemsArr: any[] = Array.isArray(s.items) ? s.items : [];
        const couriersArr: any[] = Array.isArray(s.courierPackages) ? s.courierPackages : [];
        const usedCp = new Set<number>();
        let shipLines = 0;
        let shipReceived = 0;
        itemsArr.forEach((it: any) => {
          let cpIdx = -1;
          for (let i = 0; i < couriersArr.length; i++) {
            if (usedCp.has(i)) continue;
            if ((couriersArr[i].goods || '') === (it.description || '')) { cpIdx = i; break; }
          }
          const cp = cpIdx >= 0 ? couriersArr[cpIdx] : null;
          if (cpIdx >= 0) usedCp.add(cpIdx);
          shipLines += 1;
          if (it.received || (cp && cp.received)) shipReceived += 1;
        });
        couriersArr.forEach((p: any, i: number) => {
          if (usedCp.has(i)) return;
          shipLines += 1;
          if (p.received) shipReceived += 1;
        });
        if (shipLines === 0) {
          totalLines += 1;
        } else {
          totalLines += shipLines;
          receivedCount += shipReceived;
        }
      });

      const batchObj = batch.toObject ? batch.toObject() : batch;
      return {
        ...batchObj,
        id: batchObj._id.toString(),
        shipments: batchShipments.length,
        weight: batch.type === 'AIR' ? `${totalWeight.toFixed(1)} KG` : `${totalCBM.toFixed(2)} CBM`,
        totalCartons,
        totalLines,
        receivedCount
      };
    });

    return NextResponse.json(enrichedBatches);
  } catch (err: any) {
    console.error('Error fetching batches:', err);
    return NextResponse.json({ error: 'Failed to fetch batches', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const user = await getSessionUser();

    // Create new batch document
    const batch = new Batch({
      batchId: body.batchId,
      type: body.type,
      origin: body.origin,
      destination: body.destination,
      status: body.status || 'IN_TRANSIT',
      shipments: body.shipments || 0,
      weight: body.weight || '',
      arrival: body.arrival || '',
      createdBy: user ? { id: user.id, name: user.name } : undefined,
    });
    
    await batch.save();
    return NextResponse.json(batch, { status: 201 });
  } catch (err: any) {
    console.error('Error creating batch:', err);
    return NextResponse.json({ error: 'Failed to create batch', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting batch:', err);
    return NextResponse.json({ error: 'Failed to delete batch', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const batch = await Batch.findByIdAndUpdate(id, body, { new: true });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (err: any) {
    console.error('Error updating batch:', err);
    return NextResponse.json({ error: 'Failed to update batch', details: err.message }, { status: 500 });
  }
}


