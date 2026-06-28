import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import FinanceSettings from '@/lib/models/FinanceSettings';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

const EDIT_ROLES = ['admin', 'accountant', 'branch_manager'];

async function getOrCreate() {
  let doc = await FinanceSettings.findOne();
  if (!doc) doc = await FinanceSettings.create({});
  return doc;
}

export async function GET() {
  try {
    await connectDB();
    const doc = await getOrCreate();
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load finance settings', details: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !EDIT_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    const doc = await getOrCreate();

    if (body.rates) {
      if (body.rates.CNY != null) doc.rates.CNY = Math.max(0, Number(body.rates.CNY) || 0);
      if (body.rates.AED != null) doc.rates.AED = Math.max(0, Number(body.rates.AED) || 0);
    }
    if (body.vatEnabled != null) doc.vatEnabled = !!body.vatEnabled;
    if (body.vatRate != null) doc.vatRate = Math.max(0, Number(body.vatRate) || 0);
    if (body.vatLabel != null) doc.vatLabel = String(body.vatLabel).slice(0, 30);
    if (body.openingCashBalance != null) doc.openingCashBalance = Number(body.openingCashBalance) || 0;

    await doc.save();
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save finance settings', details: message }, { status: 500 });
  }
}
