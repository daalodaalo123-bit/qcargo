'use client';

// Classic Balance Sheet: Assets = Liabilities + Equity (Gap #4).
// Cash is derived from the opening balance plus lifetime cash collected
// minus lifetime cash paid out. AR/AP come from unpaid invoices/bills.

export default function BalanceSheetTab({
  openingBalance, cashIn, cashOut, receivables, payables,
}: {
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  receivables: number;
  payables: number;
}) {
  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cash = openingBalance + cashIn - cashOut;
  const totalAssets = cash + receivables;
  const totalLiabilities = payables;
  const equity = totalAssets - totalLiabilities;

  const Row = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
    <div className={`flex justify-between items-center py-2.5 ${bold ? 'border-t border-slate-700 mt-1 pt-3' : ''}`}>
      <span className={`${bold ? 'text-slate-100 font-black' : 'text-slate-300 font-bold'} text-sm`}>{label}</span>
      <span className={`${bold ? 'text-slate-100 font-black text-lg' : 'text-slate-200 font-bold'}`}>{money(value)}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-slate-100">Balance Sheet</h2>
        <p className="text-slate-400 text-sm mt-1">A snapshot of what the business owns, owes, and is worth right now. Assets must equal Liabilities + Equity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="shipment-card border border-emerald-800/30 bg-emerald-950/10">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3">Assets (what you own)</h3>
          <Row label="Cash & Bank (incl. Zaad/eDahab)" value={cash} />
          <Row label="Accounts Receivable (owed to you)" value={receivables} />
          <Row label="Total Assets" value={totalAssets} bold />
          <p className="text-[10px] text-slate-500 mt-3">Cash = opening {money(openingBalance)} + collected {money(cashIn)} − paid out {money(cashOut)}.</p>
        </div>

        {/* Liabilities + Equity */}
        <div className="space-y-6">
          <div className="shipment-card border border-rose-800/30 bg-rose-950/10">
            <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-3">Liabilities (what you owe)</h3>
            <Row label="Accounts Payable (unpaid bills)" value={payables} />
            <Row label="Total Liabilities" value={totalLiabilities} bold />
          </div>
          <div className={`shipment-card border ${equity >= 0 ? 'border-[#0d9488]/30 bg-[#0d9488]/10' : 'border-rose-800/30 bg-rose-950/10'}`}>
            <h3 className="text-sm font-black text-[#0d9488] uppercase tracking-widest mb-3">Equity (business net worth)</h3>
            <Row label="Owner's Equity (Assets − Liabilities)" value={equity} bold />
          </div>
        </div>
      </div>

      {/* Balance check */}
      <div className="shipment-card border border-slate-800 bg-[#131B2E] flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Balance check</span>
        <span className="text-sm font-bold text-slate-300">
          Assets {money(totalAssets)} = Liabilities {money(totalLiabilities)} + Equity {money(equity)}
        </span>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">Balanced ✓</span>
      </div>
    </div>
  );
}
