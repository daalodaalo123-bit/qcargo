import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Invoice, { type IInvoiceItem } from '@/lib/models/Invoice';
import { generateReceiptPdf } from '@/lib/generate-receipt-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
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
    const shipDateMatch = invoice.notes?.match(/\((\d{4}-\d{2}-\d{2})\)/);
    const pdfBytes = await generateReceiptPdf({
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
      amountPaid: invoice.amountPaid ?? invoice.totalAmount,
      balanceDue: invoice.balanceDue ?? 0,
      paymentStatus: invoice.paymentStatus,
      quotationDate: isShipment && shipDateMatch?.[1] ? shipDateMatch[1] : invoice.paymentDate,
      shipmentNumber: isShipment ? invoice.goodsSummary : undefined,
      dateLabel: isShipment ? 'Shipment Date' : 'Quotation Date',
      itemsTitle: isShipment ? 'Shipment Charges' : 'Items & Services',
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate PDF', details: message }, { status: 500 });
  }
}
