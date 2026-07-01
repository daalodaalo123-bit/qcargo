import { generateQuotationPdf, type QuotationPdfData } from '@/lib/generate-quotation-pdf';
import { isCloudinaryConfigured, uploadReceiptPdf } from '@/lib/upload-receipt-pdf';
import { personalizedPdfFilename } from '@/lib/pdf-filename';
import { sendWhatsAppMessage, sendWhatsAppPdf, sendDocumentTemplate, getWhatsAppConfig } from '@/lib/whatsapp';

// Shared quotation-over-WhatsApp sender. Mirrors deliverReceiptWhatsApp so the
// same template → raw-PDF → text-link fallback ladder is written in ONE place
// instead of being copy-pasted into the send-whatsapp route.

export interface DeliverQuotationInput {
  phone: string;
  pdfData: QuotationPdfData;
  caption: string;
  // Body variables for the approved quotation template, in template order
  // ({{1}} name, {{2}} quote#). The total is shown inside the PDF, not in the
  // message text, so it is not a template variable. Defaults derived from pdfData.
  templateParams?: string[];
}

export interface DeliverQuotationResult {
  pdfUrl?: string;
  pdfSent: boolean;
  whatsappSent: boolean;
  viaTemplate: boolean;
  error?: string;
  steps: { step: string; ok: boolean; detail?: string }[];
}

export async function deliverQuotationWhatsApp(input: DeliverQuotationInput): Promise<DeliverQuotationResult> {
  const steps: DeliverQuotationResult['steps'] = [];
  const { pdfData, phone, caption } = input;
  const filename = personalizedPdfFilename(pdfData.customerName, pdfData.quoteNumber);

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateQuotationPdf(pdfData);
    steps.push({ step: 'generate_pdf', ok: true, detail: `${pdfBytes.length} bytes` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF generation failed';
    steps.push({ step: 'generate_pdf', ok: false, detail: msg });
    return { pdfSent: false, whatsappSent: false, viaTemplate: false, error: msg, steps };
  }

  if (!isCloudinaryConfigured()) {
    const msg = 'Cloudinary not configured — cannot host PDF for WhatsApp delivery';
    steps.push({ step: 'upload_pdf', ok: false, detail: msg });
    return { pdfSent: false, whatsappSent: false, viaTemplate: false, error: msg, steps };
  }

  let pdfUrl: string;
  try {
    pdfUrl = await uploadReceiptPdf(pdfBytes, pdfData.quoteNumber);
    steps.push({ step: 'upload_pdf', ok: true, detail: pdfUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF upload failed';
    steps.push({ step: 'upload_pdf', ok: false, detail: msg });
    return { pdfSent: false, whatsappSent: false, viaTemplate: false, error: msg, steps };
  }

  // PRODUCTION PATH: send via approved quotation template (works 24/7) when
  // configured. Template body order: {{1}} name, {{2}} quote#. The total lives
  // inside the attached PDF, so it is not sent as a text variable.
  const cfg = await getWhatsAppConfig();
  if (cfg?.quotationTemplate) {
    const bodyParams = input.templateParams ?? [
      pdfData.customerName,
      pdfData.quoteNumber,
    ];
    const tpl = await sendDocumentTemplate({
      to: phone,
      templateName: cfg.quotationTemplate,
      lang: cfg.templateLang,
      pdfUrl,
      filename,
      bodyParams,
    });
    if (tpl.success) {
      steps.push({ step: 'whatsapp_template', ok: true, detail: cfg.quotationTemplate });
      return { pdfUrl, pdfSent: true, whatsappSent: true, viaTemplate: true, steps };
    }
    steps.push({ step: 'whatsapp_template', ok: false, detail: tpl.error });
    // fall through to the 24-hour raw-PDF path below
  }

  const pdfResult = await sendWhatsAppPdf({ to: phone, pdfUrl, filename, caption });
  if (pdfResult.success) {
    steps.push({ step: 'whatsapp_pdf', ok: true });
    return { pdfUrl, pdfSent: true, whatsappSent: true, viaTemplate: false, steps };
  }
  steps.push({ step: 'whatsapp_pdf', ok: false, detail: pdfResult.error });

  // Fallback: send text with PDF link.
  const textResult = await sendWhatsAppMessage(phone, `${caption}\n\nQuotation PDF: ${pdfUrl}`);
  steps.push({
    step: 'whatsapp_text_fallback',
    ok: textResult.success,
    detail: textResult.success ? 'Link sent in text' : textResult.error,
  });

  return {
    pdfUrl,
    pdfSent: false,
    whatsappSent: textResult.success,
    viaTemplate: false,
    error: textResult.success ? undefined : (textResult.error || pdfResult.error),
    steps,
  };
}
