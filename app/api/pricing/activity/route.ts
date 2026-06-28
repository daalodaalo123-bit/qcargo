import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import DirectMessage from '@/lib/models/DirectMessage';
import PricingResponse from '@/lib/models/PricingResponse';

export const dynamic = 'force-dynamic';

// Sourcing activity badge for the admin sidebar.
// - unreadMessages: agent DMs the admin hasn't read yet
// - pendingResponses: prices an agent submitted that haven't been selected/rejected
// total = both, so the admin sees one number that means "agent things waiting on me".
export async function GET() {
  await connectDB();
  const [unreadMessages, pendingResponses] = await Promise.all([
    DirectMessage.countDocuments({ fromAgent: true, read: false }),
    PricingResponse.countDocuments({ status: 'SUBMITTED' }),
  ]);
  return NextResponse.json({
    unreadMessages,
    pendingResponses,
    total: unreadMessages + pendingResponses,
  });
}
