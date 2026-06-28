import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';
import Quotation from '@/lib/models/Quotation';
import Shipment from '@/lib/models/Shipment';
import Customer from '@/lib/models/Customer';
import { Batch } from '@/lib/models/Batch';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

// HR scoreboard (Gap #8). Tallies each staff member's activity over a period.
// Owner / Super Admin only.

type Period = 'week' | 'month' | 'all';

function sinceFor(period: Period): Date {
  if (period === 'all') return new Date(0);
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
}

interface Stat {
  quotations: number;
  payments: number;
  collected: number;
  customers: number;
  shipments: number;
  batches: number;
}

function emptyStat(): Stat {
  return { quotations: 0, payments: 0, collected: 0, customers: 0, shipments: 0, batches: 0 };
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Owner access only' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as Period) || 'week';
    const since = sinceFor(period);
    const inRange = (d: Date | string | undefined | null) =>
      !!d && new Date(d) >= since;

    const [quotations, shipments, customers, batches, users] = await Promise.all([
      Quotation.find({}, 'createdBy createdAt payments').lean(),
      Shipment.find({}, 'createdBy createdAt payments').lean(),
      Customer.find({}, 'createdBy createdAt').lean(),
      Batch.find({}, 'createdBy createdAt').lean(),
      AdminUser.find({}, 'name role photo lastSeen username').sort({ name: 1 }).lean(),
    ]);

    const stats: Record<string, Stat> = {};
    const ensure = (id?: string) => {
      if (!id) return null;
      if (!stats[id]) stats[id] = emptyStat();
      return stats[id];
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const q of quotations as any[]) {
      if (q.createdBy?.id && inRange(q.createdAt)) {
        const s = ensure(q.createdBy.id);
        if (s) s.quotations++;
      }
      for (const p of q.payments || []) {
        if (p.by?.id && inRange(p.at)) {
          const s = ensure(p.by.id);
          if (s) { s.payments++; s.collected += p.amount || 0; }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const sh of shipments as any[]) {
      if (sh.createdBy?.id && inRange(sh.createdAt)) {
        const s = ensure(sh.createdBy.id);
        if (s) s.shipments++;
      }
      for (const p of sh.payments || []) {
        if (p.by?.id && inRange(p.at)) {
          const s = ensure(p.by.id);
          if (s) { s.payments++; s.collected += p.amount || 0; }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const c of customers as any[]) {
      if (c.createdBy?.id && inRange(c.createdAt)) {
        const s = ensure(c.createdBy.id);
        if (s) s.customers++;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const b of batches as any[]) {
      if (b.createdBy?.id && inRange(b.createdAt)) {
        const s = ensure(b.createdBy.id);
        if (s) s.batches++;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = (users as any[]).map((u) => ({
      id: String(u._id),
      name: u.name,
      username: u.username,
      role: u.role,
      photo: u.photo || '',
      lastSeen: u.lastSeen || null,
      ...(stats[String(u._id)] || emptyStat()),
    }));

    return NextResponse.json({ period, team });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('team report error:', err);
    return NextResponse.json({ error: 'Failed to build report', details: message }, { status: 500 });
  }
}
