import { sendWhatsAppMessage, sendWhatsAppPdf } from '@/lib/whatsapp';

// Sends an already-hosted contract PDF to the customer over WhatsApp.
// There is no approved "contract" template yet, so this uses the raw-document
// path (works inside the 24h customer window) and falls back to a text link.
// When a `contract_ready` template is approved later, add a template path here
// mirroring deliverQuotationWhatsApp.

export interface DeliverContractInput {
  phone: string;
  pdfUrl: string;
  filename: string;
  caption: string;
}

export interface DeliverContractResult {
  pdfSent: boolean;
  whatsappSent: boolean;
  error?: string;
  steps: { step: string; ok: boolean; detail?: string }[];
}

export async function deliverContractWhatsApp(input: DeliverContractInput): Promise<DeliverContractResult> {
  const steps: DeliverContractResult['steps'] = [];
  const { phone, pdfUrl, filename, caption } = input;

  const pdfResult = await sendWhatsAppPdf({ to: phone, pdfUrl, filename, caption });
  if (pdfResult.success) {
    steps.push({ step: 'whatsapp_pdf', ok: true });
    return { pdfSent: true, whatsappSent: true, steps };
  }
  steps.push({ step: 'whatsapp_pdf', ok: false, detail: pdfResult.error });

  const textResult = await sendWhatsAppMessage(phone, `${caption}\n\nAgreement PDF: ${pdfUrl}`);
  steps.push({
    step: 'whatsapp_text_fallback',
    ok: textResult.success,
    detail: textResult.success ? 'Link sent in text' : textResult.error,
  });

  return {
    pdfSent: false,
    whatsappSent: textResult.success,
    error: textResult.success ? undefined : (textResult.error || pdfResult.error),
    steps,
  };
}
