'use client';

import { useState, useEffect, useRef, use } from 'react';
import { ArrowLeft, Send, CheckCircle2, XCircle, Loader2, Download, FileSpreadsheet, Printer } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

const CURRENCY_RATES: Record<string, number> = { USD: 1, CNY: 0.138, AED: 0.272 };

export default function AdminPricingDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;

  const [request, setRequest]     = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [agents, setAgents]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [messages, setMessages]   = useState<Record<string, any[]>>({});
  const [chatText, setChatText]   = useState('');
  const [sending, setSending]     = useState(false);
  const [tab, setTab]             = useState<'responses' | 'chat' | 'quote'>('responses');
  const chatRef                   = useRef<HTMLDivElement>(null);
  const typingTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quote state
  const [margin, setMargin]         = useState('15');
  const [shippingCost, setShipping] = useState('0');
  const [selectedResp, setSelected] = useState<string | null>(null);

  // Typing indicator
  const [agentTyping, setAgentTyping] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pricing/requests/${id}`).then(r => r.json()),
      fetch(`/api/pricing/responses?requestId=${id}`).then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
    ]).then(([req, resp, agts]) => {
      setRequest(req);
      if (Array.isArray(resp)) setResponses(resp);
      if (Array.isArray(agts)) setAgents(agts);
      // Auto-select the FIRST ASSIGNED agent, not first agent overall
      if (req?.assignedAgents?.length > 0) {
        setActiveAgent(req.assignedAgents[0]);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  // Load messages + poll typing when chat tab is open
  useEffect(() => {
    if (!activeAgent || !id) return;
    fetch(`/api/pricing/messages?requestId=${id}&agentId=${activeAgent}`)
      .then(r => r.json()).then(d => {
        if (Array.isArray(d)) setMessages(prev => ({ ...prev, [activeAgent]: d }));
      });

    // Poll for agent typing + new messages every 2s when on chat tab
    if (tab !== 'chat') return;
    const poll = setInterval(async () => {
      const [typingRes, msgRes] = await Promise.all([
        fetch(`/api/pricing/typing?requestId=${id}&agentId=${activeAgent}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/pricing/messages?requestId=${id}&agentId=${activeAgent}`).then(r => r.json()).catch(() => []),
      ]);
      setAgentTyping(typingRes.agentTyping || false);
      if (Array.isArray(msgRes)) setMessages(prev => ({ ...prev, [activeAgent]: msgRes }));
    }, 2000);
    return () => clearInterval(poll);
  }, [activeAgent, id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, activeAgent]);

  const handleSelectResponse = async (respId: string, status: 'SELECTED' | 'REJECTED') => {
    await fetch('/api/pricing/responses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: respId, status }),
    });
    setResponses(prev => prev.map(r => r._id === respId ? { ...r, status } : r));
    if (status === 'SELECTED') {
      setSelected(respId);
      await fetch(`/api/pricing/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      setRequest((prev: any) => ({ ...prev, status: 'COMPLETED' }));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !activeAgent) return;
    setSending(true);
    try {
      const agentObj = agents.find(a => a._id === activeAgent);
      const res = await fetch('/api/pricing/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, agentId: activeAgent, agentName: agentObj?.name || 'Agent', text: chatText, fromAdmin: true }),
      });
      const msg = await res.json();
      setMessages(prev => ({ ...prev, [activeAgent]: [...(prev[activeAgent] || []), msg] }));
      setChatText('');
    } finally { setSending(false); }
  };

  const generateExcel = () => {
    if (!request) return;
    const best = responses.find(r => r._id === selectedResp) || responses[0];
    if (!best) return alert('No response to generate quote from. Select a response first.');
    const unitUSD = best.unitPrice * (CURRENCY_RATES[best.currency] || 1);
    const totalCost = unitUSD * request.quantity;
    const marginAmt = totalCost * (parseFloat(margin) / 100);
    const shipping = parseFloat(shippingCost) || 0;
    const grandTotal = totalCost + marginAmt + shipping;
    const unitQuote = grandTotal / request.quantity;

    const ws = XLSX.utils.aoa_to_sheet([
      ['Q CARGO LOGISTICS — SOURCING QUOTATION'],
      [],
      ['Request No.', request.requestNumber],
      ['Date', new Date().toLocaleDateString()],
      ['Customer', request.customerName],
      ['Product', request.productName],
      ['Quantity', `${request.quantity} ${request.unit}`],
      [],
      ['SUPPLIER DETAILS'],
      ['Supplier', best.supplierName],
      ['Contact', best.supplierContact || ''],
      ['City', best.agentCity],
      ['Lead Time', best.leadTimeDays ? `${best.leadTimeDays} days` : '—'],
      ['MOQ', best.moq || '—'],
      [],
      ['PRICING BREAKDOWN'],
      ['Unit Cost (Supplier)', `${best.unitPrice} ${best.currency}`],
      ['Unit Cost (USD)', `$${unitUSD.toFixed(2)}`],
      ['Total Cost (USD)', `$${totalCost.toFixed(2)}`],
      ['Margin (%)', `${margin}%`],
      ['Shipping & Handling', `$${shipping.toFixed(2)}`],
      ['TOTAL QUOTE', `$${grandTotal.toFixed(2)}`],
      ['Unit Quote Price', `$${unitQuote.toFixed(2)} / ${request.unit}`],
      [],
      ['Notes', best.notes || ''],
      [],
      ['Generated by Q Cargo Logistics ERP', new Date().toLocaleString()],
    ]);

    ws['A1'] = { v: 'Q CARGO LOGISTICS — SOURCING QUOTATION', t: 's', s: { font: { bold: true, sz: 14 } } };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quote');
    XLSX.writeFile(wb, `QCargo-Quote-${request.requestNumber}.xlsx`);
  };

  if (loading) return (
    <div className="admin-container flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[#F15D38]" />
    </div>
  );
  if (!request) return <div className="admin-container py-10 text-slate-400 font-bold">Request not found.</div>;

  const assignedAgentObjects = agents.filter(a => request.assignedAgents?.includes(a._id));
  const best = responses.find(r => r._id === selectedResp) || responses.find(r => r.status === 'SELECTED');

  return (
    <div className="admin-container pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/pricing" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{request.requestNumber}</p>
          <h1 className="text-2xl font-bold text-slate-100">{request.productName}</h1>
          <p className="text-slate-400 text-sm">For: {request.customerName} · {request.quantity} {request.unit}</p>
        </div>
        <span className={`ml-auto text-[10px] font-black px-3 py-1.5 rounded-full border ${request.status === 'COMPLETED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' : request.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400 border-blue-800/30' : 'bg-amber-950/30 text-amber-400 border-amber-800/30'}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Product info card */}
      <div className="shipment-card border border-slate-800 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Customer', value: request.customerName },
          { label: 'Quantity', value: `${request.quantity} ${request.unit}` },
          { label: 'Deadline', value: request.deadline || 'None' },
          { label: 'Budget', value: request.targetPrice ? `$${request.targetPrice}` : 'Not set' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-100">{value}</p>
          </div>
        ))}
        {request.description && (
          <div className="col-span-2 md:col-span-4 border-t border-slate-800/40 pt-4 mt-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</p>
            <p className="text-sm text-slate-300">{request.description}</p>
          </div>
        )}
        {request.photos?.length > 0 && (
          <div className="col-span-2 md:col-span-4 border-t border-slate-800/40 pt-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Photos</p>
            <div className="flex gap-3 flex-wrap">
              {request.photos.map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="w-24 h-24 object-cover rounded-xl border border-slate-800" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-[1.5rem] mb-6">
        {(['responses', 'chat', 'quote'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'responses' ? `Agent Responses (${responses.length})` : t === 'chat' ? 'Chat' : 'Generate Quote'}
          </button>
        ))}
      </div>

      {/* ── RESPONSES TAB ── */}
      {tab === 'responses' && (
        <div className="space-y-4">
          {responses.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-sm font-bold">No responses yet.</p>
              <p className="text-xs mt-1">Waiting for agents to submit their prices.</p>
            </div>
          ) : responses.map(r => {
            const unitUSD = r.unitPrice * (CURRENCY_RATES[r.currency] || 1);
            const totalUSD = unitUSD * request.quantity;
            return (
              <div key={r._id} className={`shipment-card border transition-all ${r.status === 'SELECTED' ? 'border-emerald-500/50 bg-emerald-950/10' : r.status === 'REJECTED' ? 'border-rose-800/20 opacity-50' : 'border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-black text-slate-100">{r.agentName}</span>
                      <span className="text-[10px] text-slate-500 font-bold">· {r.agentCity}</span>
                      {r.status === 'SELECTED' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-800/30">✓ SELECTED</span>}
                    </div>
                    <p className="text-2xl font-black text-[#F15D38]">{r.unitPrice} {r.currency} <span className="text-sm text-slate-400 font-bold">/ {request.unit}</span></p>
                    <p className="text-xs text-slate-400 font-bold mt-1">≈ ${unitUSD.toFixed(2)} USD · Total: ${totalUSD.toFixed(2)}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      {[
                        { label: 'Supplier', value: r.supplierName },
                        { label: 'Contact', value: r.supplierContact || '—' },
                        { label: 'MOQ', value: r.moq ? `${r.moq} ${request.unit}` : '—' },
                        { label: 'Lead Time', value: r.leadTimeDays ? `${r.leadTimeDays} days` : '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                          <p className="text-xs font-bold text-slate-300 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {r.notes && <p className="text-xs text-slate-400 mt-3 italic">"{r.notes}"</p>}
                    {r.photos?.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {r.photos.map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-800 cursor-pointer" onClick={() => window.open(url, '_blank')} />
                        ))}
                      </div>
                    )}
                  </div>
                  {r.status === 'SUBMITTED' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleSelectResponse(r._id, 'SELECTED')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs font-black transition-all">
                        <CheckCircle2 size={14} /> Select
                      </button>
                      <button onClick={() => handleSelectResponse(r._id, 'REJECTED')} className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-800/20 rounded-xl text-xs font-black transition-all">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Agent list sidebar */}
          <div className="md:col-span-1 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              Agents ({assignedAgentObjects.length})
            </p>
            {assignedAgentObjects.length === 0 ? (
              <p className="text-xs text-slate-600">No agents assigned to this request.</p>
            ) : assignedAgentObjects.map(a => {
              const agentMsgs = messages[a._id] || [];
              const unread = agentMsgs.filter(m => m.fromAgent && !m.read).length;
              const agentResp = responses.find(r => r.agentId === a._id);
              return (
                <button key={a._id} onClick={() => setActiveAgent(a._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${activeAgent === a._id ? 'border-[#F15D38] bg-[#F15D38]/10' : 'border-slate-800 hover:border-slate-600'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-black text-slate-100 truncate">{a.name}</p>
                    {unread > 0 && <span className="shrink-0 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
                  </div>
                  <p className="text-[10px] text-slate-500">{a.city}</p>
                  {agentResp ? (
                    <p className="text-[10px] font-black text-emerald-400 mt-1">
                      {agentResp.unitPrice} {agentResp.currency} · {agentResp.supplierName}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-600 mt-1 italic">No price yet</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat window */}
          <div className="md:col-span-3 bg-[#131B2E] border border-slate-800 rounded-2xl flex flex-col" style={{ height: '550px' }}>
            {!activeAgent ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-bold">Select an agent on the left to chat</div>
            ) : (
              <>
                {/* Agent header + price summary */}
                {(() => {
                  const a = agents.find(x => x._id === activeAgent);
                  const resp = responses.find(r => r.agentId === activeAgent);
                  return (
                    <div className="px-4 py-3 border-b border-slate-800 shrink-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-100">{a?.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{a?.city}</span>
                        </div>
                        {resp && (
                          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-right">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Their Price</p>
                              <p className="text-sm font-black text-[#F15D38]">{resp.unitPrice} {resp.currency} / {request?.unit}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Supplier</p>
                              <p className="text-xs font-bold text-slate-300">{resp.supplierName}</p>
                            </div>
                            {resp.leadTimeDays && (
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lead Time</p>
                                <p className="text-xs font-bold text-slate-300">{resp.leadTimeDays}d</p>
                              </div>
                            )}
                          </div>
                        )}
                        {!resp && <p className="text-xs text-slate-600 italic">Waiting for price...</p>}
                      </div>
                    </div>
                  );
                })()}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(messages[activeAgent] || []).length === 0 && (
                    <div className="text-center py-10 text-slate-600 text-xs font-bold">No messages yet. Start the conversation.</div>
                  )}
                  {(messages[activeAgent] || []).map(m => (
                    <div key={m._id} className={`flex ${!m.fromAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-bold ${!m.fromAgent ? 'bg-[#F15D38] text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'}`}>
                        {m.fromAgent && <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">{m.agentName}</p>}
                        {m.text}
                        <p className={`text-[9px] mt-1 ${!m.fromAgent ? 'text-white/60' : 'text-slate-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Agent typing indicator */}
                  {agentTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-slate-800">
                  <input type="text" value={chatText}
                    onChange={e => {
                      setChatText(e.target.value);
                      // Ping typing indicator
                      if (activeAgent) {
                        fetch('/api/pricing/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, agentId: activeAgent, role: 'admin' }) }).catch(() => {});
                      }
                    }}
                    placeholder="Message agent..."
                    className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38]" />
                  <button type="submit" disabled={sending || !chatText.trim()} className="bg-[#F15D38] hover:bg-[#d64420] text-white px-4 rounded-xl transition-all disabled:opacity-40">
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── QUOTE TAB ── */}
      {tab === 'quote' && (
        <div className="max-w-xl space-y-6">
          {responses.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-bold">No agent responses yet. Wait for responses before generating a quote.</div>
          ) : (
            <>
              {/* Pick response */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Base Quote On</label>
                <div className="space-y-2">
                  {responses.filter(r => r.status !== 'REJECTED').map(r => {
                    const unitUSD = r.unitPrice * (CURRENCY_RATES[r.currency] || 1);
                    return (
                      <label key={r._id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedResp === r._id ? 'border-[#F15D38] bg-[#F15D38]/10' : 'border-slate-800 hover:border-slate-600'}`}>
                        <input type="radio" name="resp" className="accent-[#F15D38]" checked={selectedResp === r._id} onChange={() => setSelected(r._id)} />
                        <div>
                          <p className="text-sm font-black text-slate-100">{r.agentName} · {r.supplierName}</p>
                          <p className="text-xs text-slate-400">{r.unitPrice} {r.currency} / {request.unit} ≈ ${unitUSD.toFixed(2)} USD</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Margin & shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Margin (%)</label>
                  <input type="number" value={margin} onChange={e => setMargin(e.target.value)} className="search-input w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping & Handling ($)</label>
                  <input type="number" step="0.01" value={shippingCost} onChange={e => setShipping(e.target.value)} className="search-input w-full" />
                </div>
              </div>

              {/* Preview */}
              {selectedResp && (() => {
                const r = responses.find(x => x._id === selectedResp);
                if (!r) return null;
                const unitUSD = r.unitPrice * (CURRENCY_RATES[r.currency] || 1);
                const totalCost = unitUSD * request.quantity;
                const marginAmt = totalCost * (parseFloat(margin) / 100);
                const shipping = parseFloat(shippingCost) || 0;
                const grand = totalCost + marginAmt + shipping;
                const unitQ = grand / request.quantity;
                return (
                  <div className="bg-[#131B2E] border border-slate-700 rounded-2xl p-5 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Quote Preview</p>
                    {[
                      ['Supplier Cost', `$${totalCost.toFixed(2)}`],
                      [`Margin (${margin}%)`, `$${marginAmt.toFixed(2)}`],
                      ['Shipping & Handling', `$${shipping.toFixed(2)}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold">{label}</span>
                        <span className="text-slate-100 font-black">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-2 flex justify-between">
                      <span className="text-sm font-black text-slate-100">Total Quote</span>
                      <span className="text-xl font-black text-[#F15D38]">${grand.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-400 text-right font-bold">${unitQ.toFixed(2)} / {request.unit}</p>
                  </div>
                );
              })()}

              {/* Download buttons */}
              <div className="flex gap-3">
                <button onClick={generateExcel} disabled={!selectedResp}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs font-black transition-all disabled:opacity-40">
                  <FileSpreadsheet size={16} /> Download Excel
                </button>
                <Link href={`/admin/pricing/${id}/quote-print?resp=${selectedResp || ''}&margin=${margin}&shipping=${shippingCost}`} target="_blank"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 bg-blue-950/30 hover:bg-blue-950/50 text-blue-400 border border-blue-800/30 rounded-xl text-xs font-black transition-all ${!selectedResp ? 'pointer-events-none opacity-40' : ''}`}>
                  <Printer size={16} /> Print / PDF
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
