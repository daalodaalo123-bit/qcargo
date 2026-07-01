import { generateQuotationPdf } from '@/lib/generate-quotation-pdf';
import { buildShipmentInvoiceItems } from '@/lib/build-shipment-invoice-items';
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
  items?: Parameters<typeof buildShipmentGoods>[0]['items'];
  courierPackages?: Parameters<typeof buildShipmentGoods>[0]['courierPackages'];
};

/** Freight-detail chips shown on shipment documents (AIR = KG, SEA = CBM). */
export function shipmentFreightSummary(shipment: ShipmentPdfSource): { label: string; value: string }[] {
  const isAir = shipment.type === 'AIR';
  return [
    isAir
      ? { label: 'Chargeable Weight', value: `${shipment.weight ?? 0} KG` }
      : { label: 'Total Volume', value: `${shipment.cbm ?? 0} CBM` },
    { label: 'Rate', value: `$${(shipment.rate ?? 0).toFixed(2)} / ${isAir ? 'KG' : 'CBM'}` },
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
