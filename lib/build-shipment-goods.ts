import type { PdfGood } from '@/lib/pdf-goods-section';

/** Combine measured/entered weight + CBM into a short "· 12 KG · 0.8 CBM" detail. */
function measure(weight?: number, cbm?: number): string | undefined {
  const parts: string[] = [];
  if (weight && weight > 0) parts.push(`${weight} KG`);
  if (cbm && cbm > 0) parts.push(`${cbm} CBM`);
  return parts.length ? parts.join(' · ') : undefined;
}

type GoodsSource = {
  items?: {
    description?: string;
    qty?: number;
    weight?: number;
    cbm?: number;
    measuredWeight?: number;
    measuredCbm?: number;
  }[];
  courierPackages?: {
    goods?: string;
    qty?: number;
    measuredWeight?: number;
    measuredCbm?: number;
  }[];
};

/**
 * Produce the customer-facing goods list for a shipment document — the actual
 * products (name + qty + measured size), NOT the freight charges. Measured
 * warehouse values take priority over the originally entered ones.
 */
export function buildShipmentGoods(shipment: GoodsSource): PdfGood[] {
  const goods: PdfGood[] = [];

  for (const it of shipment.items || []) {
    if (!it.description) continue;
    goods.push({
      description: it.description,
      qty: it.qty ?? 1,
      detail: measure(it.measuredWeight ?? it.weight, it.measuredCbm ?? it.cbm),
    });
  }

  for (const p of shipment.courierPackages || []) {
    if (!p.goods) continue;
    goods.push({
      description: p.goods,
      qty: p.qty ?? 1,
      detail: measure(p.measuredWeight, p.measuredCbm),
    });
  }

  return goods;
}
