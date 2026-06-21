'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ChevronRight, Bell, MapPin, MessageSquare,
  Clock, CheckCircle2, AlertCircle, Package, Phone,
  Globe, ExternalLink, Copy, Check,
} from 'lucide-react';

// ── Contacts ──────────────────────────────────────────────────────────────────
const CONTACTS = [
  { name: 'Zakaria', role: 'Admin', wa: '252634508824', wc: '252634508824' },
  { name: 'Khalid',  role: 'Partner', wa: '252634845067', wc: '252634845067' },
  { name: 'Sales',   role: 'Sales Team', wa: '252638884837', wc: null },
  { name: 'Operations', role: 'Ops Team', wa: '252638884835', wc: null },
];

const SOCIAL = [
  { name: 'Facebook',  emoji: '📘', url: 'https://facebook.com/qcargologistics',   bg: '#1877F2' },
  { name: 'Instagram', emoji: '📸', url: 'https://instagram.com/qcargologistics',  bg: '#E1306C' },
  { name: 'TikTok',    emoji: '🎵', url: 'https://tiktok.com/@qcargologistics',    bg: '#010101' },
];

// ── Translations ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'ar' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  en: {
    g_morning: 'Good morning', g_afternoon: 'Good afternoon', g_evening: 'Good evening',
    subtitle: 'Sourcing Agent Portal', online: 'Q Cargo is Online', offline: 'Q Cargo is Offline',
    open: 'Open', submitted: 'Submitted', completed: 'Completed', messages: 'Messages',
    requests: 'Your Requests', noReqs: 'No requests assigned yet.',
    for: 'For', deadline: 'Deadline', yourPrice: 'Your Price', noPrice: 'No price yet',
    contact: 'Contact Q Cargo', wa: 'WhatsApp', wc: 'WeChat ID',
    copied: 'Copied!', followUs: 'Follow Us',
    urgent: 'URGENT', today: 'TODAY', overdue: 'OVERDUE', priced: '✓ Priced',
    statusOpen: 'Open', statusInProgress: 'In Progress', statusCompleted: 'Completed', statusCancelled: 'Cancelled',
    unread1: 'unread message from Q Cargo', unreadN: 'unread messages from Q Cargo', goMsg: 'Open Messages →',
    loading: 'Loading your portal...',
  },
  ar: {
    g_morning: 'صباح الخير', g_afternoon: 'مساء الخير', g_evening: 'مساء الخير',
    subtitle: 'بوابة وكيل المصادر', online: 'Q كارغو متصل', offline: 'Q كارغو غير متصل',
    open: 'مفتوح', submitted: 'مُرسَل', completed: 'مكتمل', messages: 'رسائل',
    requests: 'طلباتك', noReqs: 'لا طلبات مسندة بعد.',
    for: 'لـ', deadline: 'الموعد', yourPrice: 'سعرك', noPrice: 'لم يُرسَل سعر',
    contact: 'تواصل مع Q كارغو', wa: 'واتساب', wc: 'معرف ويتشات',
    copied: 'تم النسخ!', followUs: 'تابعنا',
    urgent: 'عاجل', today: 'اليوم', overdue: 'متأخر', priced: '✓ تم التسعير',
    statusOpen: 'مفتوح', statusInProgress: 'جارٍ', statusCompleted: 'مكتمل', statusCancelled: 'ملغي',
    unread1: 'رسالة غير مقروءة من Q كارغو', unreadN: 'رسائل غير مقروءة', goMsg: 'فتح الرسائل ←',
    loading: 'جارٍ التحميل...',
  },
  zh: {
    g_morning: '早上好', g_afternoon: '下午好', g_evening: '晚上好',
    subtitle: '采购代理门户', online: 'Q Cargo 在线', offline: 'Q Cargo 离线',
    open: '待处理', submitted: '已报价', completed: '已完成', messages: '消息',
    requests: '您的请求', noReqs: '暂无分配的请求。',
    for: '客户', deadline: '截止', yourPrice: '报价', noPrice: '未提交报价',
    contact: '联系 Q Cargo', wa: 'WhatsApp', wc: '微信号',
    copied: '已复制！', followUs: '关注我们',
    urgent: '紧急', today: '今天', overdue: '逾期', priced: '✓ 已报价',
    statusOpen: '待处理', statusInProgress: '进行中', statusCompleted: '已完成', statusCancelled: '已取消',
    unread1: '条来自 Q Cargo 的未读消息', unreadN: '条未读消息', goMsg: '前往消息 →',
    loading: '加载中...',
  },
};

function getGreeting(lang: Lang, t: Record<string, string>) {
  const h = new Date().getHours();
  if (h < 12) return t.g_morning;
  if (h < 18) return t.g_afternoon;
  return t.g_evening;
}

function formatDate(lang: Lang) {
  const locales: Record<Lang, string> = { en: 'en-GB', ar: 'ar-SA', zh: 'zh-CN' };
  return new Date().toLocaleDateString(locales[lang], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function deadlineTag(deadline?: string): 'overdue' | 'today' | 'urgent' | null {
  if (!deadline) return null;
  const today = new Date().toISOString().split('T')[0];
  if (deadline < today) return 'overdue';
  if (deadline === today) return 'today';
  const diffDays = (new Date(deadline).getTime() - Date.now()) / 86400000;
  if (diffDays <= 3) return 'urgent';
  return null;
}

function lastSeenText(date: string | null) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const GRACE_MS = 10 * 60 * 1000; // 10-minute grace period

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent]               = useState<any>(null);
  const [requests, setRequests]         = useState<any[]>([]);
  const [responseMap, setResponseMap]   = useState<Record<string, any>>({});
  const [unread, setUnread]             = useState(0);
  const [loading, setLoading]           = useState(true);
  const [lang, setLang]                 = useState<Lang>('en');
  const [adminOnline, setAdminOnline]   = useState(false);
  const [adminLastSeen, setAdminLastSeen] = useState<string | null>(null);
  const [copiedWc, setCopiedWc]         = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (saved && ['en','ar','zh'].includes(saved)) setLang(saved);
  }, []);

  const changeLang = (l: Lang) => { setLang(l); localStorage.setItem('qcargo_agent_lang', l); };

  useEffect(() => {
    const token = localStorage.getItem('qcargo_agent_token');
    if (!token) { router.replace('/agent/login'); return; }

    // ── Tab-close grace period ───────────────────────────────────────────────
    // If sessionStorage flag is missing (tab was closed), check how long ago
    if (!sessionStorage.getItem('qcargo_agent_session')) {
      const lastActive = localStorage.getItem('qcargo_agent_last_active');
      const elapsed = lastActive ? Date.now() - parseInt(lastActive, 10) : Infinity;
      if (elapsed < GRACE_MS) {
        // Within grace period — restore session quietly
        sessionStorage.setItem('qcargo_agent_session', '1');
      } else {
        // Too long — force re-login
        localStorage.removeItem('qcargo_agent_token');
        localStorage.removeItem('qcargo_agent');
        router.replace('/agent/login');
        return;
      }
    }

    // Update last_active every 60s while tab is open
    const activityInterval = setInterval(() => {
      localStorage.setItem('qcargo_agent_last_active', String(Date.now()));
    }, 60000);
    localStorage.setItem('qcargo_agent_last_active', String(Date.now()));

    const agentRaw = localStorage.getItem('qcargo_agent');
    if (agentRaw) setAgent(JSON.parse(agentRaw));

    fetch('/api/agent/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('qcargo_agent_token');
          sessionStorage.removeItem('qcargo_agent_session');
          router.replace('/agent/login');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setAgent(data.agent);
        setRequests(data.requests);
        setResponseMap(data.responseMap || {});
        setUnread(data.unread || 0);
      })
      .finally(() => setLoading(false));

    // Heartbeat
    const ping = () => fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    ping();
    const hbInterval = setInterval(ping, 30000);

    // Admin status poll
    const checkAdmin = () => fetch('/api/admin/heartbeat').then(r => r.json()).then(d => { setAdminOnline(d.online); setAdminLastSeen(d.lastSeen); }).catch(() => {});
    checkAdmin();
    const adminInterval = setInterval(checkAdmin, 30000);

    return () => { clearInterval(activityInterval); clearInterval(hbInterval); clearInterval(adminInterval); };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('qcargo_agent_token');
    localStorage.removeItem('qcargo_agent');
    localStorage.removeItem('qcargo_agent_last_active');
    sessionStorage.removeItem('qcargo_agent_session');
    router.replace('/agent/login');
  };

  const copyWc = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopiedWc(id);
    setTimeout(() => setCopiedWc(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#F15D38]/20 border-t-[#F15D38] rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{T[lang].loading}</p>
      </div>
    </div>
  );

  const t = T[lang];
  const isRtl = lang === 'ar';
  const submitted = requests.filter(r => responseMap[r._id]);
  const openCount = requests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const statusLabel: Record<string, string> = {
    OPEN: t.statusOpen, IN_PROGRESS: t.statusInProgress,
    COMPLETED: t.statusCompleted, CANCELLED: t.statusCancelled,
  };
  const dlTagColors: Record<string, string> = {
    overdue: 'bg-rose-950/30 text-rose-400 border-rose-800/30',
    today:   'bg-amber-950/30 text-amber-400 border-amber-800/30',
    urgent:  'bg-orange-950/30 text-orange-400 border-orange-800/30',
  };
  const dlTagLabels: Record<string, string> = { overdue: t.overdue, today: t.today, urgent: t.urgent };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#131B2E]/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-sm shrink-0">Q</div>
            <div>
              <p className="text-sm font-black text-slate-100 leading-none">Q<span className="text-[#F15D38]">CARGO</span></p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Lang */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
              {(['en','ar','zh'] as Lang[]).map(l => (
                <button key={l} onClick={() => changeLang(l)}
                  className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${lang === l ? 'bg-[#F15D38] text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                  {l === 'en' ? 'EN' : l === 'ar' ? 'ع' : '中'}
                </button>
              ))}
            </div>
            {/* Messages */}
            <button onClick={() => router.push('/agent/messages')} className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all">
              <MessageSquare size={18} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#F15D38] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{unread}</span>}
            </button>
            {/* Logout */}
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* ── WELCOME ─────────────────────────────────────────────────────── */}
        <div className="py-6 border-b border-slate-800/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-100">
                {getGreeting(lang, t)}, <span className="text-[#F15D38]">{agent?.name?.split(' ')[0] || ''}</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">{formatDate(lang)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-block w-2 h-2 rounded-full ${adminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-black ${adminOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {adminOnline ? t.online : `${t.offline}${adminLastSeen ? ` · ${lastSeenText(adminLastSeen)}` : ''}`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                <MapPin size={10} />{agent?.city}
              </p>
              <p className="text-[10px] text-slate-600 font-bold">{agent?.country}</p>
            </div>
          </div>
        </div>

        {/* ── UNREAD BANNER ───────────────────────────────────────────────── */}
        {unread > 0 && (
          <button onClick={() => router.push('/agent/messages')} className="w-full mt-4 flex items-center justify-between gap-3 bg-[#F15D38]/10 border border-[#F15D38]/30 rounded-2xl px-4 py-3 hover:bg-[#F15D38]/15 transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#F15D38] rounded-xl flex items-center justify-center shrink-0">
                <Bell size={15} className="text-white" />
              </div>
              <p className="text-sm font-black text-slate-100">
                {unread} {unread === 1 ? t.unread1 : t.unreadN}
              </p>
            </div>
            <span className="text-xs font-black text-[#F15D38] shrink-0">{t.goMsg}</span>
          </button>
        )}

        {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2.5 mt-5">
          {[
            { label: t.open,      value: openCount,        icon: AlertCircle,  color: 'text-amber-400',    bg: 'bg-amber-950/20 border-amber-800/20' },
            { label: t.submitted, value: submitted.length, icon: Clock,        color: 'text-blue-400',     bg: 'bg-blue-950/20 border-blue-800/20' },
            { label: t.completed, value: completedCount,   icon: CheckCircle2, color: 'text-emerald-400',  bg: 'bg-emerald-950/20 border-emerald-800/20' },
            { label: t.messages,  value: unread,           icon: MessageSquare,color: 'text-[#F15D38]',    bg: 'bg-[#F15D38]/10 border-[#F15D38]/20' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-3 text-center ${s.bg}`}>
              <s.icon size={15} className={`${s.color} mx-auto mb-1.5`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── REQUESTS ────────────────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Package size={11} /> {t.requests}
          </p>
          {requests.length === 0 ? (
            <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-10 text-center">
              <Package size={26} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-bold text-slate-500">{t.noReqs}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => {
                const resp = responseMap[r._id];
                const tag  = deadlineTag(r.deadline);
                const statusColor = r.status === 'COMPLETED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' :
                                    r.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400 border-blue-800/30' :
                                    'bg-amber-950/30 text-amber-400 border-amber-800/30';
                return (
                  <button key={r._id} onClick={() => router.push(`/agent/request/${r._id}`)}
                    className="w-full text-left bg-[#131B2E] border border-slate-800 hover:border-[#F15D38]/40 rounded-2xl p-4 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-black text-slate-600 font-mono">{r.requestNumber}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel[r.status] || r.status}</span>
                          {resp && <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-950/30 text-emerald-400 border-emerald-800/30">{t.priced}</span>}
                          {tag && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${dlTagColors[tag]}`}>{dlTagLabels[tag]}</span>}
                        </div>
                        <p className="font-black text-slate-100 text-sm truncate">{r.productName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-bold">{t.for}: {r.customerName}</span>
                          <span className="text-slate-700 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-500 font-bold">{r.quantity} {r.unit}</span>
                          {r.deadline && <><span className="text-slate-700 text-[10px]">·</span><span className="text-[10px] text-slate-500">📅 {r.deadline}</span></>}
                        </div>
                        {resp ? (
                          <p className="text-[10px] text-emerald-400 font-black mt-1.5">{t.yourPrice}: {resp.unitPrice} {resp.currency} · {resp.supplierName}</p>
                        ) : r.status !== 'COMPLETED' && (
                          <p className="text-[10px] text-slate-600 italic mt-1.5">{t.noPrice}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-[#F15D38] transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CONTACT Q CARGO ─────────────────────────────────────────────── */}
        <div className="mt-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Phone size={11} /> {t.contact}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CONTACTS.map(c => (
              <div key={c.name} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4">
                <p className="font-black text-slate-100 text-sm">{c.name}</p>
                <p className="text-[9px] font-bold text-slate-500 mb-3">{c.role}</p>
                <div className="space-y-2">
                  {/* WhatsApp */}
                  <a href={`https://wa.me/${c.wa}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all"
                    style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>
                    <span className="text-base leading-none">💬</span>
                    {t.wa} ↗
                  </a>
                  {/* WeChat */}
                  {c.wc && (
                    <button onClick={() => copyWc(c.wc!)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all"
                      style={{ background: 'rgba(7,193,96,0.10)', border: '1px solid rgba(7,193,96,0.22)', color: '#07C160' }}>
                      <span className="text-base leading-none">💚</span>
                      {copiedWc === c.wc ? (
                        <><Check size={11} /> {t.copied}</>
                      ) : (
                        <><Copy size={11} /> {t.wc}: {c.wc}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOCIAL MEDIA ────────────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Globe size={11} /> {t.followUs}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SOCIAL.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all hover:opacity-80"
                style={{ backgroundColor: s.bg, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl leading-none">{s.emoji}</span>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-800/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-xs shrink-0">Q</div>
            <span className="text-sm font-black text-slate-400">Q<span className="text-[#F15D38]">CARGO</span> <span className="font-bold text-slate-600">Logistics</span></span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold">Hargeisa, Somaliland</p>
          <a href="https://qcargologistics.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#F15D38]/60 hover:text-[#F15D38] font-bold transition-colors">
            <Globe size={9} /> qcargologistics.com <ExternalLink size={8} />
          </a>
          <p className="text-[9px] text-slate-700 font-bold">Powered by Q Cargo ERP</p>
        </div>

      </div>
    </div>
  );
}
