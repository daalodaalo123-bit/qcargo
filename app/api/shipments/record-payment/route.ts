import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';
import Customer from '@/lib/models/Customer';
import Invoice from '@/lib/models/Invoice';
import { deliverReceiptWhatsApp } from '@/lib/deliver-receipt-whatsapp';
import { buildShipmentInvoiceItems } from '@/lib/build-shipment-invoice-items';
import { buildShipmentGoods } from '@/lib/build-shipment-goods';
import { BRAND_NAME } from '@/lib/brand';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAYMENT_METHODS = ['ZAAD', 'EDAHAB', 'WAAFI', 'CASH', 'OTHER'] as const;

async function upsertCustomer(name: string, phone: string, amount: number) {
  const existing = await Customer.findOne({ phone });
  if (existing) {
    existing.name = name;
    existing.totalSpent = (existing.totalSpent || 0) + amount;
    await existing.save();
    return existing;
  }
  return Customer.create({
    name,
    phone,
    city: 'Hargeisa',
    totalShipments: 1,
    totalSpent: amount,
    status: 'ACTIVE',
  });
}

function nextInvoiceNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `INV-${stamp}`;
}

function resolveAmountPaid(shipment: { amountPaid?: number; paidAmount?: number; payment?: string; total: number }) {
  if (shipment.amountPaid != null && shipment.amountPaid > 0) return shipment.amountPaid;
  if (shipment.paidAmount != null && shipment.paidAmount > 0) return shipment.paidAmount;
  if (shipment.payment === 'PAID') return shipment.total;
  return 0;
}

function resolvePaymentStatus(
  shipment: { paymentStatus?: string; payment?: string },
  amountPaid: number,
  total: number
): 'UNPAID' | 'PARTIAL' | 'PAID' {
  if (shipment.paymentStatus && ['UNPAID', 'PARTIAL', 'PAID'].includes(shipment.paymentStatus)) {
    return shipment.paymentStatus as 'UNPAID' | 'PARTIAL' | 'PAID';
  }
  if (shipment.payment === 'PAID' || amountPaid >= total - 0.01) return 'PAID';
  if (amountPaid > 0) return 'PARTIAL';
  return 'UNPAID';
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { shipmentId, phone, paymentMethod, paymentDate, paymentType, amountPaid: amountPaidInput } = body as {
      shipmentId?: string;
      phone?: string;
      paymentMethod?: string;
      paymentDate?: string;
      paymentType?: 'FULL' | 'PARTIAL';
      amountPaid?: number;
    };

    if (!shipmentId || !phone?.trim()) {
      return NextResponse.json({ error: 'Shipment ID and customer phone are required' }, { status: 400 });
    }
    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 });
    }
    if (!paymentDate) {
      return NextResponse.json({ error: 'Payment date is required' }, { status: 400 });
    }
    if (!paymentType || !['FULL', 'PARTIAL'].includes(paymentType)) {
      return NextResponse.json({ error: 'Payment type must be FULL or PARTIAL' }, { status: 400 });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const previouslyPaid = resolveAmountPaid(shipment);
    const currentStatus = resolvePaymentStatus(shipment, previouslyPaid, shipment.total);

    if (currentStatus === 'PAID') {
      return NextResponse.json({ error: 'This shipment is already paid in full' }, { status: 400 });
    }

    const lineItems = buildShipmentInvoiceItems({
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
    const subtotal = lineItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const totalDue = shipment.total;
    const balanceBefore = Math.max(0, totalDue - previouslyPaid);

    if (balanceBefore <= 0) {
      shipment.paymentStatus = 'PAID';
      shipment.payment = 'PAID';
      shipment.amountPaid = totalDue;
      shipment.paidAmount = totalDue;
      await shipment.save();
      return NextResponse.json({ error: 'Nothing left to pay on this shipment' }, { status: 400 });
    }

    let thisPayment = 0;
    if (paymentType === 'FULL') {
      thisPayment = balanceBefore;
    } else {
      thisPayment = Number(amountPaidInput) || 0;
      if (thisPayment <= 0) {
        return NextResponse.json({ error: 'Enter an amount greater than zero for partial payment' }, { status: 400 });
      }
      if (thisPayment > balanceBefore + 0.001) {
        return NextResponse.json(
          { error: `Partial amount cannot exceed balance due ($${balanceBefore.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    const newTotalPaid = previouslyPaid + thisPayment;
    const balanceDue = Math.max(0, totalDue - newTotalPaid);
    const isPaidInFull = balanceDue < 0.01;

    const goodsSummary = shipment.shipmentNumber;

    const customer = await upsertCustomer(shipment.customer, phone.trim(), thisPayment);

    const user = await getSessionUser();

    shipment.phone = phone.trim();
    shipment.amountPaid = newTotalPaid;
    shipment.paidAmount = newTotalPaid;
    shipment.paymentStatus = isPaidInFull ? 'PAID' : 'PARTIAL';
    shipment.payment = isPaidInFull ? 'PAID' : 'UNPAID';
    shipment.paymentMethod = paymentMethod;
    // Record who took this payment (for the HR scoreboard).
    shipment.payments = shipment.payments || [];
    shipment.payments.push({
      amount: thisPayment,
      by: user ? { id: user.id, name: user.name } : { id: '', name: 'Unknown' },
      method: paymentMethod,
      at: new Date(),
    });
    await shipment.save();

    const invoiceNumber = nextInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      customerId: customer._id,
      customerName: shipment.customer,
      customerPhone: phone.trim(),
      shipmentId: shipment._id,
      items: lineItems,
      goodsSummary,
      freightType: shipment.type,
      subtotal,
      totalAmount: totalDue,
      amountPaid: thisPayment,
      balanceDue: isPaidInFull ? 0 : balanceDue,
      currency: 'USD',
      paymentMethod,
      paymentDate,
      paymentStatus: isPaidInFull ? 'PAID' : 'PARTIAL',
      notes: `${paymentType === 'FULL' ? 'Full' : 'Partial'} payment for shipment ${shipment.shipmentNumber} (${shipment.date})`,
    });

    const methodLabel = paymentMethod.replace(/_/g, ' ');
    const paymentStatusLine = isPaidInFull
      ? 'PAID IN FULL'
      : `Partial — paid $${thisPayment.toFixed(2)}, balance $${balanceDue.toFixed(2)}`;

    const caption = `Asc ${shipment.customer}, mahadsanid! ${BRAND_NAME} receipt ${invoiceNumber} (${shipment.shipmentNumber}). ${methodLabel}, ${paymentDate}. ${paymentStatusLine}. Total $${totalDue.toFixed(2)} USD (${shipment.type}). Mahadsanid!`;

    const delivery = await deliverReceiptWhatsApp({
      phone: phone.trim(),
      invoiceNumber,
      invoiceId: String(invoice._id),
      caption,
      receiptData: {
        invoiceNumber,
        customerName: shipment.customer,
        customerPhone: phone.trim(),
        paymentMethod,
        paymentDate,
        freightType: shipment.type,
        goodsSummary,
        items: lineItems,
        goods: buildShipmentGoods(shipment),
        freightSummary: [
          shipment.type === 'AIR'
            ? { label: 'Chargeable Weight', value: `${shipment.weight ?? 0} KG` }
            : { label: 'Total Volume', value: `${shipment.cbm ?? 0} CBM` },
          { label: 'Rate', value: `$${(shipment.rate ?? 0).toFixed(2)} / ${shipment.type === 'AIR' ? 'KG' : 'CBM'}` },
          { label: 'Batch', value: shipment.batch || 'UNASSIGNED' },
        ],
        subtotal,
        totalAmount: totalDue,
        amountPaid: thisPayment,
        balanceDue: isPaidInFull ? 0 : balanceDue,
        paymentStatus: isPaidInFull ? 'PAID' : 'PARTIAL',
        quotationDate: shipment.date,
        shipmentNumber: shipment.shipmentNumber,
        dateLabel: 'Shipment Date',
        itemsTitle: 'Shipment Charges',
      },
    });

    if (delivery.pdfUrl) {
      invoice.receiptPdfUrl = delivery.pdfUrl;
      await invoice.save();
    }

    const receiptUrl = delivery.pdfUrl || `/api/invoices/${invoice._id}/pdf`;

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment._id,
        payment: shipment.payment,
        paymentStatus: shipment.paymentStatus,
        amountPaid: shipment.amountPaid,
        balanceDue,
      },
      customer: { id: customer._id, name: customer.name, phone: customer.phone },
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        paymentStatus: invoice.paymentStatus,
      },
      receiptUrl,
      receiptPdfUrl: delivery.pdfUrl,
      pdfSent: delivery.pdfAttached,
      whatsappSent: delivery.whatsappSent,
      whatsappError: delivery.pdfAttached ? undefined : delivery.error,
      deliverySteps: delivery.steps,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('shipment record-payment error:', err);
    return NextResponse.json({ error: 'Failed to record payment', details: message }, { status: 500 });
  }
}
