import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongoose';
import AdminHeartbeat from '@/lib/models/AdminHeartbeat';
import AdminUser from '@/lib/models/AdminUser';

export const dynamic = 'force-dynamic';

export async function POST() {
  await connectDB();

  // Update global heartbeat (agents use this to know if admin is online)
  const existing = await AdminHeartbeat.findOne();
  if (existing) {
    existing.updatedAt = new Date();
    await existing.save();
  } else {
    await AdminHeartbeat.create({});
  }

  // Update per-user lastSeen
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;
    if (userId) {
      await AdminUser.findByIdAndUpdate(userId, { lastSeen: new Date() });
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true });
}

export async function GET() {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hb = await AdminHeartbeat.findOne().lean() as any;
  if (!hb) return NextResponse.json({ online: false, lastSeen: null });
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const online = hb.updatedAt > twoMinutesAgo;
  return NextResponse.json({ online, lastSeen: hb.updatedAt });
}
