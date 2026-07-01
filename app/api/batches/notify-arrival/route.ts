import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Batch } from '@/lib/models/Batch';
import Shipment, { IShipment, IShipmentItem } from '@/lib/models/Shipment';
import { getSessionUser } from '@/lib/sessionUser';
import { getWhatsAppConfig, sendDocumentTemplate, sendWhatsAppPdf, sendWhatsAppMessage } from '@/lib/whatsapp';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';
import { buildShipmentQuotationPdf } from '@/lib/build-shipment-pdf';
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

    const cloudinaryReady = isCloudinaryConfigured();
    const results: { name: string; phone: string; shipment: string; ok: boolean; via?: string; error?: string }[] = [];

    // One document per shipment: build the customer's quotation PDF (goods +
    // cost), host it, and send it. Template (PDF header) works 24/7; raw PDF /
    // text are used as fallbacks inside the 24-hour window.
    for (const s of shipments) {
      if (!s.phone) {
        results.push({ name: s.customer || 'Customer', phone: '', shipment: s.shipmentNumber, ok: false, error: 'No phone number' });
        continue;
      }

      const filename = `Quotation-${s.shipmentNumber}.pdf`;
      const goodsSummary =
        [
          ...new Set([
            ...(s.items || []).map((it: IShipmentItem) => it.description).filter(Boolean),
            ...(s.courierPackages || []).map((p) => p.goods).filter(Boolean),
          ]),
        ]
          .slice(0, 6)
          .join(', ') || 'alaabtaada';

      let pdfUrl = '';
      if (cloudinaryReady) {
        try {
          const bytes = await buildShipmentQuotationPdf(s);
          pdfUrl = await uploadReceiptPdf(bytes, `arrival-${s.shipmentNumber}`);
        } catch (e) {
          console.error('arrival pdf build/upload failed', s.shipmentNumber, e);
        }
      }

      const caption = `Asalaamu calaykum ${s.customer}, shixnaddaadii (${s.shipmentNumber}) ee batch ${batch.batchId} way soo gaadhay ${BRAND_NAME}. Faylka lifaaqan waa alaabtaada iyo qiimaha. Fadlan nala soo xidhiidh. Mahadsanid.`;

      // 1) Approved document template (PDF header) — works any time.
      if (pdfUrl && cfg.arrivalTemplate) {
        const tpl = await sendDocumentTemplate({
          to: s.phone,
          templateName: cfg.arrivalTemplate,
          lang: cfg.templateLang,
          pdfUrl,
          filename,
          bodyParams: [s.customer || 'Customer', batch.batchId],
        });
        if (tpl.success) {
          results.push({ name: s.customer, phone: s.phone, shipment: s.shipmentNumber, ok: true, via: 'template' });
          continue;
        }
        results.push({ name: s.customer, phone: s.phone, shipment: s.shipmentNumber, ok: false, via: 'template', error: tpl.error });
        // fall through to raw sends (inside the 24h window)
      }

      // 2) Raw PDF (only inside the 24h window).
      if (pdfUrl) {
        const pdf = await sendWhatsAppPdf({ to: s.phone, pdfUrl, filename, caption });
        if (pdf.success) {
          results.push({ name: s.customer, phone: s.phone, shipment: s.shipmentNumber, ok: true, via: 'pdf' });
          continue;
        }
      }

      // 3) Text fallback.
      const txt = await sendWhatsAppMessage(s.phone, `${caption}\n\nAlaab: ${goodsSummary}`);
      results.push({
        name: s.customer,
        phone: s.phone,
        shipment: s.shipmentNumber,
        ok: txt.success,
        via: 'text',
        error: txt.success ? undefined : txt.error,
      });
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ success: sent > 0, sent, total: results.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to notify customers', details: message }, { status: 500 });
  }
}
