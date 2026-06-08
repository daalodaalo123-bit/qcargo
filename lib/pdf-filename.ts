export function personalizedPdfFilename(personName: string, identifier: string): string {
  const firstName = (personName || '').trim().split(/\s+/)[0] || 'Customer';
  const safeName = firstName.replace(/[^a-zA-Z0-9]/g, '') || 'Customer';
  return `${safeName}-${identifier}.pdf`;
}
