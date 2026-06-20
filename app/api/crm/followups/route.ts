import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import FollowUp from '@/lib/models/FollowUp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const query = customerId ? { customerId } : {};
    const followups = await FollowUp.find(query).sort({ dueDate: 1 });
    return NextResponse.json(followups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.customerId || !body.dueDate || !body.note?.trim()) {
      return NextResponse.json({ error: 'customerId, dueDate and note required' }, { status: 400 });
    }
    const followup = await FollowUp.create(body);
    return NextResponse.json(followup, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const body = await request.json();
    const updated = await FollowUp.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await FollowUp.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
