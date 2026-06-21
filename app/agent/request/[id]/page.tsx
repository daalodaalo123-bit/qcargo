'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function AgentRequestPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id;
  const router = useRouter();

  const [agent, setAgent]         = useState<any>(null);
  const [request, setRequest]     = useState<any>(null);
  const [myResponse, setMyResponse] = useState<any>(null);
  const [messages, setMessages]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'request' | 'respond' | 'chat'>('request');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]           = useState(false);
  const chatRef                   = useRef<HTMLDivElement>(null);

  // Response form state
  const [supplierName, setSupplierName]   = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [unitPrice, setUnitPrice]         = useState('');
  const [currency, setCurrency]           = useState('USD');
  const [moq, setMoq]                     = useState('');
  const [leadTime, setLeadTime]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [photos, setPhotos]               = useState<string[]>([]);
  const [uploading, setUploading]         = useState(false);

  // Chat
  const [chatText, setChatText]   = useState('');
  const [sending, setSending]     = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('qcargo_agent_token') : '';

  useEffect(() => {
    if (!token) { router.replace('/agent/login'); return; }
    const agentRaw = localStorage.getItem('qcargo_agent');
    if (agentRaw) setAgent(JSON.parse(agentRaw));

    Promise.all([
      fetch(`/api/pricing/requests/${id}`).then(r => r.json()),
      fetch(`/api/pricing/responses?agentId=${JSON.parse(agentRaw || '{}').id || ''}&requestId=${id}`).then(r => r.json()),
    ]).then(([req, responses]) => {
      setRequest(req);
      const mine = Array.isArray(responses) ? responses[0] : null;
      if (mine) {
        setMyResponse(mine);
        setSupplierName(mine.supplierName || '');
        setSupplierContact(mine.supplierContact || '');
        setUnitPrice(String(mine.unitPrice || ''));
        setCurrency(mine.currency || 'USD');
        setMoq(String(mine.moq || ''));
        setLeadTime(String(mine.leadTimeDays || ''));
        setNotes(mine.notes || '');
        setPhotos(mine.photos || []);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab !== 'chat' || !agent) return;
    fetch(`/api/pricing/messages?requestId=${id}&agentId=${agent.id}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setMessages(d); });

    // Ping agent heartbeat + poll admin typing + new messages every 2s
    const agentToken = localStorage.getItem('qcargo_agent_token');
    const poll = setInterval(async () => {
      const [typingRes, msgRes] = await Promise.all([
        fetch(`/api/pricing/typing?requestId=${id}&agentId=${agent.id}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/pricing/messages?requestId=${id}&agentId=${agent.id}`).then(r => r.json()).catch(() => []),
      ]);
      setAdminTyping(typingRes.adminTyping || false);
      if (Array.isArray(msgRes)) setMessages(msgRes);
    }, 2000);
    // Keep agent heartbeat alive while in chat
    const hb = setInterval(() => {
      if (agentToken) fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${agentToken}` } }).catch(() => {});
    }, 30000);
    return () => { clearInterval(poll); clearInterval(hb); };
  }, [tab, agent, id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/pricing/upload', { method: 'POST', body: fd });
      const { url } = await res.json();
      if (url) setPhotos(prev => [...prev, url]);
    } finally { setUploading(false); }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !unitPrice) return;
    setSubmitting(true);
    try {
      await fetch('/api/pricing/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: id, supplierName, supplierContact, unitPrice: parseFloat(unitPrice), currency, moq: moq ? parseInt(moq) : undefined, leadTimeDays: leadTime ? parseInt(leadTime) : undefined, notes, photos }),
      });
      setSent(true);
      setTimeout(() => { setSent(false); setTab('request'); }, 2000);
    } finally { setSubmitting(false); }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !agent) return;
    setSending(true);
    try {
      const res = await fetch('/api/pricing/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: id, agentId: agent.id, agentName: agent.name, text: chatText }),
      });
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setChatText('');
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#F15D38]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#131B2E] border-b border-slate-800 px-4 py-4 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-100 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{request?.requestNumber}</p>
          <p className="font-black text-slate-100 text-sm">{request?.productName}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#131B2E]">
        {(['request', 'respond', 'chat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'text-[#F15D38] border-b-2 border-[#F15D38]' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'request' ? 'Request' : t === 'respond' ? (myResponse ? '✓ My Price' : 'Submit Price') : (
              <span className="flex items-center justify-center gap-1.5">
                Chat
                {messages.filter(m => !m.fromAgent && !m.read).length > 0 && (
                  <span className="bg-[#F15D38] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {messages.filter(m => !m.fromAgent && !m.read).length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">

        {/* ── REQUEST TAB ── */}
        {tab === 'request' && request && (
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Customer', value: request.customerName },
                { label: 'Quantity', value: `${request.quantity} ${request.unit}` },
                { label: 'Deadline', value: request.deadline || 'No deadline' },
                { label: 'Budget', value: request.targetPrice ? `$${request.targetPrice}` : 'Not specified' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#131B2E] border border-slate-800 rounded-xl p-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            {request.description && (
              <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Description / Specs</p>
                <p className="text-sm text-slate-300 leading-relaxed">{request.description}</p>
              </div>
            )}
            {request.photos?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Photos</p>
                <div className="grid grid-cols-2 gap-3">
                  {request.photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="Product" className="w-full h-40 object-cover rounded-xl border border-slate-800" />
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setTab('respond')}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl transition-all">
              {myResponse ? 'Update My Price' : 'Submit Price →'}
            </button>
          </div>
        )}

        {/* ── RESPOND TAB ── */}
        {tab === 'respond' && (
          <form onSubmit={handleSubmitResponse} className="space-y-4 py-4">
            {sent && (
              <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/30 text-emerald-400 rounded-xl p-4 font-bold text-sm">
                <CheckCircle2 size={18} /> Price submitted successfully!
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Supplier Name *</label>
              <input type="text" required value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. Guangzhou Electronics Co."
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Supplier Contact (WeChat / Phone)</label>
              <input type="text" value={supplierContact} onChange={e => setSupplierContact(e.target.value)} placeholder="WeChat ID or phone number"
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Price *</label>
                <input type="number" step="0.01" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold">
                  <option value="USD">USD</option>
                  <option value="CNY">CNY ¥</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">MOQ (min order)</label>
                <input type="number" value={moq} onChange={e => setMoq(e.target.value)} placeholder="e.g. 100"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lead Time (days)</label>
                <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 7"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Quality notes, product specs, anything important..."
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold resize-none" />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Supplier Photos</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-xl border border-slate-800" />
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
                  </div>
                ))}
                <label className="w-full h-24 border-2 border-dashed border-slate-700 hover:border-[#F15D38] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-[#F15D38]">
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <><ImagePlus size={20} /><span className="text-[9px] font-bold mt-1">Add Photo</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                </label>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : (myResponse ? 'Update Price' : 'Submit Price')}
            </button>
          </form>
        )}

        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 py-4">
              {messages.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm font-bold">No messages yet. Start a conversation with Q Cargo.</div>
              )}
              {messages.map(m => (
                <div key={m._id} className={`flex ${m.fromAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-bold ${m.fromAgent ? 'bg-[#F15D38] text-white rounded-br-sm' : 'bg-[#131B2E] border border-slate-800 text-slate-100 rounded-bl-sm'}`}>
                    {!m.fromAgent && <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Q Cargo</p>}
                    {m.text}
                    <p className={`text-[9px] mt-1 ${m.fromAgent ? 'text-white/60' : 'text-slate-500'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {/* Admin typing indicator */}
              {adminTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#131B2E] border border-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-slate-800">
              <input type="text" value={chatText}
                onChange={e => {
                  setChatText(e.target.value);
                  if (agent) fetch('/api/pricing/typing', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: id, agentId: agent.id, role: 'agent' }) }).catch(() => {});
                }}
                placeholder="Type a message..."
                className="flex-1 bg-[#131B2E] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              <button type="submit" disabled={sending || !chatText.trim()}
                className="bg-[#F15D38] hover:bg-[#d64420] text-white px-4 rounded-xl transition-all disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
