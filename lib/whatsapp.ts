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

// ─── WhatsApp sending (Meta API — not yet configured) ────────────────────────
// These functions are stubs. When the Meta WhatsApp Business API credentials
// are added, replace the body of each function with the real implementation.

export async function sendWhatsAppMessage(to: string, message: string) {
  console.warn('[WhatsApp] sendWhatsAppMessage called but Meta API is not yet configured. to:', to);
  return { success: false, error: 'WhatsApp API not yet configured. Contact office to set up Meta API.' };
}

export interface SendWhatsAppPdfOptions {
  to: string;
  pdfUrl: string;
  filename: string;
  caption: string;
}

export async function sendWhatsAppPdf(options: SendWhatsAppPdfOptions) {
  console.warn('[WhatsApp] sendWhatsAppPdf called but Meta API is not yet configured. to:', options.to);
  return { success: false, error: 'WhatsApp API not yet configured. Contact office to set up Meta API.' };
}
