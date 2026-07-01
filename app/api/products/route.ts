// app/api/products/route.ts
// Distinct product-name suggestions for the shipment pricing/cargo dropdowns.
// Built from names already used across shipments (priced lines, cargo items,
// courier packages) so the list grows automatically as staff enter shipments.
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Shipment from '@/lib/models/Shipment';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const [priced, items, goods] = await Promise.all([
      Shipment.distinct('priceLines.product'),
      Shipment.distinct('items.description'),
      Shipment.distinct('courierPackages.goods'),
    ]);

    const seen = new Map<string, string>(); // lowercased -> original casing
    for (const name of [...priced, ...items, ...goods]) {
      const clean = typeof name === 'string' ? name.trim() : '';
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) seen.set(key, clean);
    }

    const products = [...seen.values()].sort((a, b) => a.localeCompare(b));
    return NextResponse.json(products);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching products:', err);
    return NextResponse.json({ error: 'Failed to fetch products', details: message }, { status: 500 });
  }
}
