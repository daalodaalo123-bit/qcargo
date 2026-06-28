import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import BankTransaction from '@/lib/models/BankTransaction';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

const EDIT_ROLES = ['admin', 'accountant', 'branch_manager'];

export async function GET() {
  try {
    await connectDB();
    const rows = await BankTransaction.find({}).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load bank lines', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !EDIT_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    if (!body.date || body.amount == null) {
      return NextResponse.json({ error: 'Date and amount are required' }, { status: 400 });
    }
    const row = await BankTransaction.create({
      date: String(body.date),
      description: String(body.description || ''),
      amount: Math.abs(Number(body.amount) || 0),
      direction: body.direction === 'OUT' ? 'OUT' : 'IN',
      account: ['BANK', 'ZAAD', 'EDAHAB', 'CASH'].includes(body.account) ? body.account : 'BANK',
      matched: !!body.matched,
      note: String(body.note || ''),
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to add bank line', details: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !EDIT_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.matched != null) update.matched = !!body.matched;
    if (body.note != null) update.note = String(body.note);
    const row = await BankTransaction.findByIdAndUpdate(id, update, { new: true });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update bank line', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !EDIT_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await BankTransaction.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete bank line', details: message }, { status: 500 });
  }
}
