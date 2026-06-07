import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';
import { generateQuotationPdf } from '@/lib/generate-quotation-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';
import { sendWhatsAppPdf, sendWhatsAppMessage } from '@/lib/whatsapp';
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

    const pdfData = {
      quoteNumber,
      customerName: quotation.customer,
      customerPhone: phone,
      date: quotation.date,
      freightType: quotation.type || 'SEA',
      status: quotation.status || 'SENT',
      total: quotation.price || 0,
      commissionRate: quotation.commissionRate ?? 7,
      commissionAmount: quotation.commissionAmount ?? 0,
      items: (quotation.items || []).map((it: { description: string; qty: number; price: number }) => ({
        description: it.description,
        qty: it.qty ?? 1,
        price: it.price ?? 0,
      })),
    };

    const pdfBytes = await generateQuotationPdf(pdfData);

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: 'Cloudinary not configured — cannot host PDF for WhatsApp delivery' }, { status: 500 });
    }

    const pdfUrl = await uploadReceiptPdf(pdfBytes, quoteNumber);

    const caption = `Asc ${quotation.customer}, ${BRAND_NAME} quotation ${quoteNumber}. ${quotation.type} Cargo, $${quotation.price?.toFixed(2)} USD. Contact us to confirm. Mahadsanid!`;

    const pdfResult = await sendWhatsAppPdf({ to: phone, pdfUrl, filename: `${quoteNumber}.pdf`, caption });

    if (pdfResult.success) {
      return NextResponse.json({ success: true, pdfSent: true, pdfUrl });
    }

    // Fallback: send text with PDF link
    const textResult = await sendWhatsAppMessage(phone, `${caption}\n\nQuotation PDF: ${pdfUrl}`);
    return NextResponse.json({
      success: textResult.success,
      pdfSent: false,
      pdfUrl,
      error: textResult.success ? undefined : (textResult.error || pdfResult.error),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
