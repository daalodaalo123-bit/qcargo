import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import TodoTask from '@/lib/models/TodoTask';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const tasks = await TodoTask.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tasks', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.title || !body.assignee) {
      return NextResponse.json({ error: 'Title and Assignee are required' }, { status: 400 });
    }
    const task = new TodoTask(body);
    await task.save();
    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create task', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const body = await request.json();
    const task = await TodoTask.findByIdAndUpdate(id, body, { new: true });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update task', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const task = await TodoTask.findByIdAndDelete(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete task', details: err.message }, { status: 500 });
  }
}
