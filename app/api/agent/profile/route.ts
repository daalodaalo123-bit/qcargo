import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AgentUser from '@/lib/models/AgentUser';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAgentId(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return String(payload.sub);
  } catch {
    return null;
  }
}

// GET — the logged-in agent's own profile
export async function GET(req: Request) {
  const id = await getAgentId(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const agent = await AgentUser.findById(id, { passwordHash: 0 }).lean();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}

// PATCH — the agent updates ONLY their own profile.
// They cannot touch username, password, active status or assignments.
export async function PATCH(req: Request) {
  const id = await getAgentId(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['name', 'city', 'country', 'language', 'phone', 'email', 'wechat', 'whatsapp', 'company', 'bio', 'avatarColor'];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  // Profile counts as complete once the essentials are filled in.
  const hasEssentials = (body.name ?? '') && (body.email ?? '') && (body.phone ?? '');
  if (hasEssentials) update.profileComplete = true;

  await connectDB();
  const agent = await AgentUser.findByIdAndUpdate(id, update, { new: true, select: '-passwordHash' });
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}
