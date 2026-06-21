import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import PricingMessage from '@/lib/models/PricingMessage';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAgentFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return payload as { sub: string; name: string; city: string };
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const agentId   = searchParams.get('agentId');
  if (!requestId || !agentId) return NextResponse.json({ error: 'requestId and agentId required' }, { status: 400 });
  await connectDB();
  const messages = await PricingMessage.find({ requestId, agentId }).sort({ createdAt: 1 }).lean();
  // Mark agent messages as read when admin fetches
  await PricingMessage.updateMany({ requestId, agentId, fromAgent: true, read: false }, { read: true });
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { requestId, agentId, agentName, text, fromAdmin } = body;
  if (!requestId || !agentId || !text) return NextResponse.json({ error: 'requestId, agentId and text required' }, { status: 400 });

  // If from admin, no token needed — just trust the body flag
  // If from agent, verify token
  if (!fromAdmin) {
    const agent = await getAgentFromToken(req);
    if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const message = await PricingMessage.create({
    requestId, agentId, agentName: agentName || 'Agent',
    fromAgent: !fromAdmin, text, read: false,
  });
  return NextResponse.json(message, { status: 201 });
}
