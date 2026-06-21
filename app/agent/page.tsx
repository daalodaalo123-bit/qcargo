'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Package, Clock, CheckCircle2, AlertCircle, ChevronRight, Bell, MapPin, MessageSquare } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  IN_PROGRESS: 'bg-blue-950/30 text-blue-400 border-blue-800/30',
  COMPLETED: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
  CANCELLED: 'bg-slate-900 text-slate-500 border-slate-800',
};

type Lang = 'en' | 'ar' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  en: { welcome: 'Welcome back', openReqs: 'open request', openReqsP: 'open requests', waiting: 'waiting for pricing', open: 'Open', inProgress: 'In Progress', completed: 'Completed', assigned: 'Your Assigned Requests', noReqs: 'No requests assigned to you yet.', for: 'For', deadline: 'Deadline', yourPrice: 'Your price', statusOpen: 'Open', statusInProgress: 'In Progress', statusCompleted: 'Completed', statusCancelled: 'Cancelled', priced: '✓ Priced' },
  ar: { welcome: 'أهلاً بعودتك', openReqs: 'طلب مفتوح', openReqsP: 'طلبات مفتوحة', waiting: 'بانتظار التسعير', open: 'مفتوح', inProgress: 'جارٍ', completed: 'مكتمل', assigned: 'الطلبات المسندة إليك', noReqs: 'لا طلبات مسندة إليك بعد.', for: 'لـ', deadline: 'الموعد النهائي', yourPrice: 'سعرك', statusOpen: 'مفتوح', statusInProgress: 'جارٍ', statusCompleted: 'مكتمل', statusCancelled: 'ملغي', priced: '✓ تم التسعير' },
  zh: { welcome: '欢迎回来', openReqs: '个未完成请求', openReqsP: '个未完成请求', waiting: '等待报价', open: '待处理', inProgress: '进行中', completed: '已完成', assigned: '分配给您的请求', noReqs: '暂无分配给您的请求。', for: '客户：', deadline: '截止日期', yourPrice: '您的报价', statusOpen: '待处理', statusInProgress: '进行中', statusCompleted: '已完成', statusCancelled: '已取消', priced: '✓ 已报价' },
};

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [responseMap, setResponseMap] = useState<Record<string, any>>({});
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (saved && ['en','ar','zh'].includes(saved)) setLang(saved);
  }, []);

  const changeLang = (l: Lang) => { setLang(l); localStorage.setItem('qcargo_agent_lang', l); };
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminLastSeen, setAdminLastSeen] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('qcargo_agent_token');
    if (!token) { router.replace('/agent/login'); return; }
    fetch('/api/agent/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { localStorage.removeItem('qcargo_agent_token'); router.replace('/agent/login'); return null; } return r.json(); })
      .then(data => { if (!data) return; setAgent(data.agent); setRequests(data.requests); setResponseMap(data.responseMap || {}); setUnread(data.unread || 0); })
      .finally(() => setLoading(false));

    // Ping agent heartbeat every 30s
    const pingHeartbeat = () => fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    pingHeartbeat();
    const hbInterval = setInterval(pingHeartbeat, 30000);

    // Poll admin online status every 30s
    const checkAdmin = () => fetch('/api/admin/heartbeat').then(r => r.json()).then(d => { setAdminOnline(d.online); setAdminLastSeen(d.lastSeen); }).catch(() => {});
    checkAdmin();
    const adminInterval = setInterval(checkAdmin, 30000);

    return () => { clearInterval(hbInterval); clearInterval(adminInterval); };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('qcargo_agent_token');
    localStorage.removeItem('qcargo_agent');
    router.replace('/agent/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#F15D38]/20 border-t-[#F15D38] rounded-full animate-spin" />
    </div>
  );

  const open = requests.filter(r => r.status === 'OPEN');
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS');
  const completed = requests.filter(r => r.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100">
      {/* Top bar */}
      <header className="bg-[#131B2E] border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-slate-100">Q<span className="text-[#F15D38]">CARGO</span></span>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={`text-[10px] font-black ${adminOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
              {adminOnline ? 'Q Cargo Online' : adminLastSeen ? `Q Cargo — ${(() => { const diff = Date.now() - new Date(adminLastSeen).getTime(); const m = Math.floor(diff/60000); return m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`; })()}` : 'Q Cargo Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Direct messages button */}
          <button onClick={() => router.push('/agent/messages')}
            className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all">
            <MessageSquare size={18} />
            {unread > 0 && <span className="absolute -top-1 -right-1 bg-[#F15D38] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
          </button>
          {/* Language switcher */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(['en','ar','zh'] as Lang[]).map(l => (
              <button key={l} onClick={() => changeLang(l)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${lang === l ? 'bg-[#F15D38] text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                {l === 'en' ? 'EN' : l === 'ar' ? 'ع' : '中'}
              </button>
            ))}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-100">{agent?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 justify-end"><MapPin size={10} />{agent?.city}, {agent?.country}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <h1 className="text-2xl font-black text-slate-100">{T[lang].welcome}, {agent?.name?.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm mt-1">{open.length} {open.length === 1 ? T[lang].openReqs : T[lang].openReqsP} {T[lang].waiting}.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: T[lang].open, value: open.length, icon: AlertCircle, color: 'text-amber-400' },
            { label: T[lang].inProgress, value: inProgress.length, icon: Clock, color: 'text-blue-400' },
            { label: T[lang].completed, value: completed.length, icon: CheckCircle2, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 text-center">
              <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Requests list */}
        <div className="space-y-3" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{T[lang].assigned}</h2>
          {requests.length === 0 ? (
            <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-10 text-center">
              <Package size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-slate-500">{T[lang].noReqs}</p>
            </div>
          ) : requests.map(r => {
            const myResponse = responseMap[r._id];
            const hasResponse = !!myResponse;
            const statusLabel: Record<string, string> = { OPEN: T[lang].statusOpen, IN_PROGRESS: T[lang].statusInProgress, COMPLETED: T[lang].statusCompleted, CANCELLED: T[lang].statusCancelled };
            return (
              <button key={r._id} onClick={() => router.push(`/agent/request/${r._id}`)}
                className="w-full bg-[#131B2E] border border-slate-800 hover:border-slate-600 rounded-2xl p-5 text-left transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-500 font-mono">{r.requestNumber}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[r.status]}`}>{statusLabel[r.status] || r.status}</span>
                      {hasResponse && <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-950/30 text-emerald-400 border-emerald-800/30">{T[lang].priced}</span>}
                    </div>
                    <p className="font-black text-slate-100 text-sm truncate">{r.productName}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{T[lang].for}: {r.customerName} · {r.quantity} {r.unit}</p>
                    {r.deadline && <p className="text-[10px] text-slate-500 mt-1">{T[lang].deadline}: {r.deadline}</p>}
                    {hasResponse && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-1">
                        {T[lang].yourPrice}: {myResponse.unitPrice} {myResponse.currency} / {r.unit} — {myResponse.supplierName}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-600 group-hover:text-[#F15D38] transition-colors shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
