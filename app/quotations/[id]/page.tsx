import Image from 'next/image';

export default function PublicQuotation({ params }: { params: { id: string } }) {
  // Mock data for the customer to see
  const quotation = {
    id: params.id,
    customer: "Ahmed Ali",
    date: new Date().toLocaleDateString(),
    items: [
      { name: "Solar Panels 400W", qty: 10, price: 120, total: 1200 },
      { name: "Inverter 5kW", qty: 2, price: 450, total: 900 },
    ],
    freightType: "SEA",
    totalAmount: 2100,
    images: [
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1621905252507-b354bcadc0d6?auto=format&fit=crop&w=400&q=80"
    ],
    agentNotes: "Prices include customs clearing in Mogadishu port."
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>QUOTATION</h1>
            <p>ID: {quotation.id}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>DURDUR CARGO</div>
            <p>Date: {quotation.date}</p>
          </div>
        </div>

        <div style={{ padding: '3rem' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Customer Details</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{quotation.customer}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 0' }}>Item Description</th>
                <th style={{ padding: '1rem 0' }}>Qty</th>
                <th style={{ padding: '1rem 0' }}>Price</th>
                <th style={{ padding: '1rem 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1.5rem 0' }}>{item.name}</td>
                  <td style={{ padding: '1.5rem 0' }}>{item.qty}</td>
                  <td style={{ padding: '1.5rem 0' }}>${item.price}</td>
                  <td style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 600 }}>${item.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ padding: '2rem 0', textAlign: 'right', fontWeight: 600, fontSize: '1.25rem' }}>Grand Total (USD)</td>
                <td style={{ padding: '2rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>${quotation.totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Goods Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {quotation.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt="Goods" 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} 
                />
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Notes:</h4>
            <p style={{ color: 'var(--text-muted)' }}>{quotation.agentNotes}</p>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '1rem 3rem' }}>Approve & Start Sourcing</button>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Questions? WhatsApp us at +252 61XXXXXXX</p>
          </div>
        </div>
      </div>
    </div>
  );
}
