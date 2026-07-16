import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongoose';
import Contract from '@/lib/models/Contract';
import Quotation from '@/lib/models/Quotation';
import { generateContractPdf, type ContractPdfItem } from '@/lib/generate-contract-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET — full contract history, newest first.
export async function GET() {
  try {
    await connectDB();
    const contracts = await Contract.find({}).sort({ createdAt: -1 });
    return NextResponse.json(contracts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch contracts', details: message }, { status: 500 });
  }
}

interface CreateBody {
  quotationId?: string;
  customer?: string;
  phone?: string;
  email?: string;
  deliveryTo?: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  freightType?: 'AIR' | 'SEA';
  items?: ContractPdfItem[];
  commissionRate?: number;
  amountPaid?: number;
  receiptNo?: string;
  paymentMethod?: string;
  paymentDate?: string;
  issuedDate?: string;
  notes?: string;
}

type PayStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
function derivePayStatus(paid: number, total: number): PayStatus {
  if (paid <= 0) return 'UNPAID';
  if (paid >= total - 0.01) return 'PAID';
  return 'PARTIAL';
}

// POST — create a contract (from a quotation OR standalone), render + host its PDF.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateBody;
    await connectDB();

    const today = new Date().toISOString().slice(0, 10);
    let ref: string;
    let customer: string;
    let phone: string;
    let freightType: 'AIR' | 'SEA';
    let items: ContractPdfItem[];
    let subtotal: number;
    let commissionRate: number;
    let commissionAmount: number;
    let total: number;
    let amountPaid: number;
    let quotationId: string | null = null;
    let quotationDate = '';

    // Rebuild fully from the quotation only when the caller sends no line items
    // (the "Generate Contract" button). The New Contract modal sends its own
    // items even when it loaded them from a quotation, so edits are respected.
    const rebuildFromQuote = !!body.quotationId && (!body.items || body.items.length === 0);

    if (rebuildFromQuote) {
      const q = await Quotation.findById(body.quotationId);
      if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      ref = `QT-${String(q._id).slice(-8).toUpperCase()}`;

      // Idempotent: one quotation → one contract. Return the existing one if present.
      const existing = await Contract.findOne({ ref });
      if (existing) return NextResponse.json({ contract: existing, existed: true });

      quotationId = String(q._id);
      customer = q.customer;
      phone = q.phone || body.phone || '';
      freightType = (q.type as 'AIR' | 'SEA') || 'SEA';
      items = (q.items || []).map((it: { description: string; qty?: number; price?: number }) => ({
        description: it.description,
        qty: it.qty ?? 1,
        price: it.price ?? 0,
      }));
      total = q.price || 0;
      commissionRate = q.commissionRate ?? 10;
      commissionAmount = q.commissionAmount ?? 0;
      subtotal = Math.max(0, total - commissionAmount);
      amountPaid = Math.min(q.amountPaid || 0, total);
      quotationDate = q.date || '';
    } else {
      customer = (body.customer || '').trim();
      if (!customer) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
      phone = (body.phone || '').trim();
      freightType = body.freightType === 'AIR' ? 'AIR' : 'SEA';
      items = (body.items || [])
        .filter((it) => (it.description || '').trim())
        .map((it) => ({ description: it.description.trim(), qty: Number(it.qty) || 0, price: Number(it.price) || 0 }));
      if (items.length === 0) return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
      commissionRate = body.commissionRate != null ? Number(body.commissionRate) : 10;
      subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
      commissionAmount = +(subtotal * (commissionRate / 100)).toFixed(2);
      total = +(subtotal + commissionAmount).toFixed(2);
      amountPaid = Math.min(Math.max(0, Number(body.amountPaid) || 0), total);
      quotationId = body.quotationId || null;   // optional link (contract loaded from a quotation)
      if (quotationId) {
        const q = await Quotation.findById(quotationId).select('date');
        quotationDate = q?.date || '';
      }
      ref = `QC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const balanceDue = +Math.max(0, total - amountPaid).toFixed(2);
    const paymentStatus = derivePayStatus(amountPaid, total);
    const issuedDate = body.issuedDate || today;

    // Render the agreement PDF and host it (for download + WhatsApp delivery).
    let pdfUrl = '';
    if (isCloudinaryConfigured()) {
      const pdfBytes = await generateContractPdf({
        ref, customerName: customer, customerPhone: phone,
        email: body.email, deliveryTo: body.deliveryTo,
        deliveryPhone: body.deliveryPhone, deliveryEmail: body.deliveryEmail,
        issuedDate, quotationDate, freightType, items, subtotal, commissionRate, commissionAmount, total,
        amountPaid, balanceDue, paymentStatus,
        receiptNo: body.receiptNo, paymentMethod: body.paymentMethod, paymentDate: body.paymentDate,
      });
      pdfUrl = await uploadReceiptPdf(pdfBytes, ref, 'qcargo/contracts');
    }

    const contract = await Contract.create({
      ref, quotationId, customer, phone,
      email: body.email || '', deliveryTo: body.deliveryTo || '',
      deliveryPhone: body.deliveryPhone || '', deliveryEmail: body.deliveryEmail || '',
      freightType, items, subtotal, commissionRate, commissionAmount, total,
      amountPaid, balanceDue, paymentStatus,
      receiptNo: body.receiptNo || '', paymentMethod: body.paymentMethod || '', paymentDate: body.paymentDate || '',
      issuedDate, quotationDate, status: 'DRAFT', pdfUrl, notes: body.notes || '',
    });

    return NextResponse.json({ contract, existed: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create contract', details: message }, { status: 500 });
  }
}

// DELETE ?id=
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    const deleted = await Contract.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete contract', details: message }, { status: 500 });
  }
}
