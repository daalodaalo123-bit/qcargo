import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AgentUser from '@/lib/models/AgentUser';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const agents = await AgentUser.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const { name, city, country, username, password, language, phone, email } = await req.json();
  if (!name || !city || !username || !password) {
    return NextResponse.json({ error: 'name, city, username and password are required' }, { status: 400 });
  }
  await connectDB();
  const exists = await AgentUser.findOne({ username: username.toLowerCase() });
  if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 10);
  const agent = await AgentUser.create({ name, city, country: country || 'China', username: username.toLowerCase(), passwordHash, language: language || 'en', phone, email });
  const { passwordHash: _, ...safe } = agent.toObject();
  return NextResponse.json(safe, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, name, city, country, language, phone, email, active, password } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await connectDB();
  const update: any = { name, city, country, language, phone, email, active };
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
  const agent = await AgentUser.findByIdAndUpdate(id, update, { new: true, select: '-passwordHash' });
  return NextResponse.json(agent);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await connectDB();
  await AgentUser.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
