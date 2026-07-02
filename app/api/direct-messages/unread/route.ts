import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import DirectMessage from '@/lib/models/DirectMessage';
import AgentUser from '@/lib/models/AgentUser';

export const dynamic = 'force-dynamic';

// Returns { agentId: unreadCount } for all agents. Excludes messages left behind
// by deleted agents (which can never be opened, so would count forever).
export async function GET() {
  await connectDB();
  const agents = await AgentUser.find({}, { _id: 1 }).lean();
  const agentIds = agents.map((a) => String(a._id));
  const unreadDocs = await DirectMessage.aggregate([
    { $match: { fromAgent: true, read: false, agentId: { $in: agentIds } } },
    { $group: { _id: '$agentId', count: { $sum: 1 } } },
  ]);
  const result: Record<string, number> = {};
  unreadDocs.forEach((d: any) => { result[d._id] = d.count; });
  return NextResponse.json(result);
}
