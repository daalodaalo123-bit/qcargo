import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const instanceId = process.env.WAWP_INSTANCE_ID;
const accessToken = process.env.WAWP_ACCESS_TOKEN;

async function main() {
  console.log('Cloudinary configured:', !!(cloudName && apiKey && apiSecret));
  console.log('WAWP configured:', !!(instanceId && accessToken));

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF',
    'utf8'
  );
  const testId = `test_${Date.now()}`;

  let pdfUrl;
  try {
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${minimalPdf.toString('base64')}`,
      {
        resource_type: 'raw',
        folder: 'qcargo/receipts',
        public_id: testId,
        access_mode: 'public',
      }
    );
    pdfUrl = result.secure_url;
    console.log('Cloudinary upload OK:', pdfUrl);

    const head = await fetch(pdfUrl, { method: 'HEAD' });
    console.log('URL reachable:', head.status, head.headers.get('content-type'));
  } catch (e) {
    console.error('Cloudinary FAILED:', e.message || e);
    process.exit(1);
  }

  const query = new URLSearchParams({ instance_id: instanceId, access_token: accessToken });
  const body = {
    chatId: '252637231015@c.us',
    'file[url]': pdfUrl,
    'file[filename]': 'test-receipt.pdf',
    'file[mimetype]': 'application/pdf',
    caption: 'Test PDF from Q CARGO',
  };

  const res = await fetch(`https://api.wawp.net/v2/send/pdf?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log('WAWP PDF status:', res.status);
  console.log('WAWP PDF response:', JSON.stringify(data, null, 2));

  const bodyWithCreds = {
    instance_id: instanceId,
    access_token: accessToken,
    ...body,
  };
  const res2 = await fetch('https://api.wawp.net/v2/send/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyWithCreds),
  });
  const data2 = await res2.json();
  console.log('WAWP PDF (creds in body) status:', res2.status);
  console.log('WAWP PDF (creds in body) response:', JSON.stringify(data2, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
