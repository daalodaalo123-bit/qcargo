import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import { Batch } from '@/lib/models/Batch';

// Force dynamic rendering so environment variables are read at request time
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { batchId, status, phone } = (await request.json()) as {
      batchId: string; // This could be batchId string (e.g. FLT-2026-001) or _id
      status: string;
      phone?: string;
    };

    if (!batchId || !status) {
      return NextResponse.json({ success: false, error: 'batchId and status are required' }, { status: 400 });
    }

    // First try to find the batch in MongoDB to get its human-readable batchId string
    let resolvedBatchId = batchId;
    const batchDoc = await Batch.findOne({ $or: [{ _id: batchId }, { batchId: batchId }] });
    if (batchDoc) {
      resolvedBatchId = batchDoc.batchId;
      // Let's also update the batch status in the database!
      batchDoc.status = status as any;
      await batchDoc.save();
    }

    // Query for shipments belonging to this batch
    const shipments = await Shipment.find({ batch: resolvedBatchId });

    if (shipments.length > 0) {
      console.log(`Found ${shipments.length} shipments for batch ${resolvedBatchId}. Sending WhatsApp notifications...`);
      
      const results = [];
      for (const ship of shipments) {
        if (!ship.phone) continue;
        
        const message = `Asc ${ship.customer}, Durdur Cargo tracking update: Your shipment ${ship.shipmentNumber} in batch ${resolvedBatchId} is now ${status}. Thank you for choosing Durdur Cargo.`;
        
        console.log(`Sending WhatsApp to ${ship.phone} (${ship.customer})`);
        const result = await sendWhatsAppMessage(ship.phone, message);
        results.push({ customer: ship.customer, phone: ship.phone, success: result.success });
      }
      
      return NextResponse.json({ success: true, count: results.length, details: results });
    }

    // Fallback: if no shipments found in MongoDB for this batch, check phone param or default number
    console.log(`No shipments found for batch ${resolvedBatchId} in DB. Using fallback recipient.`);
    const recipient = phone || process.env.DEFAULT_WHATSAPP_NUMBER;

    if (!recipient) {
      return NextResponse.json({ success: false, error: 'No shipments found for batch and no fallback phone number provided' }, { status: 400 });
    }

    const fallbackMessage = `Your batch ${resolvedBatchId} status has been updated to ${status}.`;
    const result = await sendWhatsAppMessage(recipient, fallbackMessage);

    if (result.success) {
      return NextResponse.json({ success: true, fallback: true });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (err: any) {
    console.error('Error in /api/send-sms:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
