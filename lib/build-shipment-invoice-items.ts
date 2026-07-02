import type { ReceiptLineItem } from '@/lib/generate-receipt-pdf';

export type PriceLineInput = {
  product: string;
  weight?: number;
  cbm?: number;
  rate?: number;
  amount?: number;
  customs?: number;
  tax?: number;
};

export type ShipmentChargeInput = {
  type: 'AIR' | 'SEA';
  shipmentNumber: string;
  weight?: number;
  cbm?: number;
  rate?: number;
  customs?: number;
  discount?: number;
  tax?: number;
  total: number;
  priceLines?: PriceLineInput[];
};

function money(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Charge line items for shipment documents. When the shipment has per-product
 * priced lines, each product becomes its own freight row (with its own rate),
 * then customs/tax/discount are added. Falls back to the single-freight-line
 * breakdown for older shipments that have no priceLines.
 */
export function buildShipmentInvoiceItems(shipment: ShipmentChargeInput): ReceiptLineItem[] {
  const lines = (shipment.priceLines || []).filter((l) => l.product && l.product.trim());
  if (lines.length > 0) {
    return buildPricedLineItems(shipment, lines);
  }

  const rate = shipment.rate ?? 0;
  const isAir = shipment.type === 'AIR';
  const units = isAir ? shipment.weight ?? 0 : shipment.cbm ?? 0;
  const freightCharge = units * rate;

  const items: ReceiptLineItem[] = [];

  if (units > 0 || freightCharge > 0) {
    const desc = isAir
      ? `Freight charge — ${units.toLocaleString()} KG @ ${money(rate)}/KG`
      : `Freight charge — ${units.toLocaleString()} CBM @ ${money(rate)}/CBM`;
    items.push({
      description: desc,
      qty: units > 0 ? units : 1,
      price: rate,
      lineTotal: freightCharge,
    });
  }

  const customs = shipment.customs ?? 0;
  if (customs > 0) {
    items.push({
      description: 'Customs & extra charges',
      qty: 1,
      price: customs,
      lineTotal: customs,
    });
  }

  const tax = shipment.tax ?? 0;
  if (tax > 0) {
    items.push({
      description: 'Tax',
      qty: 1,
      price: tax,
      lineTotal: tax,
    });
  }

  const discount = shipment.discount ?? 0;
  if (discount > 0) {
    items.push({
      description: 'Discount',
      qty: 1,
      price: -discount,
      lineTotal: -discount,
    });
  }

  const computed = items.reduce((sum, it) => sum + it.lineTotal, 0);
  if (items.length === 0 || Math.abs(computed - shipment.total) > 0.02) {
    return [
      {
        description: `Shipment ${shipment.shipmentNumber} — ${shipment.type} freight & charges`,
        qty: 1,
        price: shipment.total,
        lineTotal: shipment.total,
      },
    ];
  }

  const diff = shipment.total - computed;
  if (Math.abs(diff) >= 0.01) {
    items.push({
      description: 'Adjustment',
      qty: 1,
      price: diff,
      lineTotal: diff,
    });
  }

  return items;
}

/** One freight row per priced product, plus customs/tax (AIR) and discount. */
function buildPricedLineItems(shipment: ShipmentChargeInput, lines: PriceLineInput[]): ReceiptLineItem[] {
  const isAir = shipment.type === 'AIR';
  const unit = isAir ? 'KG' : 'CBM';
  const items: ReceiptLineItem[] = [];
  let customsTotal = 0;
  let taxTotal = 0;

  for (const l of lines) {
    const units = isAir ? l.weight ?? 0 : l.cbm ?? 0;
    const rate = l.rate ?? 0;
    // Freight for the line is its stored amount; older lines fall back to units × rate.
    const freight = l.amount != null && l.amount !== 0 ? l.amount : units * rate;
    // Show the rate breakdown when there are units; otherwise it's a flat total.
    const description = units > 0
      ? `${l.product.trim()} — ${units.toLocaleString()} ${unit} @ ${money(rate)}/${unit}`
      : l.product.trim();
    items.push({
      description,
      qty: units > 0 ? units : 1,
      price: units > 0 ? rate : freight,
      lineTotal: freight,
    });
    // Customs & tax only apply to AIR (hidden on SEA in the form).
    if (isAir) {
      customsTotal += l.customs ?? 0;
      taxTotal += l.tax ?? 0;
    }
  }

  if (customsTotal > 0) {
    items.push({ description: 'Customs & extra charges', qty: 1, price: customsTotal, lineTotal: customsTotal });
  }
  if (taxTotal > 0) {
    items.push({ description: 'Tax', qty: 1, price: taxTotal, lineTotal: taxTotal });
  }

  const discount = shipment.discount ?? 0;
  if (discount > 0) {
    items.push({ description: 'Discount', qty: 1, price: -discount, lineTotal: -discount });
  }

  // Reconcile any rounding gap so the printed rows always sum to the stored total.
  const computed = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const diff = shipment.total - computed;
  if (Math.abs(diff) >= 0.01) {
    items.push({ description: 'Adjustment', qty: 1, price: diff, lineTotal: diff });
  }

  return items;
}
