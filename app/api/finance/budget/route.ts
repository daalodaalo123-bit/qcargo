import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Budget from '@/lib/models/Budget';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

const EDIT_ROLES = ['admin', 'accountant', 'branch_manager'];

export async function GET() {
  try {
    await connectDB();
    const budgets = await Budget.find({}).sort({ category: 1 });
    return NextResponse.json(budgets);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load budgets', details: message }, { status: 500 });
  }
}

// Upsert a category budget.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !EDIT_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await connectDB();
    const { category, monthlyBudget } = await request.json();
    if (!category || !String(category).trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    const doc = await Budget.findOneAndUpdate(
      { category: String(category).trim() },
      { $set: { monthlyBudget: Math.max(0, Number(monthlyBudget) || 0) } },
      { new: true, upsert: true }
    );
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save budget', details: message }, { status: 500 });
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
    await Budget.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete budget', details: message }, { status: 500 });
  }
}
