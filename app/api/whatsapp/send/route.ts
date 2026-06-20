import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '../../../../lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both `phone` (frontend) and legacy `to` (previous API)
    const { phone, to, message } = body as { phone?: string; to?: string; message?: string };
    const recipient = phone ?? to;
    if (!recipient || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number (phone or to) and message text are required.' },
        { status: 400 }
      );
    }

    console.log('[whatsapp/send] recipient raw:', recipient);
    const result = await sendWhatsAppMessage(recipient, message);
    console.log('[whatsapp/send] result:', result.success, result.success ? 'ok' : result.error);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error inside /api/whatsapp/send:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
