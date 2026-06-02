import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongoose';
import Customer from '@/lib/models/Customer';
import Shipment from '@/lib/models/Shipment';

export const dynamic = 'force-dynamic';

async function verifyToken(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; phone: string; name: string };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const payload = await verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const customer = await Customer.findById(payload.sub, { passwordHash: 0 });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const shipments = await Shipment.find({ phone: { $regex: payload.phone.slice(-9) } })
    .sort({ createdAt: -1 })
    .select('shipmentNumber type status date total paymentStatus batch weight cbm items');

  return NextResponse.json({ customer, shipments });
}
