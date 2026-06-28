import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Ticket from '@/lib/models/Ticket';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

function nextTicketNumber() {
  return `TKT-${Date.now().toString().slice(-7)}`;
}

export async function GET() {
  try {
    await connectDB();
    const tickets = await Ticket.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tickets);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load tickets', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.customerName?.trim() || !body.subject?.trim()) {
      return NextResponse.json({ error: 'Customer and subject are required' }, { status: 400 });
    }
    const user = await getSessionUser();
    const ticket = await Ticket.create({
      ticketNumber: nextTicketNumber(),
      customerName: body.customerName,
      customerPhone: body.customerPhone || '',
      subject: body.subject,
      description: body.description || '',
      category: body.category || 'OTHER',
      priority: body.priority || 'MEDIUM',
      status: body.status || 'OPEN',
      assignedToName: body.assignedToName || '',
      createdBy: user ? { id: user.id, name: user.name } : undefined,
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create ticket', details: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const body = await request.json();
    if (body.status === 'RESOLVED') body.resolvedAt = new Date();
    if (body.status && body.status !== 'RESOLVED') body.resolvedAt = null;
    const ticket = await Ticket.findByIdAndUpdate(id, body, { new: true });
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ticket);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update ticket', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await Ticket.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete ticket', details: message }, { status: 500 });
  }
}
