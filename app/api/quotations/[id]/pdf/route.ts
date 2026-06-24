import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';
import { generateQuotationPdf } from '@/lib/generate-quotation-pdf';
import { personalizedPdfFilename } from '@/lib/pdf-filename';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const quoteNumber = `QT-${String(quotation._id).slice(-8).toUpperCase()}`;
    const fileName = personalizedPdfFilename(quotation.customer, quoteNumber);

    const pdfBytes = await generateQuotationPdf({
      quoteNumber,
      customerName: quotation.customer,
      customerPhone: quotation.phone || '',
      date: quotation.date,
      freightType: quotation.type || 'SEA',
      status: quotation.status || 'SENT',
      paymentStatus: quotation.paymentStatus || 'UNPAID',
      total: quotation.price || 0,
      commissionRate: quotation.commissionRate ?? 7,
      commissionAmount: quotation.commissionAmount ?? 0,
      items: (quotation.items || []).map((it: { description: string; notes?: string; specification?: string; qty: number; price: number }) => ({
        description: it.description,
        notes: it.notes || '',
        specification: it.specification || '',
        qty: it.qty ?? 1,
        price: it.price ?? 0,
      })),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
