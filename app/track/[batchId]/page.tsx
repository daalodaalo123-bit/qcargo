'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Package, Check, Clock, Plane, Ship, RefreshCw, StickyNote, X, Send } from 'lucide-react';

interface ProductNote {
  text: string;
  at: string;
}
interface TrackLine {
  lineType: 'item' | 'courier' | 'none';
  index: number;
  product: string;
  qty: number;
  tracking: string;
  received: boolean;
  measuredWeight: number | null;
  measuredCbm: number | null;
  notes: ProductNote[];
}
interface TrackCustomer {
  shipmentId: string;
  customer: string;
  weightLabel: string;
  type: 'AIR' | 'SEA';
  lines: TrackLine[];
}
interface TrackData {
  batchId: string;
  type: 'AIR' | 'SEA';
  origin: string;
  destination: string;
  status: string;
  totalLines: number;
  receivedCount: number;
  customers: TrackCustomer[];
}

const lineKey = (shipmentId: string, line: TrackLine) => `${shipmentId}-${line.lineType}-${line.index}`;

function formatNoteDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function BatchTrackPage({ params }: { params: Promise<{ batchId: string }> | { batchId: string } }) {
  const resolved = params && 'then' in params ? use(params) : params;
  const batchId = resolved?.batchId;

  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notePanel, setNotePanel] = useState<{ shipmentId: string; line: TrackLine } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${batchId}`);
      if (!res.ok) throw new Error('Could not load this batch');
      setData(await res.json());
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { if (batchId) load(); }, [batchId, load]);

  // Apply a partial update to one line in local state.
  const patchLine = useCallback((shipmentId: string, line: TrackLine, changes: Partial<TrackLine>) => {
    setData((prev) => {
      if (!prev) return prev;
      const customers = prev.customers.map((cc) =>
        cc.shipmentId !== shipmentId ? cc : {
          ...cc,
          lines: cc.lines.map((l) => (l.lineType === line.lineType && l.index === line.index ? { ...l, ...changes } : l)),
        }
      );
      const receivedCount = customers.reduce((sum, cc) => sum + cc.lines.filter((l) => l.received).length, 0);
      return { ...prev, customers, receivedCount };
    });
  }, []);

  // Send a PATCH to the server for one line. Returns true on success.
  const sendPatch = useCallback(async (shipmentId: string, line: TrackLine, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/track/${batchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentId, lineType: line.lineType, index: line.index, ...payload }),
    });
    if (!res.ok) throw new Error('save failed');
    return true;
  }, [batchId]);

  const toggle = async (c: TrackCustomer, line: TrackLine) => {
    if (line.lineType === 'none' || !data) return;
    const key = lineKey(c.shipmentId, line);
    const next = !line.received;
    setSavingKey(key);
    patchLine(c.shipmentId, line, { received: next }); // optimistic
    try {
      await sendPatch(c.shipmentId, { ...line, received: next }, { received: next });
    } catch {
      await load();
      alert('Could not save — please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  // Save a measured KG/CBM value (fires on blur). Empty clears the value.
  const saveMeasure = async (c: TrackCustomer, line: TrackLine, field: 'measuredWeight' | 'measuredCbm', raw: string) => {
    if (line.lineType === 'none') return;
    const trimmed = raw.trim();
    const value = trimmed === '' ? null : Number(trimmed);
    if (value !== null && (isNaN(value) || value < 0)) {
      alert('Please enter a valid number.');
      await load();
      return;
    }
    const current = line[field];
    if ((current ?? null) === value) return; // unchanged
    patchLine(c.shipmentId, line, { [field]: value } as Partial<TrackLine>);
    try {
      await sendPatch(c.shipmentId, line, { [field]: value });
    } catch {
      await load();
      alert('Could not save — please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <RefreshCw className="text-[#F15D38] animate-spin" size={28} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="text-center">
          <Package className="text-slate-600 mx-auto mb-3" size={32} />
          <p className="text-slate-300 font-bold">{error || 'Batch not found'}</p>
        </div>
      </div>
    );
  }

  const pct = data.totalLines > 0 ? Math.round((data.receivedCount / data.totalLines) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 pb-16">
      {/* Header */}
      <div className="bg-[#131B2E] border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
                {data.type === 'AIR' ? <Plane size={18} /> : <Ship size={18} />}
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">Q CARGO</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Arrival Checklist</p>
              </div>
            </div>
            <button onClick={load} className="p-2 text-slate-400 hover:text-slate-100" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-black text-slate-200">Batch {data.batchId}</span>
              <span className="font-bold text-slate-400">{data.origin} → {data.destination}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-black text-emerald-400 shrink-0">{data.receivedCount}/{data.totalLines} arrived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customers */}
      <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
        {data.customers.length === 0 && (
          <p className="text-center text-slate-500 font-bold py-10">No customers in this batch yet.</p>
        )}
        {data.customers.map((c) => (
          <div key={c.shipmentId} className="bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-[#0B0F19]/60 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-black text-slate-100">{c.customer}</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.weightLabel}</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {c.lines.map((line) => {
                const key = lineKey(c.shipmentId, line);
                const saving = savingKey === key;
                const disabled = line.lineType === 'none';
                return (
                  <div key={key} className="px-4 py-3.5">
                    {/* Top row: product info + arrived button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-200 break-words">{line.product}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Qty: {line.qty}{line.tracking ? ` · ${line.tracking}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => toggle(c, line)}
                        disabled={saving || disabled}
                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border transition-colors disabled:opacity-60 ${
                          line.received
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-transparent text-slate-300 border-slate-600 hover:border-[#F15D38] hover:text-[#F15D38]'
                        }`}
                      >
                        {line.received ? <Check size={13} /> : <Clock size={13} />}
                        {line.received ? 'Received' : 'Not yet'}
                      </button>
                    </div>

                    {/* Measured KG / CBM + Note */}
                    {!disabled && (
                      <div className="flex items-end gap-3 mt-3 flex-wrap">
                        <label className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">KG (measured)</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            defaultValue={line.measuredWeight ?? ''}
                            placeholder="—"
                            onBlur={(e) => saveMeasure(c, line, 'measuredWeight', e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-sm font-bold text-slate-100 placeholder-slate-600 focus:border-[#F15D38] focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CBM (measured)</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            defaultValue={line.measuredCbm ?? ''}
                            placeholder="—"
                            onBlur={(e) => saveMeasure(c, line, 'measuredCbm', e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-sm font-bold text-slate-100 placeholder-slate-600 focus:border-[#F15D38] focus:outline-none"
                          />
                        </label>
                        <button
                          onClick={() => setNotePanel({ shipmentId: c.shipmentId, line })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-colors ${
                            line.notes.length > 0
                              ? 'border-[#F15D38] text-[#F15D38] bg-[#F15D38]/10'
                              : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                          }`}
                        >
                          <StickyNote size={13} />
                          Note{line.notes.length > 0 ? ` (${line.notes.length})` : ''}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-slate-600 font-bold mt-4 px-5">
        Mark goods as received, type the weight (KG) and CBM you measure, and add notes per product. Everything saves automatically.
      </p>

      {notePanel && (
        <NoteModal
          line={notePanel.line}
          onClose={() => setNotePanel(null)}
          onAdd={async (text) => {
            const { shipmentId, line } = notePanel;
            const optimistic: ProductNote = { text, at: new Date().toISOString() };
            patchLine(shipmentId, line, { notes: [...line.notes, optimistic] });
            setNotePanel({ shipmentId, line: { ...line, notes: [...line.notes, optimistic] } });
            try {
              await sendPatch(shipmentId, line, { addNote: text });
            } catch {
              await load();
              setNotePanel(null);
              alert('Could not save the note — please try again.');
            }
          }}
        />
      )}
    </div>
  );
}

function NoteModal({ line, onClose, onAdd }: { line: TrackLine; onClose: () => void; onAdd: (text: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    await onAdd(t);
    setText('');
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-[#131B2E] border border-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="font-black text-slate-100 text-sm truncate">Notes</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">{line.product}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {line.notes.length === 0 && (
            <p className="text-center text-slate-500 text-sm font-medium py-6">No notes yet. Add the first one below.</p>
          )}
          {line.notes.map((n, i) => (
            <div key={i} className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2.5">
              <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{n.text}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1.5">{formatNoteDate(n.at)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 p-3 flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Box arrived broken; 1 piece missing after count"
            rows={2}
            className="flex-1 resize-none px-3 py-2 rounded-xl bg-[#0B0F19] border border-slate-700 text-sm text-slate-100 placeholder-slate-600 focus:border-[#F15D38] focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F15D38] text-white text-sm font-black disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
