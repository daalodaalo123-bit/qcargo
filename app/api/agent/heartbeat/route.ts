import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AgentUser from '@/lib/models/AgentUser';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    await connectDB();
    await AgentUser.findByIdAndUpdate(payload.sub, { lastSeen: new Date() });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
