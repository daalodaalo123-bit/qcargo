import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Supplier from '@/lib/models/Supplier';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const supplier = await Supplier.findById(id);
      if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(supplier);
    }
    const suppliers = await Supplier.find({}).sort({ name: 1 });
    return NextResponse.json(suppliers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load suppliers', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }
    // Avoid duplicates by name (case-insensitive).
    const existing = await Supplier.findOne({ name: new RegExp(`^${body.name.trim()}$`, 'i') });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const user = await getSessionUser();
    const supplier = await Supplier.create({
      name: body.name.trim(),
      location: body.location || '',
      products: body.products || '',
      wechat: body.wechat || '',
      phone: body.phone || '',
      whatsapp: body.whatsapp || '',
      storeLink: body.storeLink || '',
      contactPerson: body.contactPerson || '',
      notes: body.notes || '',
      createdBy: user ? { id: user.id, name: user.name } : undefined,
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create supplier', details: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const body = await request.json();
    const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true });
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update supplier', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await Supplier.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete supplier', details: message }, { status: 500 });
  }
}
