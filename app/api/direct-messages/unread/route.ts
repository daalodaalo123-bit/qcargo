import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import DirectMessage from '@/lib/models/DirectMessage';

export const dynamic = 'force-dynamic';

// Returns { agentId: unreadCount } for all agents
export async function GET() {
  await connectDB();
  const unreadDocs = await DirectMessage.aggregate([
    { $match: { fromAgent: true, read: false } },
    { $group: { _id: '$agentId', count: { $sum: 1 } } },
  ]);
  const result: Record<string, number> = {};
  unreadDocs.forEach((d: any) => { result[d._id] = d.count; });
  return NextResponse.json(result);
}
