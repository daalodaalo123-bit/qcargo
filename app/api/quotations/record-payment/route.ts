import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Quotation from '@/lib/models/Quotation';
import Customer from '@/lib/models/Customer';
import Invoice from '@/lib/models/Invoice';
import { deliverReceiptWhatsApp } from '@/lib/deliver-receipt-whatsapp';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAYMENT_METHODS = ['ZAAD', 'EDAHAB', 'WAAFI', 'CASH', 'OTHER'] as const;

function buildInvoiceItems(quotation: {
  items?: { description: string; qty?: number; price?: number }[];
  goods?: string;
  price: number;
}) {
  if (quotation.items && quotation.items.length > 0) {
    return quotation.items.map((it) => {
      const qty = it.qty ?? 1;
      const price = it.price ?? 0;
      return {
        description: it.description,
        qty,
        price,
        lineTotal: qty * price,
      };
    });
  }
  return [
    {
      description: quotation.goods || 'Cargo services',
      qty: 1,
      price: quotation.price,
      lineTotal: quotation.price,
    },
  ];
}

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
    totalShipments: 0,
    totalSpent: amount,
    status: 'ACTIVE',
  });
}

function nextInvoiceNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `INV-${stamp}`;
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { quotationId, phone, paymentMethod, paymentDate, paymentType, amountPaid: amountPaidInput, discountAmount: discountInput } = body as {
      quotationId?: string;
      phone?: string;
      paymentMethod?: string;
      paymentDate?: string;
      paymentType?: 'FULL' | 'PARTIAL';
      amountPaid?: number;
      discountAmount?: number;
    };

    if (!quotationId || !phone?.trim()) {
      return NextResponse.json({ error: 'Quotation ID and customer phone are required' }, { status: 400 });
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

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    if (quotation.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'This quotation is already paid in full' }, { status: 400 });
    }

    const lineItems = buildInvoiceItems(quotation);
    const subtotal = lineItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const discountApplied = Math.max(0, Number(discountInput) || 0);
    const totalDue = Math.max(0, quotation.price - discountApplied);
    const previouslyPaid = quotation.amountPaid || 0;
    const balanceBefore = Math.max(0, totalDue - previouslyPaid);

    if (balanceBefore <= 0) {
      quotation.paymentStatus = 'PAID';
      await quotation.save();
      return NextResponse.json({ error: 'Nothing left to pay on this quotation' }, { status: 400 });
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

    const customer = await upsertCustomer(quotation.customer, phone.trim(), thisPayment);

    quotation.status = 'APPROVED';
    quotation.phone = phone.trim();
    quotation.amountPaid = newTotalPaid;
    quotation.paymentStatus = isPaidInFull ? 'PAID' : 'PARTIAL';
    if (discountApplied > 0) {
      quotation.price = totalDue;
      quotation.discountAmount = (quotation.discountAmount || 0) + discountApplied;
    }
    await quotation.save();

    const invoiceNumber = nextInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      customerId: customer._id,
      customerName: quotation.customer,
      customerPhone: phone.trim(),
      quotationId: quotation._id,
      items: lineItems,
      goodsSummary: quotation.goods,
      freightType: quotation.type,
      subtotal: totalDue,
      totalAmount: totalDue,
      amountPaid: thisPayment,
      balanceDue: isPaidInFull ? 0 : balanceDue,
      currency: 'USD',
      paymentMethod,
      paymentDate,
      paymentStatus: isPaidInFull ? 'PAID' : 'PARTIAL',
      notes: `${paymentType === 'FULL' ? 'Full' : 'Partial'} payment for quotation dated ${quotation.date}${discountApplied > 0 ? ` · Discount applied: $${discountApplied.toFixed(2)}` : ''}`,
    });

    const methodLabel = paymentMethod.replace(/_/g, ' ');
    const paymentStatusLine = isPaidInFull
      ? 'PAID IN FULL'
      : `Partial — paid $${thisPayment.toFixed(2)}, balance $${balanceDue.toFixed(2)}`;

    const caption = `Asc ${quotation.customer}, mahadsanid! ${BRAND_NAME} receipt ${invoiceNumber}. ${methodLabel}, ${paymentDate}. ${paymentStatusLine}. Total $${totalDue.toFixed(2)} USD (${quotation.type}). Mahadsanid!`;

    const delivery = await deliverReceiptWhatsApp({
      phone: phone.trim(),
      invoiceNumber,
      invoiceId: String(invoice._id),
      caption,
      receiptData: {
        invoiceNumber,
        customerName: quotation.customer,
        customerPhone: phone.trim(),
        paymentMethod,
        paymentDate,
        freightType: quotation.type,
        goodsSummary: quotation.goods,
        items: lineItems,
        subtotal: totalDue,
        totalAmount: totalDue,
        amountPaid: thisPayment,
        balanceDue: isPaidInFull ? 0 : balanceDue,
        paymentStatus: isPaidInFull ? 'PAID' : 'PARTIAL',
        quotationDate: quotation.date,
      },
    });

    if (delivery.pdfUrl) {
      invoice.receiptPdfUrl = delivery.pdfUrl;
      await invoice.save();
    }

    const publicPdfUrl = delivery.pdfUrl;
    const pdfAttached = delivery.pdfAttached;
    const whatsappSent = delivery.whatsappSent;
    const whatsappError = delivery.error;

    console.log('Receipt WhatsApp delivery:', delivery.steps);

    const receiptUrl = publicPdfUrl || `/api/invoices/${invoice._id}/pdf`;

    return NextResponse.json({
      success: true,
      quotation: {
        id: quotation._id,
        status: quotation.status,
        paymentStatus: quotation.paymentStatus,
        amountPaid: quotation.amountPaid,
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
      receiptPdfUrl: publicPdfUrl,
      pdfSent: pdfAttached,
      whatsappSent,
      whatsappError: pdfAttached ? undefined : whatsappError,
      deliverySteps: delivery.steps,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('record-payment error:', err);
    return NextResponse.json({ error: 'Failed to record payment', details: message }, { status: 500 });
  }
}
