import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface ParsedItem {
  description: string;
  qty: number;
  price: number;
  notes: string;
}

export interface ParseItemsResult {
  items: ParsedItem[];
  customerName?: string;
}

// ── Spreadsheet parser (CSV / TSV / XLS / XLSX) ──────────────────────────────

function parseSpreadsheet(buffer: Buffer): ParseItemsResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  if (rows.length === 0) return { items: [] };

  const firstRow = (rows[0] as unknown[]).map((c) => String(c ?? '').toLowerCase().trim());

  const match = (candidates: string[]) =>
    firstRow.findIndex((h) => candidates.some((c) => h.includes(c)));

  const descIdx = match(['description', 'item', 'goods', 'good', 'name', 'product', 'سلعة', 'بضاعة']);
  const qtyIdx  = match(['qty', 'quantity', 'count', 'pcs', 'units', 'كمية', 'عدد']);
  const priceIdx = match(['price', 'cost', 'rate', 'unit price', 'usd', 'amount', 'سعر', 'ثمن']);
  const notesIdx = match(['notes', 'note', 'remarks', 'description2', 'details', 'ملاحظات']);

  const hasHeaders = descIdx !== -1 || qtyIdx !== -1 || priceIdx !== -1;
  const dataStart = hasHeaders ? 1 : 0;

  const dIdx = hasHeaders ? (descIdx === -1 ? 0 : descIdx) : 0;
  const qIdx = hasHeaders ? (qtyIdx  === -1 ? 1 : qtyIdx)  : 1;
  const pIdx = hasHeaders ? (priceIdx === -1 ? 2 : priceIdx) : 2;
  const nIdx = hasHeaders ? notesIdx : -1;

  const items: ParsedItem[] = [];
  for (let r = dataStart; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const desc = String(row[dIdx] ?? '').trim();
    if (!desc) continue;

    const rawPrice = String(row[pIdx] ?? '0').replace(/[^0-9.]/g, '');
    items.push({
      description: desc,
      qty:   Math.max(1, parseFloat(String(row[qIdx] ?? '1')) || 1),
      price: parseFloat(rawPrice) || 0,
      notes: nIdx !== -1 ? String(row[nIdx] ?? '').trim() : '',
    });
  }

  return { items };
}

// ── Claude-based parser (PDF / images) ───────────────────────────────────────

const CLAUDE_PROMPT = `You are a data extraction assistant for a cargo logistics company.
Extract the list of goods/items from this document. The user wrote this list on paper or another platform.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact shape:
{
  "customerName": "string or null",
  "items": [
    { "description": "item name", "qty": 1, "price": 0.00, "notes": "" }
  ]
}

Rules:
- description: the goods/item name
- qty: numeric quantity (default 1 if not stated)
- price: numeric unit price in USD (0 if not stated)
- notes: any extra detail about the item (empty string if none)
- customerName: extract if visible in the document, otherwise null
- Include every row/line that looks like a product or goods entry
- Skip totals, subtotals, and header rows`;

async function parseWithClaude(
  buffer: Buffer,
  mimeType: string,
): Promise<ParseItemsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'PDF and image parsing requires ANTHROPIC_API_KEY in .env.local. ' +
      'CSV and Excel files work without it.',
    );
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const base64 = buffer.toString('base64');
  const isPdf = mimeType === 'application/pdf';

  const content = isPdf
    ? [
        {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
        },
        { type: 'text' as const, text: CLAUDE_PROMPT },
      ]
    : [
        {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        },
        { type: 'text' as const, text: CLAUDE_PROMPT },
      ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content }],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as { customerName?: string | null; items?: ParsedItem[] };

  return {
    customerName: parsed.customerName ?? undefined,
    items: (parsed.items ?? []).map((it) => ({
      description: String(it.description ?? '').trim(),
      qty:   Math.max(1, Number(it.qty) || 1),
      price: Number(it.price) || 0,
      notes: String(it.notes ?? '').trim(),
    })).filter((it) => it.description),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mime = file.type || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    const isSpreadsheet =
      ['csv', 'tsv', 'xlsx', 'xls'].includes(ext) ||
      mime.includes('spreadsheet') ||
      mime.includes('csv') ||
      mime === 'text/plain';

    if (isSpreadsheet) {
      const result = parseSpreadsheet(buffer);
      return NextResponse.json(result);
    }

    const isPdf = ext === 'pdf' || mime === 'application/pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mime.startsWith('image/');

    if (isPdf || isImage) {
      const effectiveMime = isPdf
        ? 'application/pdf'
        : mime.startsWith('image/')
          ? mime
          : `image/${ext}`;
      const result = await parseWithClaude(buffer, effectiveMime);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: `Unsupported file type (.${ext}). Supported: CSV, Excel, PDF, PNG, JPG, WEBP.` },
      { status: 400 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
