import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Contract from '@/lib/models/Contract';
import { generateContractPdf } from '@/lib/generate-contract-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';
import { deliverContractWhatsApp } from '@/lib/deliver-contract-whatsapp';
import { personalizedPdfFilename } from '@/lib/pdf-filename';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const overridePhone: string | undefined = (body as { phone?: string }).phone?.trim();

    await connectDB();
    const contract = await Contract.findById(id);
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    const phone = overridePhone || contract.phone;
    if (!phone) return NextResponse.json({ error: 'No phone number on this contract' }, { status: 400 });

    // Ensure a hosted PDF exists (older records or Cloudinary hiccups).
    let pdfUrl = contract.pdfUrl;
    if (!pdfUrl) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json({ error: 'Cloudinary not configured — cannot host the agreement PDF' }, { status: 500 });
      }
      const pdfBytes = await generateContractPdf({
        ref: contract.ref, customerName: contract.customer, customerPhone: phone,
        email: contract.email, deliveryTo: contract.deliveryTo, issuedDate: contract.issuedDate,
        freightType: contract.freightType, items: contract.items,
        subtotal: contract.subtotal, commissionRate: contract.commissionRate,
        commissionAmount: contract.commissionAmount, total: contract.total,
        amountPaid: contract.amountPaid, balanceDue: contract.balanceDue, paymentStatus: contract.paymentStatus,
      });
      pdfUrl = await uploadReceiptPdf(pdfBytes, contract.ref, 'qcargo/contracts');
      contract.pdfUrl = pdfUrl;
    }

    const caption = `Asc ${contract.customer}, ${BRAND_NAME} Cargo Service Agreement ${contract.ref}. Please review and sign. Mahadsanid!`;
    const delivery = await deliverContractWhatsApp({
      phone,
      pdfUrl,
      filename: personalizedPdfFilename(contract.customer, contract.ref),
      caption,
    });

    // Mark as SENT on successful delivery (or link fallback).
    if (delivery.pdfSent || delivery.whatsappSent) {
      contract.status = 'SENT';
      contract.sentAt = new Date();
    }
    if (overridePhone && overridePhone !== contract.phone) contract.phone = overridePhone;
    await contract.save();

    return NextResponse.json({
      success: delivery.pdfSent || delivery.whatsappSent,
      pdfSent: delivery.pdfSent,
      pdfUrl,
      deliverySteps: delivery.steps,
      error: delivery.error,
      status: contract.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
