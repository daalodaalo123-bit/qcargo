import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession();
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const users = await AdminUser.find({}, { passwordHash: 0 }).sort({ createdAt: 1 });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { name, username, email, password, role } = await request.json();

  if (!name || !username || !email || !password) {
    return NextResponse.json({ error: 'name, username, email, and password are required' }, { status: 400 });
  }

  const existing = await AdminUser.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
  if (existing) {
    return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await AdminUser.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'staff',
    active: true,
  });

  return NextResponse.json({ id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, active: user.active }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  await connectDB();
  const body = await request.json();

  // If updating password, hash it
  if (body.password) {
    body.passwordHash = await bcrypt.hash(body.password, 10);
    delete body.password;
  }

  const user = await AdminUser.findByIdAndUpdate(id, body, { new: true, projection: { passwordHash: 0 } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  await connectDB();
  const count = await AdminUser.countDocuments({ active: true });
  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last active admin user' }, { status: 400 });
  }

  await AdminUser.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
