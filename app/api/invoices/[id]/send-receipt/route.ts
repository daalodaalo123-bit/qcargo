import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Invoice, { type IInvoiceItem } from '@/lib/models/Invoice';
import { deliverReceiptWhatsApp } from '@/lib/deliver-receipt-whatsapp';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const isShipment = Boolean(invoice.shipmentId);
    const caption = `Asc ${invoice.customerName}, ${BRAND_NAME} receipt ${invoice.invoiceNumber}${isShipment ? ` (${invoice.goodsSummary})` : ''}. Mahadsanid!`;

    const delivery = await deliverReceiptWhatsApp({
      phone: invoice.customerPhone,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: String(invoice._id),
      caption,
      receiptData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        paymentMethod: invoice.paymentMethod,
        paymentDate: invoice.paymentDate,
        freightType: invoice.freightType,
        goodsSummary: invoice.goodsSummary,
        items: invoice.items.map((it: IInvoiceItem) => ({
          description: it.description,
          qty: it.qty,
          price: it.price,
          lineTotal: it.lineTotal,
        })),
        subtotal: invoice.subtotal,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        paymentStatus: invoice.paymentStatus,
        quotationDate: invoice.paymentDate,
        shipmentNumber: isShipment ? invoice.goodsSummary : undefined,
        dateLabel: isShipment ? 'Shipment Date' : 'Quotation Date',
        itemsTitle: isShipment ? 'Shipment Charges' : 'Items & Services',
      },
    });

    if (delivery.pdfUrl && delivery.pdfUrl !== invoice.receiptPdfUrl) {
      invoice.receiptPdfUrl = delivery.pdfUrl;
      await invoice.save();
    }

    return NextResponse.json({
      success: delivery.pdfAttached || delivery.whatsappSent,
      pdfSent: delivery.pdfAttached,
      whatsappSent: delivery.whatsappSent,
      whatsappError: delivery.error,
      receiptPdfUrl: delivery.pdfUrl,
      deliverySteps: delivery.steps,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to send receipt', details: message }, { status: 500 });
  }
}
