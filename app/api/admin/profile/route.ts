import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = (session.user as { id?: string })?.id;
  const user = await AdminUser.findById(userId, { passwordHash: 0 }).lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = (session.user as { id?: string })?.id;
  const { name, phone, location, bio, photo } = await req.json();

  const allowed: Record<string, string> = {};
  if (name)     allowed.name     = name;
  if (phone     !== undefined) allowed.phone     = phone;
  if (location  !== undefined) allowed.location  = location;
  if (bio       !== undefined) allowed.bio       = bio;
  if (photo     !== undefined) allowed.photo     = photo;

  const user = await AdminUser.findByIdAndUpdate(userId, allowed, { new: true, projection: { passwordHash: 0 } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
