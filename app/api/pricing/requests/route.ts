import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import PricingRequest from '@/lib/models/PricingRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const requests = await PricingRequest.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { customerName, productName, description, quantity, unit, targetPrice, photos, deadline, assignedAgents, notes } = body;
  if (!customerName || !productName || !quantity) {
    return NextResponse.json({ error: 'customerName, productName and quantity required' }, { status: 400 });
  }
  await connectDB();
  const count = await PricingRequest.countDocuments();
  const requestNumber = `PR-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
  const request = await PricingRequest.create({
    requestNumber, customerName, productName, description, quantity, unit: unit || 'pcs',
    targetPrice, photos: photos || [], deadline, assignedAgents: assignedAgents || [], notes,
  });
  return NextResponse.json(request, { status: 201 });
}
