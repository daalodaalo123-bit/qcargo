import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import DirectMessage from '@/lib/models/DirectMessage';
import PricingResponse from '@/lib/models/PricingResponse';
import AgentUser from '@/lib/models/AgentUser';

export const dynamic = 'force-dynamic';

// Sourcing activity badge for the admin sidebar.
// - unreadMessages: agent DMs the admin hasn't read yet
// - pendingResponses: prices an agent submitted that haven't been selected/rejected
// total = both, so the admin sees one number that means "agent things waiting on me".
// Only count messages from agents that still exist — messages left behind by a
// deleted agent can never be opened/read, so they must not stick in the badge.
export async function GET() {
  await connectDB();
  const agents = await AgentUser.find({}, { _id: 1 }).lean();
  const agentIds = agents.map((a) => String(a._id));
  const [unreadMessages, pendingResponses] = await Promise.all([
    DirectMessage.countDocuments({ fromAgent: true, read: false, agentId: { $in: agentIds } }),
    PricingResponse.countDocuments({ status: 'SUBMITTED' }),
  ]);
  return NextResponse.json({
    unreadMessages,
    pendingResponses,
    total: unreadMessages + pendingResponses,
  });
}
