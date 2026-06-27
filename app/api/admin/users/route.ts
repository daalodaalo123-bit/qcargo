import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

// The primary owner = first-created super admin. Protected from demotion/deletion.
async function getOwnerId() {
  const owner = await AdminUser.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  return owner ? String(owner._id) : null;
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

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
  }

  const cleanUsername = username.toLowerCase().trim();
  // Use provided email or generate a placeholder (staff can update in their profile)
  const cleanEmail = email?.trim()
    ? email.toLowerCase().trim()
    : `${cleanUsername}@qcargo.staff`;

  const existing = await AdminUser.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
  if (existing) {
    return NextResponse.json({ error: 'Username already in use' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await AdminUser.create({
    name,
    username: cleanUsername,
    email:    cleanEmail,
    passwordHash,
    role:   role || 'sales_rep',
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

  // The primary owner must always stay an active admin (no lock-out, no demote).
  const ownerId = await getOwnerId();
  if (ownerId && ownerId === id) {
    if (body.active === false) {
      return NextResponse.json({ error: 'The primary owner account cannot be deactivated.' }, { status: 403 });
    }
    if (body.role && body.role !== 'admin') {
      return NextResponse.json({ error: 'The primary owner account must remain an admin.' }, { status: 403 });
    }
  }

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

  // The primary owner account is protected and can never be deleted.
  const ownerId = await getOwnerId();
  if (ownerId && ownerId === id) {
    return NextResponse.json({ error: 'The primary owner account is protected and cannot be deleted.' }, { status: 403 });
  }

  const count = await AdminUser.countDocuments({ active: true });
  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last active admin user' }, { status: 400 });
  }

  await AdminUser.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
