import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Batch } from '@/lib/models/Batch';
import Shipment, { IShipment, IShipmentItem } from '@/lib/models/Shipment';
import { getSessionUser } from '@/lib/sessionUser';
import { getWhatsAppConfig, sendWhatsAppTemplate, sendWhatsAppMessage } from '@/lib/whatsapp';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Broadcast a WhatsApp arrival notice to every customer who has a shipment in
// this batch. Uses the approved arrival template (24/7) when configured, with a
// plain-text fallback for customers inside the 24-hour window.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await request.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: 'Batch id is required' }, { status: 400 });

    await connectDB();
    const batch = (await Batch.findById(id)) || (await Batch.findOne({ batchId: id }));
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const shipments: IShipment[] = await Shipment.find({ batch: batch.batchId });
    if (shipments.length === 0) {
      return NextResponse.json({ error: 'This batch has no shipments / customers to notify.' }, { status: 400 });
    }

    const cfg = await getWhatsAppConfig();
    if (!cfg || !cfg.enabled) {
      return NextResponse.json({ error: 'WhatsApp is not connected/enabled. Open Settings → WhatsApp.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
    const trackLink = appUrl ? `${appUrl}/track/${batch.batchId}` : '';

    // One message per customer (group their shipments by phone).
    const byPhone = new Map<string, { name: string; goods: Set<string> }>();
    for (const s of shipments) {
      if (!s.phone) continue;
      const entry = byPhone.get(s.phone) || { name: s.customer || 'Customer', goods: new Set<string>() };
      (s.items || []).forEach((it: IShipmentItem) => { if (it.description) entry.goods.add(it.description); });
      (s.courierPackages || []).forEach((p) => { if (p.goods) entry.goods.add(p.goods); });
      byPhone.set(s.phone, entry);
    }

    const results: { name: string; phone: string; ok: boolean; via?: string; error?: string }[] = [];

    for (const [phone, info] of byPhone) {
      const goodsSummary = [...info.goods].slice(0, 6).join(', ') || 'your goods';

      if (cfg.arrivalTemplate) {
        // Template body order: {{1}} name, {{2}} batch id, {{3}} goods summary.
        const tpl = await sendWhatsAppTemplate(phone, cfg.arrivalTemplate, cfg.templateLang, [
          { type: 'body', parameters: [info.name, batch.batchId, goodsSummary].map((t) => ({ type: 'text', text: t })) },
        ]);
        if (tpl.success) { results.push({ name: info.name, phone, ok: true, via: 'template' }); continue; }
        results.push({ name: info.name, phone, ok: false, via: 'template', error: tpl.error });
        // fall through to text fallback
      }

      const text = `Asc ${info.name}, ${BRAND_NAME}: shipmentkaagii (${goodsSummary}) ee batch ${batch.batchId} wuu yimid! ${trackLink ? `La soco: ${trackLink}` : ''} Mahadsanid!`;
      const txt = await sendWhatsAppMessage(phone, text);
      results.push({ name: info.name, phone, ok: txt.success, via: 'text', error: txt.success ? undefined : txt.error });
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ success: sent > 0, sent, total: results.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to notify customers', details: message }, { status: 500 });
  }
}
