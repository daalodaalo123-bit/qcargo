import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Customer from '@/lib/models/Customer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch customers', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
    }
    const customer = new Customer(body);
    await customer.save();
    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create customer', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update customer', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete customer', details: err.message }, { status: 500 });
  }
}
