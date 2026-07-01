import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';
import { deliverQuotationWhatsApp } from '@/lib/deliver-quotation-whatsapp';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const overridePhone: string | undefined = (body as { phone?: string }).phone?.trim();

    await connectDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const phone = overridePhone || quotation.phone;
    if (!phone) {
      return NextResponse.json({ error: 'No phone number on this quotation' }, { status: 400 });
    }

    const quoteNumber = `QT-${String(quotation._id).slice(-8).toUpperCase()}`;

    const caption = `Asc ${quotation.customer}, ${BRAND_NAME} quotation ${quoteNumber}. ${quotation.type} Cargo, $${quotation.price?.toFixed(2)} USD. Contact us to confirm. Mahadsanid!`;

    const delivery = await deliverQuotationWhatsApp({
      phone,
      caption,
      pdfData: {
        quoteNumber,
        customerName: quotation.customer,
        customerPhone: phone,
        date: quotation.date,
        freightType: quotation.type || 'SEA',
        status: quotation.status || 'SENT',
        paymentStatus: quotation.paymentStatus || 'UNPAID',
        total: quotation.price || 0,
        commissionRate: quotation.commissionRate ?? 10,
        commissionAmount: quotation.commissionAmount ?? 0,
        items: (quotation.items || []).map((it: { description: string; notes?: string; qty: number; price: number }) => ({
          description: it.description,
          notes: it.notes || '',
          qty: it.qty ?? 1,
          price: it.price ?? 0,
        })),
      },
    });

    return NextResponse.json({
      success: delivery.pdfSent || delivery.whatsappSent,
      pdfSent: delivery.pdfSent,
      viaTemplate: delivery.viaTemplate,
      pdfUrl: delivery.pdfUrl,
      deliverySteps: delivery.steps,
      error: delivery.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
