/** Somalia WhatsApp: 252 + 9-digit mobile (e.g. 252633901811). */
const SOMALIA_WHATSAPP_REGEX = /^252[1-9][0-9]{8}$/;

export type PhoneFormatResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

/** Normalize to 252XXXXXXXXX for WAWP chatId, with validation. */
export function formatSomaliaWhatsAppPhone(rawPhone: string): PhoneFormatResult {
  let digits = rawPhone.trim().replace(/\D/g, '');

  if (!digits) {
    return { ok: false, error: 'Phone number is required (e.g. +252 63 390 1811 or 0633901811)' };
  }

  if (digits.startsWith('00')) {
    digits = digits.replace(/^0+/, '');
  }

  if (digits.startsWith('252')) {
    // Fix 2520633901811 → 252633901811 (extra 0 after country code)
    if (digits.length === 13 && digits[3] === '0') {
      digits = '252' + digits.slice(4);
    }
    // Fix double country code 252252633...
    if (digits.startsWith('252252')) {
      digits = digits.slice(3);
    }
  } else if (digits.startsWith('0')) {
    digits = '252' + digits.slice(1);
  } else if (digits.length === 9) {
    digits = '252' + digits;
  } else if (digits.length === 10) {
    // 10 digits without leading 0: use last 9 (avoid 252 + 10 = 13 digits → WAWP "Unknown")
    digits = '252' + digits.slice(-9);
  } else if (digits.length === 7) {
    digits = '25263' + digits;
  }

  if (!SOMALIA_WHATSAPP_REGEX.test(digits)) {
    return {
      ok: false,
      error: `Invalid Somalia number "${rawPhone.trim()}". Use +252 63xxxxxxx or 063xxxxxxx (12 digits: 252 + 9-digit mobile).`,
    };
  }

  return { ok: true, phone: digits };
}

/** @deprecated Prefer formatSomaliaWhatsAppPhone — returns digits or empty string. */
export function normalizePhone(rawPhone: string): string {
  const result = formatSomaliaWhatsAppPhone(rawPhone);
  return result.ok ? result.phone : '';
}

function wawpCredentials() {
  const instanceId = process.env.WAWP_INSTANCE_ID;
  const accessToken = process.env.WAWP_ACCESS_TOKEN;
  if (!instanceId || !accessToken) {
    return null;
  }
  return { instanceId, accessToken };
}

/** True when WAWP response includes an outgoing document (not plain text). */
export function wawpResponseHasPdfDocument(data: Record<string, unknown>): boolean {
  const raw = JSON.stringify(data);
  return raw.includes('documentMessage') || raw.includes('documentWithCaptionMessage');
}

function wawpErrorMessage(data: Record<string, unknown>): string {
  const exc = data.exception as Record<string, unknown> | undefined;
  const raw = exc?.message || data.message || data.error || 'WAWP request failed';
  const msg = String(raw);
  if (msg.includes('463')) {
    return 'Number not reachable on WhatsApp (error 463). The customer may not have WhatsApp on this number, or has blocked unknown senders. Please verify their number.';
  }
  return msg;
}

function parseWawpResponse(data: Record<string, unknown>, httpOk: boolean): { success: boolean; error?: string } {
  if (!httpOk) {
    return { success: false, error: wawpErrorMessage(data) };
  }
  if (data.success === false) {
    return { success: false, error: wawpErrorMessage(data) };
  }
  if (typeof data.id === 'string' && data.id.length > 0) {
    return { success: true };
  }
  if (data.error) {
    return { success: false, error: String(data.error) };
  }
  return { success: httpOk };
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const creds = wawpCredentials();
  if (!creds) {
    return { success: false, error: 'WAWP credentials missing in environment' };
  }

  const { instanceId, accessToken } = creds;
  const formatted = formatSomaliaWhatsAppPhone(to);
  if (!formatted.ok) {
    return { success: false, error: formatted.error };
  }
  const chatId = `${formatted.phone}@c.us`;

  try {
    const response = await fetch('https://api.wawp.net/v2/send/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: instanceId,
        access_token: accessToken,
        chatId,
        message,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    const parsed = parseWawpResponse(data, response.ok);
    if (!parsed.success) {
      console.error('WAWP text error:', data);
      return { success: false, error: parsed.error };
    }
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: message };
  }
}

export interface SendWhatsAppPdfOptions {
  to: string;
  pdfUrl: string;
  filename: string;
  caption: string;
}

async function wawpSendPdfRequest(
  creds: { instanceId: string; accessToken: string },
  chatId: string,
  pdfUrl: string,
  filename: string,
  caption: string,
  useQueryParams: boolean
) {
  const fields = {
    instance_id: creds.instanceId,
    access_token: creds.accessToken,
    chatId,
    'file[url]': pdfUrl,
    'file[filename]': filename,
    'file[mimetype]': 'application/pdf',
    caption,
  };

  if (useQueryParams) {
    const query = new URLSearchParams(fields);
    return fetch(`https://api.wawp.net/v2/send/pdf?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  }

  const query = new URLSearchParams({
    instance_id: creds.instanceId,
    access_token: creds.accessToken,
  });
  return fetch(`https://api.wawp.net/v2/send/pdf?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

/** Send a PDF document via WAWP (requires a public HTTPS URL to the file). */
export async function sendWhatsAppPdf(options: SendWhatsAppPdfOptions) {
  const creds = wawpCredentials();
  if (!creds) {
    return { success: false, error: 'WAWP credentials missing in environment' };
  }

  if (!options.pdfUrl.startsWith('https://')) {
    return { success: false, error: 'PDF URL must be a public HTTPS link (not localhost)' };
  }

  const formatted = formatSomaliaWhatsAppPhone(options.to);
  if (!formatted.ok) {
    return { success: false, error: formatted.error };
  }
  const chatId = `${formatted.phone}@c.us`;
  const filename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  const caption = options.caption.slice(0, 900);

  // JSON body first — long captions + Cloudinary URLs can exceed query-string limits.
  const attempts = [
    { label: 'json', useQueryParams: false },
    { label: 'query', useQueryParams: true },
  ];

  let lastError = 'Failed to send PDF via WAWP';

  for (const attempt of attempts) {
    try {
      const response = await wawpSendPdfRequest(
        creds,
        chatId,
        options.pdfUrl,
        filename,
        caption,
        attempt.useQueryParams
      );
      const data = (await response.json()) as Record<string, unknown>;
      const parsed = parseWawpResponse(data, response.ok);

      if (parsed.success && wawpResponseHasPdfDocument(data)) {
        return { success: true, data, method: attempt.label };
      }

      if (parsed.success && !wawpResponseHasPdfDocument(data)) {
        lastError = 'WAWP accepted request but response was not a PDF document';
        console.error(`WAWP PDF no document in response (${attempt.label}):`, data);
        continue;
      }

      lastError = parsed.error || lastError;
      console.error(`WAWP PDF error (${attempt.label}):`, data);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : 'Network error';
      console.error(`WAWP PDF request failed (${attempt.label}):`, error);
    }
  }

  return { success: false, error: lastError };
}
