import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import PriorityTask from '@/lib/models/PriorityTask';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  await connectDB();
  const tasks = await PriorityTask.find({ agentId }).sort({ priority: 1 }).lean();
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { agentId, customerName, product, priority, deadline, notes } = await req.json();
  if (!agentId || !customerName || !product) return NextResponse.json({ error: 'agentId, customerName and product required' }, { status: 400 });
  await connectDB();
  const task = await PriorityTask.create({ agentId, customerName, product, priority: priority || 1, deadline, notes });
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await connectDB();
  const task = await PriorityTask.findByIdAndUpdate(id, updates, { new: true });
  return NextResponse.json(task);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await connectDB();
  await PriorityTask.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
