import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const quotations = await Quotation.find({}).sort({ createdAt: -1 });
    return NextResponse.json(quotations);
  } catch (err: any) {
    console.error('Error fetching quotations:', err);
    return NextResponse.json({ error: 'Failed to fetch quotations', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const user = await getSessionUser();
    // Stamp who created this quotation (ignore any createdBy sent by the client).
    const quotation = new Quotation({
      ...body,
      createdBy: user ? { id: user.id, name: user.name } : undefined,
    });
    await quotation.save();
    return NextResponse.json(quotation, { status: 201 });
  } catch (err: any) {
    console.error('Error creating quotation:', err);
    return NextResponse.json({ error: 'Failed to create quotation', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
    }
    const quotation = await Quotation.findByIdAndDelete(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting quotation:', err);
    return NextResponse.json({ error: 'Failed to delete quotation', details: err.message }, { status: 500 });
  }
}
