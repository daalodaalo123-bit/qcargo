import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  // Use email — NextAuth always includes it in session.user reliably
  const email = session.user?.email;
  if (!email) return NextResponse.json({ error: 'No email in session' }, { status: 400 });
  const user = await AdminUser.findOne({ email }, { passwordHash: 0 }).lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const email = session.user?.email;
  if (!email) return NextResponse.json({ error: 'No email in session' }, { status: 400 });
  const { name, phone, location, bio, photo } = await req.json();

  const allowed: Record<string, string> = {};
  if (name)     allowed.name     = name;
  if (phone     !== undefined) allowed.phone     = phone;
  if (location  !== undefined) allowed.location  = location;
  if (bio       !== undefined) allowed.bio       = bio;
  if (photo     !== undefined) allowed.photo     = photo;

  const user = await AdminUser.findOneAndUpdate({ email }, allowed, { new: true, projection: { passwordHash: 0 } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
