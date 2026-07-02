import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import TodoPerson from '@/lib/models/TodoPerson';

export const dynamic = 'force-dynamic';

// The two people the board started with — seeded once so existing tasks still
// filter correctly, then the office manages the list themselves.
const DEFAULTS = ['Khalid', 'Sakariye'];

export async function GET() {
  try {
    await connectDB();
    let people = await TodoPerson.find({}).sort({ createdAt: 1 });
    if (people.length === 0) {
      await TodoPerson.insertMany(DEFAULTS.map((name) => ({ name })));
      people = await TodoPerson.find({}).sort({ createdAt: 1 });
    }
    return NextResponse.json(people);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch people', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const existing = await TodoPerson.findOne({ name: name.trim() });
    if (existing) return NextResponse.json(existing);
    const person = await TodoPerson.create({ name: name.trim() });
    return NextResponse.json(person, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to add person', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await TodoPerson.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to remove person', details: message }, { status: 500 });
  }
}
