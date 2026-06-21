import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import PricingRequest from '@/lib/models/PricingRequest';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = params && 'then' in params ? await params : params;
  await connectDB();
  const request = await PricingRequest.findById(id).lean();
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = params && 'then' in params ? await params : params;
  const body = await req.json();
  await connectDB();
  const request = await PricingRequest.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(request);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = params && 'then' in params ? await params : params;
  await connectDB();
  await PricingRequest.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
