import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import SalesTarget from '@/lib/models/SalesTarget';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

const EDIT_ROLES = ['admin', 'branch_manager', 'sales_rep'];

async function getOrCreate() {
  let doc = await SalesTarget.findOne();
  if (!doc) doc = await SalesTarget.create({});
  return doc;
}

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json(await getOrCreate());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load targets', details: message }, { status: 500 });
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
    if (body.monthlyRevenueTarget != null) doc.monthlyRevenueTarget = Math.max(0, Number(body.monthlyRevenueTarget) || 0);
    if (body.monthlyQuotesTarget != null) doc.monthlyQuotesTarget = Math.max(0, Number(body.monthlyQuotesTarget) || 0);
    await doc.save();
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save targets', details: message }, { status: 500 });
  }
}
