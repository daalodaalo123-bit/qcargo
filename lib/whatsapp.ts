/** Somalia phone: 252 + 9-digit mobile (e.g. 252633901811). */
const SOMALIA_WHATSAPP_REGEX = /^252[1-9][0-9]{8}$/;

export type PhoneFormatResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

/** Normalize any Somalia phone format to 252XXXXXXXXX. */
export function formatSomaliaWhatsAppPhone(rawPhone: string): PhoneFormatResult {
  let digits = rawPhone.trim().replace(/\D/g, '');

  if (!digits) {
    return { ok: false, error: 'Phone number is required (e.g. +252 63 390 1811 or 0633901811)' };
  }

  if (digits.startsWith('00')) {
    digits = digits.replace(/^0+/, '');
  }

  if (digits.startsWith('252')) {
    if (digits.length === 13 && digits[3] === '0') {
      digits = '252' + digits.slice(4);
    }
    if (digits.startsWith('252252')) {
      digits = digits.slice(3);
    }
  } else if (digits.startsWith('0')) {
    digits = '252' + digits.slice(1);
  } else if (digits.length === 9) {
    digits = '252' + digits;
  } else if (digits.length === 10) {
    digits = '252' + digits.slice(-9);
  } else if (digits.length === 7) {
    digits = '25263' + digits;
  }

  if (!SOMALIA_WHATSAPP_REGEX.test(digits)) {
    return {
      ok: false,
      error: `Invalid Somalia number "${rawPhone.trim()}". Use +252 63xxxxxxx or 063xxxxxxx.`,
    };
  }

  return { ok: true, phone: digits };
}

/** @deprecated Prefer formatSomaliaWhatsAppPhone */
export function normalizePhone(rawPhone: string): string {
  const result = formatSomaliaWhatsAppPhone(rawPhone);
  return result.ok ? result.phone : '';
}

// ─── WhatsApp sending (Meta WhatsApp Cloud API) ──────────────────────────────
// Credentials are stored in the WhatsAppSettings singleton (Settings → WhatsApp)
// and pasted by the office from the Meta for Developers dashboard.

import { connectDB } from './mongoose';
import WhatsAppSettings from './models/WhatsAppSettings';

export type WhatsAppSendResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  enabled: boolean;
  templateLang: string;
  invoiceTemplate: string;
  quotationTemplate: string;
  otpTemplate: string;
}

/** Read the stored Meta credentials (null if not configured). */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  await connectDB();
  const s = await WhatsAppSettings.findOne({});
  if (!s || !s.phoneNumberId || !s.accessToken) return null;
  return {
    phoneNumberId: s.phoneNumberId,
    accessToken: s.accessToken,
    apiVersion: s.apiVersion || 'v21.0',
    enabled: s.enabled,
    templateLang: s.templateLang || 'en_US',
    invoiceTemplate: s.invoiceTemplate || '',
    quotationTemplate: s.quotationTemplate || '',
    otpTemplate: s.otpTemplate || '',
  };
}

/** Best-effort normalize a recipient to international digits (no +). */
function normalizeRecipient(raw: string): string {
  const somali = formatSomaliaWhatsAppPhone(raw);
  if (somali.ok) return somali.phone;
  return raw.replace(/\D/g, '');
}

/** Low-level POST to the Meta Cloud API messages endpoint. */
async function postMessage(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  const cfg = await getWhatsAppConfig();
  if (!cfg) {
    return { success: false, error: 'WhatsApp is not configured yet. Go to Settings → WhatsApp and paste your Meta credentials.' };
  }
  if (!cfg.enabled) {
    return { success: false, error: 'WhatsApp sending is turned OFF. Enable it in Settings → WhatsApp.' };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Meta API error (HTTP ${res.status})`;
      console.error('[WhatsApp] send failed:', msg, data?.error);
      return { success: false, error: msg };
    }
    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error reaching Meta';
    console.error('[WhatsApp] send exception:', message);
    return { success: false, error: message };
  }
}

/** Send a plain text message (only works inside the 24h customer window). */
export async function sendWhatsAppMessage(to: string, message: string): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'text',
    text: { preview_url: true, body: message },
  });
}

/** Send a pre-approved template message (works any time). */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = 'en_US',
  components?: unknown[],
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
}

/**
 * Send a template that carries a PDF in its header (for invoices/quotations).
 * Works ANY time (template), unlike a raw document message.
 */
export async function sendDocumentTemplate(opts: {
  to: string;
  templateName: string;
  lang?: string;
  pdfUrl: string;
  filename: string;
  bodyParams: string[];
}): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(opts.to),
    type: 'template',
    template: {
      name: opts.templateName,
      language: { code: opts.lang || 'en_US' },
      components: [
        { type: 'header', parameters: [{ type: 'document', document: { link: opts.pdfUrl, filename: opts.filename } }] },
        { type: 'body', parameters: opts.bodyParams.map(t => ({ type: 'text', text: t })) },
      ],
    },
  });
}

/**
 * Send a one-time login code via an Authentication-category template.
 * Passes the code to both the body and the copy-code button.
 */
export async function sendOtpTemplate(
  to: string,
  code: string,
  templateName: string,
  lang = 'en_US',
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  });
}

// ─── Interactive messages (auto-reply robot) ────────────────────────────────
// These are session messages — they only work inside the 24h customer window,
// which is exactly when the webhook fires (the customer just messaged us).

export interface ListRow { id: string; title: string; description?: string }

/** Send a tappable list menu (the main robot menu). */
export async function sendInteractiveList(
  to: string,
  opts: { body: string; buttonLabel: string; rows: ListRow[]; sectionTitle?: string; footer?: string },
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: {
        button: opts.buttonLabel,
        sections: [{
          title: opts.sectionTitle || 'Adeegyada',
          rows: opts.rows.map(r => ({ id: r.id, title: r.title, ...(r.description ? { description: r.description } : {}) })),
        }],
      },
    },
  });
}

/** Send up to 3 quick-reply buttons (e.g. "Dib u laabo"). */
export async function sendInteractiveButtons(
  to: string,
  opts: { body: string; buttons: { id: string; title: string }[]; footer?: string },
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: { buttons: opts.buttons.slice(0, 3).map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
    },
  });
}

/** Send a single call-to-action URL button (e.g. a wa.me link that opens another chat). */
export async function sendInteractiveCtaUrl(
  to: string,
  opts: { body: string; displayText: string; url: string; footer?: string },
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: { name: 'cta_url', parameters: { display_text: opts.displayText, url: opts.url } },
    },
  });
}

export interface SendWhatsAppPdfOptions {
  to: string;
  pdfUrl: string;
  filename: string;
  caption: string;
}

/** Send a PDF document (only works inside the 24h customer window). */
export async function sendWhatsAppPdf(options: SendWhatsAppPdfOptions): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(options.to),
    type: 'document',
    document: { link: options.pdfUrl, filename: options.filename, caption: options.caption },
  });
}
