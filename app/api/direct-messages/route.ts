import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import DirectMessage from '@/lib/models/DirectMessage';
import AgentUser from '@/lib/models/AgentUser';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAgentFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return payload as { sub: string; name: string };
  } catch { return null; }
}

// GET — fetch messages for a conversation
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  await connectDB();
  const messages = await DirectMessage.find({ agentId }).sort({ createdAt: 1 }).lean();
  // Mark admin messages as read when agent fetches (agent is reading)
  const fromToken = req.headers.get('authorization');
  if (fromToken) {
    await DirectMessage.updateMany({ agentId, fromAgent: false, read: false }, { read: true });
  } else {
    // Admin is reading — mark agent messages as read
    await DirectMessage.updateMany({ agentId, fromAgent: true, read: false }, { read: true });
  }
  return NextResponse.json(messages);
}

// POST — send a message
export async function POST(req: Request) {
  const body = await req.json();
  const { agentId, text, fromAdmin } = body;
  if (!agentId || !text) return NextResponse.json({ error: 'agentId and text required' }, { status: 400 });

  await connectDB();
  const agent = await AgentUser.findById(agentId).lean() as any;
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  if (!fromAdmin) {
    const agentPayload = await getAgentFromToken(req);
    if (!agentPayload || agentPayload.sub !== agentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const message = await DirectMessage.create({
    agentId,
    agentName: agent.name,
    fromAgent: !fromAdmin,
    text,
  });
  return NextResponse.json(message, { status: 201 });
}

// GET unread counts for all agents (admin dashboard)
// Called as GET /api/direct-messages?summary=true
