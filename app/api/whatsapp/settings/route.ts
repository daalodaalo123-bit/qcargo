import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import WhatsAppSettings from '@/lib/models/WhatsAppSettings';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

// Returns config with the token MASKED — never sends the raw secret to the browser.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const s = await WhatsAppSettings.findOne({});
    return NextResponse.json({
      phoneNumberId: s?.phoneNumberId || '',
      wabaId: s?.wabaId || '',
      apiVersion: s?.apiVersion || 'v21.0',
      enabled: s?.enabled || false,
      senderLabel: s?.senderLabel || '',
      templateLang: s?.templateLang || 'en_US',
      invoiceTemplate: s?.invoiceTemplate || '',
      quotationTemplate: s?.quotationTemplate || '',
      otpTemplate: s?.otpTemplate || '',
      tokenSet: !!s?.accessToken,
      tokenPreview: s?.accessToken ? `…${s.accessToken.slice(-6)}` : '',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load WhatsApp settings', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();

    const update: Record<string, unknown> = {
      phoneNumberId: (body.phoneNumberId || '').trim(),
      wabaId: (body.wabaId || '').trim(),
      apiVersion: (body.apiVersion || 'v21.0').trim(),
      enabled: !!body.enabled,
      senderLabel: (body.senderLabel || '').trim(),
      templateLang: (body.templateLang || 'en_US').trim(),
      invoiceTemplate: (body.invoiceTemplate || '').trim(),
      quotationTemplate: (body.quotationTemplate || '').trim(),
      otpTemplate: (body.otpTemplate || '').trim(),
    };
    // Only overwrite the token when a new non-empty one is provided (blank = keep existing).
    if (typeof body.accessToken === 'string' && body.accessToken.trim()) {
      update.accessToken = body.accessToken.trim();
    }

    const s = await WhatsAppSettings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
    return NextResponse.json({
      success: true,
      phoneNumberId: s.phoneNumberId,
      wabaId: s.wabaId,
      apiVersion: s.apiVersion,
      enabled: s.enabled,
      senderLabel: s.senderLabel,
      templateLang: s.templateLang,
      invoiceTemplate: s.invoiceTemplate,
      quotationTemplate: s.quotationTemplate,
      otpTemplate: s.otpTemplate,
      tokenSet: !!s.accessToken,
      tokenPreview: s.accessToken ? `…${s.accessToken.slice(-6)}` : '',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save WhatsApp settings', details: message }, { status: 500 });
  }
}
