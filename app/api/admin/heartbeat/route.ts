import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AdminHeartbeat from '@/lib/models/AdminHeartbeat';

export const dynamic = 'force-dynamic';

// Admin pings this to stay "online"
export async function POST() {
  await connectDB();
  const existing = await AdminHeartbeat.findOne();
  if (existing) {
    existing.updatedAt = new Date();
    await existing.save();
  } else {
    await AdminHeartbeat.create({});
  }
  return NextResponse.json({ success: true });
}

// Agent polls this to check if admin is online
export async function GET() {
  await connectDB();
  const hb = await AdminHeartbeat.findOne().lean() as any;
  if (!hb) return NextResponse.json({ online: false, lastSeen: null });
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const online = hb.updatedAt > twoMinutesAgo;
  return NextResponse.json({ online, lastSeen: hb.updatedAt });
}
