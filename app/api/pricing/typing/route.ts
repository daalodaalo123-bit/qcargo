import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import TypingStatus from '@/lib/models/TypingStatus';

export const dynamic = 'force-dynamic';

// POST — update typing status
export async function POST(req: Request) {
  const { requestId, agentId, role } = await req.json();
  if (!requestId || !agentId || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  await connectDB();
  const field = role === 'admin' ? 'adminTypingAt' : 'agentTypingAt';
  await TypingStatus.findOneAndUpdate(
    { requestId, agentId },
    { [field]: new Date() },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}

// GET — check typing status for a conversation
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const agentId   = searchParams.get('agentId');
  if (!requestId || !agentId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  await connectDB();
  const status = await TypingStatus.findOne({ requestId, agentId }).lean() as any;
  const threshold = new Date(Date.now() - 3000); // 3 seconds
  return NextResponse.json({
    adminTyping: status?.adminTypingAt ? status.adminTypingAt > threshold : false,
    agentTyping: status?.agentTypingAt ? status.agentTypingAt > threshold : false,
  });
}
