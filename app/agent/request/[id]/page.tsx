'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';

// ── Translations (mirrors the agent dashboard's EN/AR/ZH dictionary) ────────────
type Lang = 'en' | 'ar' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  en: {
    tab_request: 'Request', tab_submit: 'Submit Price', tab_myprice: '✓ My Price', tab_chat: 'Chat',
    f_customer: 'Customer', f_quantity: 'Quantity', f_deadline: 'Deadline', f_noDeadline: 'No deadline',
    f_budget: 'Budget', f_notSpecified: 'Not specified',
    descSpecs: 'Description / Specs', productPhotos: 'Product Photos',
    updateMyPrice: 'Update My Price', submitPriceArrow: 'Submit Price →',
    submittedOk: 'Price submitted successfully!',
    supplierName: 'Supplier Name', supplierNamePh: 'e.g. Guangzhou Electronics Co.',
    supplierContact: 'Supplier Contact (WeChat / Phone)', supplierContactPh: 'WeChat ID or phone number',
    unitPrice: 'Unit Price', currency: 'Currency',
    moq: 'MOQ (min order)', moqPh: 'e.g. 100', leadTime: 'Lead Time (days)', leadTimePh: 'e.g. 7',
    notes: 'Notes', notesPh: 'Quality notes, product specs, anything important...',
    supplierPhotos: 'Supplier Photos', addPhoto: 'Add Photo',
    updatePrice: 'Update Price', submitPrice: 'Submit Price',
    noMessages: 'No messages yet. Start a conversation with Q Cargo.', qcargo: 'Q Cargo', typeMessage: 'Type a message...',
  },
  ar: {
    tab_request: 'الطلب', tab_submit: 'إرسال السعر', tab_myprice: '✓ سعري', tab_chat: 'المحادثة',
    f_customer: 'العميل', f_quantity: 'الكمية', f_deadline: 'الموعد النهائي', f_noDeadline: 'لا يوجد موعد',
    f_budget: 'الميزانية', f_notSpecified: 'غير محدد',
    descSpecs: 'الوصف / المواصفات', productPhotos: 'صور المنتج',
    updateMyPrice: 'تحديث سعري', submitPriceArrow: 'إرسال السعر ←',
    submittedOk: 'تم إرسال السعر بنجاح!',
    supplierName: 'اسم المورّد', supplierNamePh: 'مثال: شركة قوانغجو للإلكترونيات',
    supplierContact: 'تواصل المورّد (ويتشات / هاتف)', supplierContactPh: 'معرّف ويتشات أو رقم الهاتف',
    unitPrice: 'سعر الوحدة', currency: 'العملة',
    moq: 'الحد الأدنى للطلب', moqPh: 'مثال: 100', leadTime: 'مدة التسليم (أيام)', leadTimePh: 'مثال: 7',
    notes: 'ملاحظات', notesPh: 'ملاحظات الجودة، مواصفات المنتج، أي شيء مهم...',
    supplierPhotos: 'صور المورّد', addPhoto: 'إضافة صورة',
    updatePrice: 'تحديث السعر', submitPrice: 'إرسال السعر',
    noMessages: 'لا رسائل بعد. ابدأ محادثة مع Q كارغو.', qcargo: 'Q كارغو', typeMessage: 'اكتب رسالة...',
  },
  zh: {
    tab_request: '请求', tab_submit: '提交报价', tab_myprice: '✓ 我的报价', tab_chat: '聊天',
    f_customer: '客户', f_quantity: '数量', f_deadline: '截止日期', f_noDeadline: '无截止日期',
    f_budget: '预算', f_notSpecified: '未指定',
    descSpecs: '描述 / 规格', productPhotos: '产品照片',
    updateMyPrice: '更新我的报价', submitPriceArrow: '提交报价 →',
    submittedOk: '报价提交成功！',
    supplierName: '供应商名称', supplierNamePh: '例如：广州电子有限公司',
    supplierContact: '供应商联系方式（微信/电话）', supplierContactPh: '微信号或电话号码',
    unitPrice: '单价', currency: '货币',
    moq: '最小起订量', moqPh: '例如：100', leadTime: '交货周期（天）', leadTimePh: '例如：7',
    notes: '备注', notesPh: '质量备注、产品规格、任何重要信息...',
    supplierPhotos: '供应商照片', addPhoto: '添加照片',
    updatePrice: '更新报价', submitPrice: '提交报价',
    noMessages: '暂无消息。开始与 Q Cargo 对话。', qcargo: 'Q Cargo', typeMessage: '输入消息...',
  },
};

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
  const [lang, setLang]           = useState<Lang>('en');
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
    const saved = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (saved && ['en', 'ar', 'zh'].includes(saved)) setLang(saved);
  }, []);

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

  const t = T[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
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
        {(['request', 'respond', 'chat'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${tab === tb ? 'text-[#F15D38] border-b-2 border-[#F15D38]' : 'text-slate-400 hover:text-slate-200'}`}>
            {tb === 'request' ? t.tab_request : tb === 'respond' ? (myResponse ? t.tab_myprice : t.tab_submit) : (
              <span className="flex items-center justify-center gap-1.5">
                {t.tab_chat}
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
                { label: t.f_customer, value: request.customerName },
                { label: t.f_quantity, value: `${request.quantity} ${request.unit}` },
                { label: t.f_deadline, value: request.deadline || t.f_noDeadline },
                { label: t.f_budget, value: request.targetPrice ? `$${request.targetPrice}` : t.f_notSpecified },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#131B2E] border border-slate-800 rounded-xl p-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            {request.description && (
              <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.descSpecs}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{request.description}</p>
              </div>
            )}
            {request.photos?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.productPhotos}</p>
                <div className="grid grid-cols-2 gap-3">
                  {request.photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="Product" className="w-full h-40 object-cover rounded-xl border border-slate-800" />
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setTab('respond')}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl transition-all">
              {myResponse ? t.updateMyPrice : t.submitPriceArrow}
            </button>
          </div>
        )}

        {/* ── RESPOND TAB ── */}
        {tab === 'respond' && (
          <form onSubmit={handleSubmitResponse} className="space-y-4 py-4">
            {sent && (
              <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/30 text-emerald-400 rounded-xl p-4 font-bold text-sm">
                <CheckCircle2 size={18} /> {t.submittedOk}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.supplierName} *</label>
              <input type="text" required value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder={t.supplierNamePh}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.supplierContact}</label>
              <input type="text" value={supplierContact} onChange={e => setSupplierContact(e.target.value)} placeholder={t.supplierContactPh}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.unitPrice} *</label>
                <input type="number" step="0.01" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.currency}</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.moq}</label>
                <input type="number" value={moq} onChange={e => setMoq(e.target.value)} placeholder={t.moqPh}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.leadTime}</label>
                <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder={t.leadTimePh}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.notes}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t.notesPh}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold resize-none" />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.supplierPhotos}</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded-xl border border-slate-800" />
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
                  </div>
                ))}
                <label className="w-full h-24 border-2 border-dashed border-slate-700 hover:border-[#F15D38] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-[#F15D38]">
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <><ImagePlus size={20} /><span className="text-[9px] font-bold mt-1">{t.addPhoto}</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                </label>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : (myResponse ? t.updatePrice : t.submitPrice)}
            </button>
          </form>
        )}

        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 py-4">
              {messages.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm font-bold">{t.noMessages}</div>
              )}
              {messages.map(m => (
                <div key={m._id} className={`flex ${m.fromAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-bold ${m.fromAgent ? 'bg-[#F15D38] text-white rounded-br-sm' : 'bg-[#131B2E] border border-slate-800 text-slate-100 rounded-bl-sm'}`}>
                    {!m.fromAgent && <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">{t.qcargo}</p>}
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
                placeholder={t.typeMessage}
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
