export function normalizePhone(rawPhone: string): string {
  let phone = rawPhone.trim().replace(/\D/g, '');

  if (!phone) return phone;

  if (phone.startsWith('252')) {
    return phone;
  }

  if (phone.startsWith('0')) {
    return '252' + phone.substring(1);
  }

  if (phone.length === 7) {
    return '25263' + phone;
  }

  if (phone.length === 9 || phone.length === 10) {
    return '252' + phone;
  }

  return phone;
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

function parseWawpResponse(data: Record<string, unknown>, httpOk: boolean): { success: boolean; error?: string } {
  if (!httpOk) {
    const msg = (data.message || data.error || 'WAWP request failed') as string;
    return { success: false, error: msg };
  }
  if (data.success === false) {
    return { success: false, error: (data.message || data.error || 'WAWP returned failure') as string };
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
  const chatId = `${normalizePhone(to)}@c.us`;

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

  const chatId = `${normalizePhone(options.to)}@c.us`;
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
