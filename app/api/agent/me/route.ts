import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AgentUser from '@/lib/models/AgentUser';
import PricingRequest from '@/lib/models/PricingRequest';
import PricingResponse from '@/lib/models/PricingResponse';
import PricingMessage from '@/lib/models/PricingMessage';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAgent(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return payload as { sub: string; name: string; city: string };
  } catch { return null; }
}

export async function GET(req: Request) {
  const agent = await getAgent(req);
  if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const agentDoc = await AgentUser.findById(agent.sub, { passwordHash: 0 }).lean();
  if (!agentDoc) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  // Find all requests assigned to this agent
  const requests = await PricingRequest.find({
    assignedAgents: agent.sub,
    status: { $ne: 'CANCELLED' },
  }).sort({ createdAt: -1 }).lean();

  // Get this agent's responses
  const responses = await PricingResponse.find({ agentId: agent.sub }).lean();
  const responseMap = Object.fromEntries(responses.map(r => [r.requestId, r]));

  // Unread messages count (admin sent to this agent)
  const unread = await PricingMessage.countDocuments({ agentId: agent.sub, fromAgent: false, read: false });

  return NextResponse.json({ agent: agentDoc, requests, responseMap, unread });
}
