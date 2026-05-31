import type { ReceiptLineItem } from '@/lib/generate-receipt-pdf';

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
};

function money(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Invoice line items from shipment freight breakdown (not cargo goods). */
export function buildShipmentInvoiceItems(shipment: ShipmentChargeInput): ReceiptLineItem[] {
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
