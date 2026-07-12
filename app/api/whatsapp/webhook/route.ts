import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import WhatsAppSettings, { IWhatsAppSettings } from '@/lib/models/WhatsAppSettings';
import {
  sendInteractiveList, sendInteractiveButtons, sendInteractiveCtaUrl,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// The main-menu rows. Titles ≤24 chars (WhatsApp list limit). Bodies live in
// Settings so the office can edit the wording; these labels are fixed.
const MENU_ROWS = [
  { id: 'opt_shipment', title: 'La Soco Shixnaddaada', description: 'Halka ay marayso shixnaddaadu' },
  { id: 'opt_products', title: 'Qiimo & Alaab', description: 'Alaab Shiinaha & qiimeyn' },
  { id: 'opt_air', title: 'Air Cargo ✈️', description: 'Xawaare badan · KG' },
  { id: 'opt_sea', title: 'Sea Cargo 🚢', description: 'Qiimo jaban · CBM' },
  { id: 'opt_about', title: 'Ku Saabsan Q Cargo', description: 'Adeegyadayada' },
  { id: 'opt_faq', title: 'FAQ', description: "Su'aalaha badan la weydiiyo" },
];

const BACK_HINT = '\n\n🔁 Si aad dib ugu noqoto, qor *Menu*.';
const BACK_BUTTON = { id: 'opt_menu', title: 'Dib u laabo' };

// ─── Webhook verification (Meta calls this once when you save the URL) ────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  await connectDB();
  const s = await WhatsAppSettings.findOne({});
  if (mode === 'subscribe' && token && s?.webhookVerifyToken && token === s.webhookVerifyToken) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ─── Incoming messages (Meta rings this every time a customer texts us) ───────
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await handleEvent(payload);
  } catch (err: unknown) {
    console.error('[WhatsApp webhook] error:', err instanceof Error ? err.message : err);
  }
  // Always 200 quickly so Meta doesn't retry/disable the webhook.
  return NextResponse.json({ received: true });
}

async function handleEvent(payload: unknown) {
  const value = (payload as never as {
    entry?: { changes?: { value?: WaValue }[] }[];
  })?.entry?.[0]?.changes?.[0]?.value;

  // Record delivery statuses (sent/delivered/read/failed) so a message that
  // Meta accepts but never delivers leaves a readable reason in the DB
  // (collection: wamessagestatuses).
  if (value?.statuses?.length) {
    await connectDB();
    const col = mongoose.connection.db!.collection('wamessagestatuses');
    for (const st of value.statuses) {
      const doc = {
        messageId: st.id || '',
        recipient: st.recipient_id || '',
        status: st.status || '',
        timestamp: st.timestamp ? new Date(Number(st.timestamp) * 1000) : new Date(),
        errors: st.errors || [],
        receivedAt: new Date(),
      };
      await col.insertOne(doc);
      if (st.status === 'failed') {
        console.error('[WhatsApp status] FAILED for', st.recipient_id, JSON.stringify(st.errors));
      }
    }
    return;
  }

  const msg = value?.messages?.[0];
  if (!msg || !value) return;

  await connectDB();
  const s = await WhatsAppSettings.findOne({});
  if (!s || !s.enabled || !s.botEnabled) return; // bot off

  // Only respond to messages that came to OUR connected number.
  if (s.phoneNumberId && value.metadata?.phone_number_id && value.metadata.phone_number_id !== s.phoneNumberId) return;

  const from = msg.from;
  if (!from) return;

  // What did they choose? (list/button reply id, else treat as "show menu")
  let selection = '';
  if (msg.type === 'interactive') {
    selection = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || '';
  }
  await routeSelection(from, selection, s);
}

async function routeSelection(from: string, selection: string, s: IWhatsAppSettings) {
  const ops = digits(s.operationNumber);
  const sales = digits(s.salesNumber);

  switch (selection) {
    case 'opt_shipment':
      return handoff(from, s.botShipmentText, 'La Hadal Hawlgalka', ops);
    case 'opt_products':
      return handoff(from, s.botProductsText, 'La Hadal Iibka', sales);
    case 'opt_air':
      return handoff(from, s.botAirText, 'Qiimaha Air Cargo', sales);
    case 'opt_sea':
      return handoff(from, s.botSeaText, 'Qiimaha Sea Cargo', sales);
    case 'opt_about':
      return sendInteractiveButtons(from, { body: s.botAboutText, buttons: [BACK_BUTTON] });
    case 'opt_faq':
      return sendInteractiveButtons(from, { body: s.botFaqText, buttons: [BACK_BUTTON] });
    case 'opt_menu':
    default:
      return sendInteractiveList(from, {
        body: s.botWelcome,
        buttonLabel: 'Dooro Adeeg',
        rows: MENU_ROWS,
      });
  }
}

// Show the info text + a tap-button that opens a chat with the right team.
// If the routing number isn't set yet, fall back to text + "back to menu".
async function handoff(from: string, body: string, displayText: string, number: string) {
  if (!number) {
    return sendInteractiveButtons(from, { body: body + BACK_HINT, buttons: [BACK_BUTTON] });
  }
  return sendInteractiveCtaUrl(from, {
    body: body + BACK_HINT,
    displayText,
    url: `https://wa.me/${number}`,
  });
}

function digits(raw: string | undefined): string {
  return (raw || '').replace(/\D/g, '');
}

// Minimal shapes of the Meta webhook payload we read.
interface WaValue {
  metadata?: { phone_number_id?: string };
  messages?: {
    from?: string;
    type?: string;
    interactive?: {
      list_reply?: { id?: string };
      button_reply?: { id?: string };
    };
  }[];
  statuses?: {
    id?: string;
    recipient_id?: string;
    status?: string;
    timestamp?: string;
    errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
  }[];
}
