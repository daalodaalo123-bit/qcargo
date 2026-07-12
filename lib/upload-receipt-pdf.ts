import cloudinary from '@/lib/cloudinary';

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/** Upload receipt PDF to Cloudinary; returns a public HTTPS URL for WhatsApp delivery. */
export async function uploadReceiptPdf(pdfBytes: Uint8Array, invoiceNumber: string): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to .env.local');
  }

  const buffer = Buffer.from(pdfBytes);
  // ".pdf" in public_id so the URL ends in .pdf and Cloudinary serves it as
  // application/pdf — required for WhatsApp document delivery. (PDF delivery
  // is enabled on this Cloudinary account; verified 2026-07-12.)
  const safeId = `${invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}.pdf`;

  const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'qcargo/receipts',
        public_id: safeId,
        access_mode: 'public',
        type: 'upload',
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult || {});
      }
    );
    upload.end(buffer);
  });

  if (!result.secure_url) {
    throw new Error('Cloudinary upload returned no URL');
  }

  return result.secure_url;
}
