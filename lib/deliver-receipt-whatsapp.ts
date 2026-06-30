import { generateReceiptPdf, type ReceiptData } from '@/lib/generate-receipt-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';
import { sendWhatsAppMessage, sendWhatsAppPdf, sendDocumentTemplate, getWhatsAppConfig } from '@/lib/whatsapp';

export interface DeliverReceiptInput {
  phone: string;
  receiptData: ReceiptData;
  invoiceNumber: string;
  invoiceId?: string;
  caption: string;
  // Body variables for the approved invoice template, in template order
  // ({{1}} name, {{2}} invoice#, {{3}} amount). If omitted, sensible defaults
  // are derived from receiptData.
  templateParams?: string[];
}

export interface DeliverReceiptResult {
  pdfUrl?: string;
  pdfAttached: boolean;
  whatsappSent: boolean;
  error?: string;
  steps: { step: string; ok: boolean; detail?: string }[];
}

async function assertPdfUrlReachable(pdfUrl: string): Promise<void> {
  const res = await fetch(pdfUrl, { method: 'HEAD', redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Receipt PDF URL not reachable (${res.status}). WhatsApp cannot attach the file.`);
  }
  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    throw new Error('Receipt PDF URL returned HTML instead of a PDF file.');
  }
}

async function resolvePublicPdfUrl(
  pdfBytes: Uint8Array,
  invoiceNumber: string,
  invoiceId?: string
): Promise<string> {
  if (isCloudinaryConfigured()) {
    const url = await uploadReceiptPdf(pdfBytes, invoiceNumber);
    await assertPdfUrlReachable(url);
    return url;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (appUrl?.startsWith('https://') && invoiceId) {
    const url = `${appUrl}/api/invoices/${invoiceId}/pdf`;
    await assertPdfUrlReachable(url);
    return url;
  }

  throw new Error(
    'Configure Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) on the server so WhatsApp can download the receipt PDF.'
  );
}

export async function deliverReceiptWhatsApp(input: DeliverReceiptInput): Promise<DeliverReceiptResult> {
  const steps: DeliverReceiptResult['steps'] = [];
  let pdfBytes: Uint8Array;

  try {
    pdfBytes = await generateReceiptPdf(input.receiptData);
    steps.push({ step: 'generate_pdf', ok: true, detail: `${pdfBytes.length} bytes` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF generation failed';
    steps.push({ step: 'generate_pdf', ok: false, detail: msg });
    return { pdfAttached: false, whatsappSent: false, error: msg, steps };
  }

  let pdfUrl: string;
  try {
    pdfUrl = await resolvePublicPdfUrl(pdfBytes, input.invoiceNumber, input.invoiceId);
    steps.push({ step: 'upload_pdf', ok: true, detail: pdfUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF upload failed';
    steps.push({ step: 'upload_pdf', ok: false, detail: msg });
    return { pdfAttached: false, whatsappSent: false, error: msg, steps };
  }

  // PRODUCTION PATH: if an approved invoice template is configured, send via
  // template so it works 24/7 (outside the 24-hour window). The PDF rides in
  // the template's document header.
  const cfg = await getWhatsAppConfig();
  if (cfg?.invoiceTemplate) {
    const bodyParams = input.templateParams ?? [
      input.receiptData.customerName,
      input.invoiceNumber,
      `$${(input.receiptData.totalAmount || 0).toFixed(2)}`,
    ];
    const tpl = await sendDocumentTemplate({
      to: input.phone,
      templateName: cfg.invoiceTemplate,
      lang: cfg.templateLang,
      pdfUrl,
      filename: `${input.invoiceNumber}.pdf`,
      bodyParams,
    });
    if (tpl.success) {
      steps.push({ step: 'whatsapp_template', ok: true, detail: cfg.invoiceTemplate });
      return { pdfUrl, pdfAttached: true, whatsappSent: true, steps };
    }
    steps.push({ step: 'whatsapp_template', ok: false, detail: tpl.error });
    // fall through to the 24-hour raw-PDF path below
  }

  const pdfResult = await sendWhatsAppPdf({
    to: input.phone,
    pdfUrl,
    filename: `${input.invoiceNumber}.pdf`,
    caption: input.caption,
  });

  if (pdfResult.success) {
    steps.push({ step: 'whatsapp_pdf', ok: true, detail: 'method=' + (pdfResult as { method?: string }).method });
    return { pdfUrl, pdfAttached: true, whatsappSent: true, steps };
  }

  const error = pdfResult.error || 'WhatsApp PDF send failed';
  steps.push({ step: 'whatsapp_pdf', ok: false, detail: error });

  const fallbackText = `${input.caption}\n\nReceipt PDF: ${pdfUrl}`;
  const textResult = await sendWhatsAppMessage(input.phone, fallbackText);
  steps.push({
    step: 'whatsapp_text_fallback',
    ok: textResult.success,
    detail: textResult.success ? 'Link sent in text' : textResult.error,
  });

  return {
    pdfUrl,
    pdfAttached: false,
    whatsappSent: textResult.success,
    error,
    steps,
  };
}
