import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json(quotation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch quotation', details: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();

    const { customer, phone, goods, price, type, status, items, commissionRate, commissionAmount } = body as {
      customer?: string;
      phone?: string;
      goods?: string;
      price?: number;
      type?: 'AIR' | 'SEA';
      status?: 'SENT' | 'DRAFT' | 'APPROVED' | 'REJECTED';
      items?: { description: string; notes?: string; specification?: string; qty: number; price: number }[];
      commissionRate?: number;
      commissionAmount?: number;
    };

    if (!customer?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    if (customer !== undefined) quotation.customer = customer.trim();
    if (phone !== undefined) quotation.phone = phone.trim();
    if (goods !== undefined) quotation.goods = goods;
    if (price !== undefined) quotation.price = price;
    if (type !== undefined) quotation.type = type;
    if (status !== undefined) quotation.status = status;
    if (items !== undefined) quotation.items = items;
    if (commissionRate !== undefined) quotation.commissionRate = commissionRate;
    if (commissionAmount !== undefined) quotation.commissionAmount = commissionAmount;

    await quotation.save();
    return NextResponse.json(quotation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update quotation', details: message }, { status: 500 });
  }
}
