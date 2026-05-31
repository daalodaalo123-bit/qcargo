import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import VendorBill from '@/lib/models/VendorBill';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const bills = await VendorBill.find({}).sort({ createdAt: -1 });
    return NextResponse.json(bills);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch bills', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const bill = new VendorBill(body);
    await bill.save();
    return NextResponse.json(bill, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create bill', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const bill = await VendorBill.findByIdAndUpdate(id, body, { new: true });
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    return NextResponse.json(bill);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update bill', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const bill = await VendorBill.findByIdAndDelete(id);
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete bill', details: err.message }, { status: 500 });
  }
}
