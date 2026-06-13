import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import LeadMetric from '@/lib/models/LeadMetric';

export const dynamic = 'force-dynamic';

const SEED_DATA = [
  { date: '2026-06-11', messages: 25, quotesSent: 18, ordersConfirmed: 1 },
  { date: '2026-06-12', messages: 40, quotesSent: 30, ordersConfirmed: 1 },
  { date: '2026-06-13', messages: 50, quotesSent: 35, ordersConfirmed: 0 },
];

export async function GET() {
  try {
    await connectDB();
    let metrics = await LeadMetric.find({}).sort({ date: 1 });
    if (metrics.length === 0) {
      metrics = await LeadMetric.insertMany(SEED_DATA);
    }
    return NextResponse.json(metrics);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch lead metrics', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    const metric = await LeadMetric.findOneAndUpdate(
      { date: body.date },
      {
        date: body.date,
        messages: Number(body.messages) || 0,
        quotesSent: Number(body.quotesSent) || 0,
        ordersConfirmed: Number(body.ordersConfirmed) || 0,
      },
      { new: true, upsert: true }
    );
    return NextResponse.json(metric, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save lead metric', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const metric = await LeadMetric.findByIdAndUpdate(id, body, { new: true });
    if (!metric) return NextResponse.json({ error: 'Lead metric not found' }, { status: 404 });
    return NextResponse.json(metric);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update lead metric', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const metric = await LeadMetric.findByIdAndDelete(id);
    if (!metric) return NextResponse.json({ error: 'Lead metric not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete lead metric', details: err.message }, { status: 500 });
  }
}
