import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AgentUser from '@/lib/models/AgentUser';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 });

  await connectDB();
  const agent = await AgentUser.findOne({ username: username.toLowerCase(), active: true });
  if (!agent) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
  const token = await new SignJWT({
    sub: String(agent._id),
    name: agent.name,
    city: agent.city,
    country: agent.country,
    language: agent.language,
    username: agent.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);

  return NextResponse.json({
    token,
    agent: {
      id: String(agent._id),
      name: agent.name,
      city: agent.city,
      country: agent.country,
      language: agent.language,
      username: agent.username,
    },
  });
}
