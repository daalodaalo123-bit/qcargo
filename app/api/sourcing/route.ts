import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Sourcing from '@/lib/models/Sourcing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const orders = await Sourcing.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('Error fetching sourcing orders:', err);
    return NextResponse.json({ error: 'Failed to fetch sourcing orders', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const order = new Sourcing(body);
    await order.save();
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('Error creating sourcing order:', err);
    return NextResponse.json({ error: 'Failed to create sourcing order', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    const order = await Sourcing.findByIdAndDelete(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting sourcing order:', err);
    return NextResponse.json({ error: 'Failed to delete sourcing order', details: err.message }, { status: 500 });
  }
}
