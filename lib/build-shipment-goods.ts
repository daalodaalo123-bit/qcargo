import type { PdfGood } from '@/lib/pdf-goods-section';

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
      weight: it.measuredWeight ?? it.weight,
      cbm: it.measuredCbm ?? it.cbm,
    });
  }

  for (const p of shipment.courierPackages || []) {
    if (!p.goods) continue;
    goods.push({
      description: p.goods,
      qty: p.qty ?? 1,
      weight: p.measuredWeight,
      cbm: p.measuredCbm,
    });
  }

  return goods;
}
