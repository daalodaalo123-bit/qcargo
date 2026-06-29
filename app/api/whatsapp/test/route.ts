import { NextResponse } from 'next/server';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';
import { getSessionUser } from '@/lib/sessionUser';

export const dynamic = 'force-dynamic';

// Fires the universal pre-approved "hello_world" template so the office can
// confirm the connection works without needing their own templates approved yet.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { phone } = await request.json();
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ success: false, error: 'Recipient phone number is required.' }, { status: 400 });
    }
    const result = await sendWhatsAppTemplate(String(phone), 'hello_world', 'en_US');
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
