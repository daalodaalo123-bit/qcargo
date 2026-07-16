import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Contract from '@/lib/models/Contract';
import { generateContractPdf, defaultContractTerms, type ContractPdfData, type ContractTermSection } from '@/lib/generate-contract-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PayStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
function derivePayStatus(paid: number, total: number): PayStatus {
  if (paid <= 0) return 'UNPAID';
  if (paid >= total - 0.01) return 'PAID';
  return 'PARTIAL';
}

function toPdfData(c: Record<string, unknown>): ContractPdfData {
  return {
    ref: String(c.ref),
    customerName: String(c.customer || ''),
    customerPhone: String(c.phone || ''),
    email: String(c.email || ''),
    deliveryTo: String(c.deliveryTo || ''),
    deliveryPhone: String(c.deliveryPhone || ''),
    deliveryEmail: String(c.deliveryEmail || ''),
    issuedDate: String(c.issuedDate),
    quotationDate: String(c.quotationDate || ''),
    freightType: (c.freightType as 'AIR' | 'SEA') || 'SEA',
    items: (c.items as ContractPdfData['items']) || [],
    subtotal: Number(c.subtotal) || 0,
    commissionRate: Number(c.commissionRate) || 0,
    commissionAmount: Number(c.commissionAmount) || 0,
    total: Number(c.total) || 0,
    amountPaid: Number(c.amountPaid) || 0,
    balanceDue: Number(c.balanceDue) || 0,
    paymentStatus: c.paymentStatus as PayStatus,
    receiptNo: String(c.receiptNo || ''),
    paymentMethod: String(c.paymentMethod || ''),
    paymentDate: String(c.paymentDate || ''),
    terms: (c.terms as ContractTermSection[]) || [],
  };
}

// GET — one contract plus its effective terms (standard set when none were customised),
// so the editor can prefill every section.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const contract = await Contract.findById(id);
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    const defaultTerms = defaultContractTerms(toPdfData(contract.toObject()));
    return NextResponse.json({ contract, defaultTerms });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface EditBody {
  customer?: string;
  phone?: string;
  email?: string;
  deliveryTo?: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  freightType?: 'AIR' | 'SEA';
  items?: { description: string; qty: number; price: number }[];
  commissionRate?: number;
  amountPaid?: number;
  receiptNo?: string;
  paymentMethod?: string;
  paymentDate?: string;
  issuedDate?: string;
  terms?: ContractTermSection[];   // [] = back to standard terms
  notes?: string;
}

// PATCH — update status (DRAFT / SENT / SIGNED) or, with body.edit, the full
// contract content; content edits re-render and re-host the agreement PDF.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectDB();

    const update: Record<string, unknown> = {};
    if (body.status && ['DRAFT', 'SENT', 'SIGNED'].includes(body.status)) {
      update.status = body.status;
      if (body.status === 'SENT') update.sentAt = new Date();
      if (body.status === 'SIGNED') update.signedAt = new Date();
    }
    if (typeof body.notes === 'string') update.notes = body.notes;

    if (body.edit) {
      const e = body.edit as EditBody;
      const existing = await Contract.findById(id);
      if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

      const customer = (e.customer ?? existing.customer ?? '').trim();
      if (!customer) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
      const items = (e.items ?? existing.items ?? [])
        .filter((it: { description?: string }) => (it.description || '').trim())
        .map((it: { description: string; qty?: number; price?: number }) => ({
          description: it.description.trim(), qty: Number(it.qty) || 0, price: Number(it.price) || 0,
        }));
      if (items.length === 0) return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });

      const commissionRate = e.commissionRate != null ? Number(e.commissionRate) : existing.commissionRate;
      const subtotal = items.reduce((s: number, it: { qty: number; price: number }) => s + it.qty * it.price, 0);
      const commissionAmount = +(subtotal * (commissionRate / 100)).toFixed(2);
      const total = +(subtotal + commissionAmount).toFixed(2);
      const amountPaid = Math.min(Math.max(0, e.amountPaid != null ? Number(e.amountPaid) : existing.amountPaid), total);
      const balanceDue = +Math.max(0, total - amountPaid).toFixed(2);
      const paymentStatus = derivePayStatus(amountPaid, total);
      const terms = Array.isArray(e.terms)
        ? e.terms
            .map((t) => ({ heading: String(t.heading || '').trim(), body: String(t.body || '').trim() }))
            .filter((t) => t.heading || t.body)
        : existing.terms;

      Object.assign(update, {
        customer,
        phone: (e.phone ?? existing.phone ?? '').trim(),
        email: (e.email ?? existing.email ?? '').trim(),
        deliveryTo: (e.deliveryTo ?? existing.deliveryTo ?? '').trim(),
        deliveryPhone: (e.deliveryPhone ?? existing.deliveryPhone ?? '').trim(),
        deliveryEmail: (e.deliveryEmail ?? existing.deliveryEmail ?? '').trim(),
        freightType: e.freightType === 'AIR' ? 'AIR' : e.freightType === 'SEA' ? 'SEA' : existing.freightType,
        items, subtotal, commissionRate, commissionAmount, total,
        amountPaid, balanceDue, paymentStatus,
        receiptNo: (e.receiptNo ?? existing.receiptNo ?? '').trim(),
        paymentMethod: (e.paymentMethod ?? existing.paymentMethod ?? '').trim(),
        paymentDate: (e.paymentDate ?? existing.paymentDate ?? '').trim(),
        issuedDate: e.issuedDate || existing.issuedDate,
        terms,
      });

      if (isCloudinaryConfigured()) {
        const pdfBytes = await generateContractPdf(toPdfData({ ...existing.toObject(), ...update }));
        update.pdfUrl = await uploadReceiptPdf(pdfBytes, existing.ref, 'qcargo/contracts');
      }
    }

    const contract = await Contract.findByIdAndUpdate(id, update, { new: true });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json({ contract });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
