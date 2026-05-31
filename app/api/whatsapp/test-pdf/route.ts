import { NextResponse } from 'next/server';
import { deliverReceiptWhatsApp } from '@/lib/deliver-receipt-whatsapp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '634845067';

  const delivery = await deliverReceiptWhatsApp({
    phone,
    invoiceNumber: 'INV-TEST-PDF',
    caption: 'Q CARGO — test PDF receipt. If you see this as a PDF file, delivery works!',
    receiptData: {
      invoiceNumber: 'INV-TEST-PDF',
      customerName: 'Test Customer',
      customerPhone: phone,
      paymentMethod: 'ZAAD',
      paymentDate: new Date().toISOString().split('T')[0],
      freightType: 'SEA',
      goodsSummary: 'Test cargo',
      items: [{ description: 'Test item', qty: 1, price: 10, lineTotal: 10 }],
      subtotal: 10,
      totalAmount: 10,
      amountPaid: 10,
      balanceDue: 0,
      paymentStatus: 'PAID',
    },
  });

  return NextResponse.json({
    message: delivery.pdfAttached
      ? 'Test PDF sent to WhatsApp as file attachment'
      : 'PDF attach failed — see deliverySteps',
    ...delivery,
  });
}
