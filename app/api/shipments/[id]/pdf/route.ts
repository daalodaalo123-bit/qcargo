import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import { generateReceiptPdf } from '@/lib/generate-receipt-pdf';
import { buildShipmentInvoiceItems } from '@/lib/build-shipment-invoice-items';
import { buildShipmentGoods } from '@/lib/build-shipment-goods';
import { buildShipmentQuotationPdf } from '@/lib/build-shipment-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Download a shipment as a branded PDF:
//   ?type=quotation → black quotation-style document (default)
//   ?type=invoice   → orange invoice/receipt-style document
// Both show the customer's goods (products) AND the cost breakdown.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'quotation').toLowerCase();

    await connectDB();
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const goods = buildShipmentGoods(shipment);
    const isAir = shipment.type === 'AIR';
    const freightSummary = [
      isAir
        ? { label: 'Chargeable Weight', value: `${shipment.weight ?? 0} KG` }
        : { label: 'Total Volume', value: `${shipment.cbm ?? 0} CBM` },
      { label: 'Rate', value: `$${(shipment.rate ?? 0).toFixed(2)} / ${isAir ? 'KG' : 'CBM'}` },
      { label: 'Batch', value: shipment.batch || 'UNASSIGNED' },
    ];
    const charges = buildShipmentInvoiceItems({
      type: shipment.type,
      shipmentNumber: shipment.shipmentNumber,
      weight: shipment.weight,
      cbm: shipment.cbm,
      rate: shipment.rate,
      customs: shipment.customs,
      discount: shipment.discount,
      tax: shipment.tax,
      total: shipment.total,
    });
    const subtotal = charges.reduce((sum, it) => sum + it.lineTotal, 0);

    let bytes: Uint8Array;
    let filename: string;

    if (type === 'invoice') {
      const amountPaid =
        shipment.amountPaid ??
        shipment.paidAmount ??
        (shipment.payment === 'PAID' ? shipment.total : 0);
      const paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' =
        shipment.paymentStatus && ['PAID', 'PARTIAL', 'UNPAID'].includes(shipment.paymentStatus)
          ? (shipment.paymentStatus as 'PAID' | 'PARTIAL' | 'UNPAID')
          : amountPaid >= shipment.total - 0.01
            ? 'PAID'
            : amountPaid > 0
              ? 'PARTIAL'
              : 'UNPAID';

      bytes = await generateReceiptPdf({
        invoiceNumber: shipment.shipmentNumber,
        customerName: shipment.customer,
        customerPhone: shipment.phone,
        paymentMethod: shipment.paymentMethod || '—',
        paymentDate: shipment.date,
        freightType: shipment.type,
        goodsSummary: goods.map((g) => g.description).join(', '),
        items: charges,
        goods,
        freightSummary,
        subtotal,
        totalAmount: shipment.total,
        amountPaid,
        balanceDue: Math.max(0, shipment.total - amountPaid),
        paymentStatus,
        quotationDate: shipment.date,
        shipmentNumber: shipment.shipmentNumber,
        dateLabel: 'Shipment Date',
        itemsTitle: 'Shipment Charges',
      });
      filename = `Invoice-${shipment.shipmentNumber}.pdf`;
    } else {
      bytes = await buildShipmentQuotationPdf(shipment);
      filename = `Quotation-${shipment.shipmentNumber}.pdf`;
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('shipment pdf error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF', details: message }, { status: 500 });
  }
}
