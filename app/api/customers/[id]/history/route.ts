import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Customer from '@/lib/models/Customer';
import Quotation from '@/lib/models/Quotation';
import Shipment from '@/lib/models/Shipment';
import Invoice from '@/lib/models/Invoice';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const digits = (customer.phone || '').replace(/\D/g, '').slice(-9);
    const phoneRegex = digits ? new RegExp(digits) : null;

    const [quotations, shipments, invoices] = await Promise.all([
      phoneRegex
        ? Quotation.find({ phone: { $regex: phoneRegex } }).sort({ createdAt: -1 })
        : Promise.resolve([]),
      phoneRegex
        ? Shipment.find({ phone: { $regex: phoneRegex } }).sort({ createdAt: -1 })
        : Promise.resolve([]),
      phoneRegex
        ? Invoice.find({ customerPhone: { $regex: phoneRegex } }).sort({ createdAt: -1 })
        : Promise.resolve([]),
    ]);

    const totalQuoted = quotations.reduce((acc, q) => acc + (q.price || 0), 0);
    const totalShipped = shipments.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalPaidQuotations = quotations.reduce((acc, q) => acc + (q.amountPaid || 0), 0);
    const totalPaidShipments = shipments.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
    const balanceDue = Math.max(0, (totalQuoted + totalShipped) - (totalPaidQuotations + totalPaidShipments));

    return NextResponse.json({
      customer,
      quotations,
      shipments,
      invoices,
      summary: {
        totalQuotations: quotations.length,
        totalShipments: shipments.length,
        totalQuoted,
        totalShipped,
        totalPaid: totalPaidQuotations + totalPaidShipments,
        balanceDue,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch customer history', details: err.message }, { status: 500 });
  }
}
