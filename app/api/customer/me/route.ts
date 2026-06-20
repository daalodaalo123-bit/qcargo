import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongoose';
import Customer from '@/lib/models/Customer';
import Shipment from '@/lib/models/Shipment';
import Invoice from '@/lib/models/Invoice';

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

  const customer = await Customer.findById(payload.sub, { passwordHash: 0 }).lean();
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const last9 = payload.phone.slice(-9);

  const [allShipments, allInvoices] = await Promise.all([
    Shipment.find({})
      .sort({ createdAt: -1 })
      .select('shipmentNumber type status date total paymentStatus batch weight cbm items phone')
      .lean(),
    Invoice.find({})
      .select('customerPhone balanceDue totalAmount paymentStatus')
      .lean(),
  ]);

  const shipments = allShipments.filter(
    (s: { phone?: string }) => (s.phone || '').replace(/\D/g, '').endsWith(last9)
  );

  // Compute outstanding balance from unpaid/partial invoices for this customer
  const outstandingBalance = (allInvoices as { customerPhone?: string; balanceDue?: number; totalAmount?: number; paymentStatus?: string }[])
    .filter(inv => (inv.customerPhone || '').replace(/\D/g, '').endsWith(last9))
    .filter(inv => inv.paymentStatus !== 'PAID')
    .reduce((sum, inv) => sum + (inv.balanceDue ?? inv.totalAmount ?? 0), 0);

  return NextResponse.json({ customer: { ...customer, currentBalance: outstandingBalance }, shipments });
}
