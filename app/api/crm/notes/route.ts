import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import CustomerNote from '@/lib/models/CustomerNote';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const query = customerId ? { customerId } : {};
    const notes = await CustomerNote.find(query).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(notes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.customerId || !body.text?.trim()) {
      return NextResponse.json({ error: 'customerId and text required' }, { status: 400 });
    }
    const note = await CustomerNote.create(body);
    return NextResponse.json(note, { status: 201 });
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
    await CustomerNote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
