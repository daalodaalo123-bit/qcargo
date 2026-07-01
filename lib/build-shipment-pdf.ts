import { generateQuotationPdf } from '@/lib/generate-quotation-pdf';
import { buildShipmentInvoiceItems, type PriceLineInput } from '@/lib/build-shipment-invoice-items';
import { buildShipmentGoods } from '@/lib/build-shipment-goods';

/** Minimal shape needed to render a shipment quotation (satisfied by IShipment). */
export type ShipmentPdfSource = {
  shipmentNumber: string;
  customer: string;
  phone: string;
  type: 'AIR' | 'SEA';
  status?: string;
  paymentStatus?: string;
  date: string;
  batch?: string;
  weight?: number;
  cbm?: number;
  rate?: number;
  customs?: number;
  tax?: number;
  discount?: number;
  total: number;
  priceLines?: PriceLineInput[];
  items?: Parameters<typeof buildShipmentGoods>[0]['items'];
  courierPackages?: Parameters<typeof buildShipmentGoods>[0]['courierPackages'];
};

/** Freight-detail chips shown on shipment documents (AIR = KG, SEA = CBM). */
export function shipmentFreightSummary(shipment: ShipmentPdfSource): { label: string; value: string }[] {
  const isAir = shipment.type === 'AIR';
  const lines = (shipment.priceLines || []).filter((l) => l.product && l.product.trim());

  // Total weight/CBM and rate — derived from priced lines when present.
  let units: number;
  let rateLabel: string;
  if (lines.length > 0) {
    units = lines.reduce((s, l) => s + (isAir ? l.weight ?? 0 : l.cbm ?? 0), 0);
    const rates = [...new Set(lines.map((l) => l.rate ?? 0))];
    rateLabel = rates.length === 1
      ? `$${rates[0].toFixed(2)} / ${isAir ? 'KG' : 'CBM'}`
      : 'Multiple rates';
  } else {
    units = isAir ? shipment.weight ?? 0 : shipment.cbm ?? 0;
    rateLabel = `$${(shipment.rate ?? 0).toFixed(2)} / ${isAir ? 'KG' : 'CBM'}`;
  }

  return [
    isAir
      ? { label: 'Chargeable Weight', value: `${units} KG` }
      : { label: 'Total Volume', value: `${units} CBM` },
    { label: 'Rate', value: rateLabel },
    { label: 'Batch', value: shipment.batch || 'UNASSIGNED' },
  ];
}

/** Render the black Quotation-style PDF for a shipment (goods + cost). */
export async function buildShipmentQuotationPdf(shipment: ShipmentPdfSource): Promise<Uint8Array> {
  const goods = buildShipmentGoods(shipment);
  const charges = buildShipmentInvoiceItems({
    type: shipment.type,
    shipmentNumber: shipment.shipmentNumber,
    weight: shipment.weight,
    cbm: shipment.cbm,
    rate: shipment.rate,
    customs: shipment.customs,
    discount: shipment.discount,
    tax: shipment.tax,
    total: shipment.total,
    priceLines: shipment.priceLines,
  });

  return generateQuotationPdf({
    quoteNumber: shipment.shipmentNumber,
    customerName: shipment.customer,
    customerPhone: shipment.phone,
    date: shipment.date,
    freightType: shipment.type,
    items: charges.map((c) => ({ description: c.description, qty: c.qty, price: c.price })),
    goods,
    freightSummary: shipmentFreightSummary(shipment),
    total: shipment.total,
    status: shipment.status === 'ARRIVED' ? 'ARRIVED' : 'SENT',
    paymentStatus: shipment.paymentStatus,
    itemsTitle: 'Shipment Charges',
  });
}
