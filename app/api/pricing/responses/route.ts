import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import PricingResponse from '@/lib/models/PricingResponse';
import PricingRequest from '@/lib/models/PricingRequest';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getAgentFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me');
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return payload as { sub: string; name: string; city: string };
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const agentId   = searchParams.get('agentId');
  await connectDB();
  const filter: any = {};
  if (requestId) filter.requestId = requestId;
  if (agentId)   filter.agentId   = agentId;
  const responses = await PricingResponse.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(responses);
}

export async function POST(req: Request) {
  const agent = await getAgentFromToken(req);
  if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId, supplierName, supplierContact, unitPrice, currency, moq, leadTimeDays, photos, notes } = await req.json();
  if (!requestId || !supplierName || !unitPrice) {
    return NextResponse.json({ error: 'requestId, supplierName and unitPrice required' }, { status: 400 });
  }
  await connectDB();

  // Upsert — agent can update their response
  const existing = await PricingResponse.findOne({ requestId, agentId: agent.sub });
  let response;
  if (existing) {
    response = await PricingResponse.findByIdAndUpdate(existing._id, {
      supplierName, supplierContact, unitPrice, currency: currency || 'USD',
      moq, leadTimeDays, photos: photos || [], notes, status: 'SUBMITTED',
    }, { new: true });
  } else {
    response = await PricingResponse.create({
      requestId, agentId: agent.sub, agentName: agent.name, agentCity: agent.city,
      supplierName, supplierContact, unitPrice, currency: currency || 'USD',
      moq, leadTimeDays, photos: photos || [], notes,
    });
  }

  // Update request status to IN_PROGRESS and record last response time
  await PricingRequest.findByIdAndUpdate(requestId, {
    status: 'IN_PROGRESS',
    lastResponseAt: new Date(),
  });

  return NextResponse.json(response, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  await connectDB();
  const response = await PricingResponse.findByIdAndUpdate(id, { status }, { new: true });
  return NextResponse.json(response);
}
