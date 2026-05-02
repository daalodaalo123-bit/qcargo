import Link from 'next/link';

export default function BatchDetail({ params }: { params: { id: string } }) {
  // Mock data for management
  const batch = {
    id: params.id || 'DUR-2024-001',
    customer: 'Ahmed Ali',
    goods: 'Electronics & Accessories',
    type: 'SEA',
    status: 'IN_TRANSIT',
    trackingNumbers: ['TRK7788221', 'TRK9900331'],
    expenses: [
      { id: 1, desc: 'Port Fees', amount: 300 },
      { id: 2, desc: 'Local Delivery', amount: 150 },
    ]
  };

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Dashboard</Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Batch: {batch.id}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Managing shipment for <strong>{batch.customer}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline">Print Label</button>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Update */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Update Status</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select className="form-input" defaultValue={batch.status}>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED">Arrived</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              <button className="btn btn-primary">Update</button>
            </div>
          </div>

          {/* Tracking Numbers */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Trucking Numbers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {batch.trackingNumbers.map((num, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" defaultValue={num} />
                  <button className="btn btn-outline" style={{ color: 'red' }}>×</button>
                </div>
              ))}
              <button className="btn btn-outline" style={{ borderStyle: 'dashed' }}>+ Add Number</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Expenses Quick View */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {batch.expenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span>{exp.desc}</span>
                  <span style={{ fontWeight: 700 }}>${exp.amount}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.125rem', fontWeight: 800 }}>
                <span>Total</span>
                <span>$450</span>
              </div>
              <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }}>Add Expense</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
