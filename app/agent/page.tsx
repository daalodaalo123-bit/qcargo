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
  { name: 'Zakaria', role: 'Admin', wa: '252634508824', wc: '252634508824', color: 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400' },
  { name: 'Khalid', role: 'Partner', wa: '252634845067', wc: '252634845067', color: 'bg-blue-950/30 border-blue-800/30 text-blue-400' },
  { name: 'Sales', role: 'Sales Team', wa: '252638884837', wc: null, color: 'bg-[#F15D38]/10 border-[#F15D38]/30 text-[#F15D38]' },
  { name: 'Operations', role: 'Ops Team', wa: '252638884835', wc: null, color: 'bg-amber-950/30 border-amber-800/30 text-amber-400' },
];

const SOCIAL = [
  { name: 'Facebook', icon: '𝐟', url: 'https://facebook.com/qcargologistics', color: 'bg-blue-600 hover:bg-blue-500' },
  { name: 'Instagram', icon: '◈', url: 'https://instagram.com/qcargologistics', color: 'bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400' },
  { name: 'TikTok', icon: '♪', url: 'https://tiktok.com/@qcargologistics', color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700' },
];

// ── Translations ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'ar' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  en: {
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
    subtitle: 'Sourcing Agent Portal', online: 'Q Cargo is Online', offline: 'Q Cargo is Offline',
    open: 'Open', submitted: 'Submitted', completed: 'Completed', messages: 'Messages',
    requests: 'Your Requests', noRequests: 'No requests assigned yet.',
    for: 'For', qty: 'Qty', deadline: 'Deadline', yourPrice: 'Your Price',
    noPriceYet: 'No price submitted', viewDetails: 'View Details',
    contactTitle: 'Contact Q Cargo', waBtn: 'WhatsApp', wcBtn: 'WeChat',
    followUs: 'Follow Us', copy: 'Copy', copied: 'Copied!',
    urgent: 'URGENT', today: 'TODAY', overdue: 'OVERDUE',
    statusOpen: 'Open', statusInProgress: 'In Progress', statusCompleted: 'Completed', statusCancelled: 'Cancelled',
    priced: '✓ Priced',
    unreadMsg: 'unread message', unreadMsgs: 'unread messages', goToMessages: 'Go to Messages →',
  },
  ar: {
    greeting_morning: 'صباح الخير', greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير',
    subtitle: 'بوابة وكيل المصادر', online: 'Q كارغو متصل', offline: 'Q كارغو غير متصل',
    open: 'مفتوح', submitted: 'مُرسَل', completed: 'مكتمل', messages: 'رسائل',
    requests: 'طلباتك', noRequests: 'لا طلبات مسندة بعد.',
    for: 'لـ', qty: 'الكمية', deadline: 'الموعد', yourPrice: 'سعرك',
    noPriceYet: 'لم يُرسَل سعر', viewDetails: 'عرض التفاصيل',
    contactTitle: 'تواصل مع Q كارغو', waBtn: 'واتساب', wcBtn: 'ويتشات',
    followUs: 'تابعنا', copy: 'نسخ', copied: 'تم النسخ!',
    urgent: 'عاجل', today: 'اليوم', overdue: 'متأخر',
    statusOpen: 'مفتوح', statusInProgress: 'جارٍ', statusCompleted: 'مكتمل', statusCancelled: 'ملغي',
    priced: '✓ تم التسعير',
    unreadMsg: 'رسالة غير مقروءة', unreadMsgs: 'رسائل غير مقروءة', goToMessages: 'الذهاب للرسائل ←',
  },
  zh: {
    greeting_morning: '早上好', greeting_afternoon: '下午好', greeting_evening: '晚上好',
    subtitle: '采购代理门户', online: 'Q Cargo 在线', offline: 'Q Cargo 离线',
    open: '待处理', submitted: '已报价', completed: '已完成', messages: '消息',
    requests: '您的请求', noRequests: '暂无分配的请求。',
    for: '客户：', qty: '数量', deadline: '截止日期', yourPrice: '您的报价',
    noPriceYet: '未提交报价', viewDetails: '查看详情',
    contactTitle: '联系 Q Cargo', waBtn: 'WhatsApp', wcBtn: '微信',
    followUs: '关注我们', copy: '复制', copied: '已复制！',
    urgent: '紧急', today: '今天', overdue: '已逾期',
    statusOpen: '待处理', statusInProgress: '进行中', statusCompleted: '已完成', statusCancelled: '已取消',
    priced: '✓ 已报价',
    unreadMsg: '条未读消息', unreadMsgs: '条未读消息', goToMessages: '前往消息 →',
  },
};

function greeting(lang: Lang) {
  const h = new Date().getHours();
  const t = T[lang];
  if (h < 12) return t.greeting_morning;
  if (h < 18) return t.greeting_afternoon;
  return t.greeting_evening;
}

function formatDate(lang: Lang) {
  const locales: Record<Lang, string> = { en: 'en-GB', ar: 'ar-SA', zh: 'zh-CN' };
  return new Date().toLocaleDateString(locales[lang], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function deadlineStatus(deadline?: string) {
  if (!deadline) return null;
  const today = new Date().toISOString().split('T')[0];
  if (deadline < today) return 'overdue';
  if (deadline === today) return 'today';
  const diff = (new Date(deadline).getTime() - Date.now()) / 86400000;
  if (diff <= 3) return 'urgent';
  return null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent]           = useState<any>(null);
  const [requests, setRequests]     = useState<any[]>([]);
  const [responseMap, setResponseMap] = useState<Record<string, any>>({});
  const [unread, setUnread]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [lang, setLang]             = useState<Lang>('en');
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminLastSeen, setAdminLastSeen] = useState<string | null>(null);
  const [copiedWc, setCopiedWc]     = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (saved && ['en','ar','zh'].includes(saved)) setLang(saved);
  }, []);

  const changeLang = (l: Lang) => { setLang(l); localStorage.setItem('qcargo_agent_lang', l); };

  useEffect(() => {
    const token = localStorage.getItem('qcargo_agent_token');
    if (!token) { router.replace('/agent/login'); return; }
    const agentRaw = localStorage.getItem('qcargo_agent');
    if (agentRaw) setAgent(JSON.parse(agentRaw));

    fetch('/api/agent/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { localStorage.removeItem('qcargo_agent_token'); router.replace('/agent/login'); return null; } return r.json(); })
      .then(data => { if (!data) return; setAgent(data.agent); setRequests(data.requests); setResponseMap(data.responseMap || {}); setUnread(data.unread || 0); })
      .finally(() => setLoading(false));

    // Heartbeat + admin status polling
    const pingHeartbeat = () => fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    pingHeartbeat();
    const hbInt = setInterval(pingHeartbeat, 30000);

    const checkAdmin = () => fetch('/api/admin/heartbeat').then(r => r.json()).then(d => { setAdminOnline(d.online); setAdminLastSeen(d.lastSeen); }).catch(() => {});
    checkAdmin();
    const adminInt = setInterval(checkAdmin, 30000);

    return () => { clearInterval(hbInt); clearInterval(adminInt); };
  }, [router]);

  const handleLogout = () => { localStorage.removeItem('qcargo_agent_token'); localStorage.removeItem('qcargo_agent'); router.replace('/agent/login'); };

  const copyWeChat = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedWc(id);
    setTimeout(() => setCopiedWc(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#F15D38]/20 border-t-[#F15D38] rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading your portal...</p>
      </div>
    </div>
  );

  const t = T[lang];
  const isRtl = lang === 'ar';
  const open = requests.filter(r => r.status === 'OPEN');
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS');
  const completed = requests.filter(r => r.status === 'COMPLETED');
  const submitted = requests.filter(r => responseMap[r._id]);
  const statusLabel: Record<string, string> = { OPEN: t.statusOpen, IN_PROGRESS: t.statusInProgress, COMPLETED: t.statusCompleted, CANCELLED: t.statusCancelled };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#131B2E]/90 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-sm">Q</div>
            <div>
              <span className="text-sm font-black text-slate-100">Q<span className="text-[#F15D38]">CARGO</span></span>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">{t.subtitle}</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Lang switcher */}
            <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
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
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#F15D38] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
            </button>
            {/* Logout */}
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* ── WELCOME HERO ─────────────────────────────────────────────────── */}
        <div className="py-6 border-b border-slate-800/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-100">
                {greeting(lang)}, <span className="text-[#F15D38]">{agent?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-0.5">{formatDate(lang)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-black ${adminOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {adminOnline ? t.online : adminLastSeen ? `${t.offline} · ${timeAgo(adminLastSeen)}` : t.offline}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end"><MapPin size={10} />{agent?.city}</p>
              <p className="text-[10px] text-slate-600 font-bold">{agent?.country}</p>
              <p className="text-[9px] font-mono text-slate-700 mt-1">@{agent?.username}</p>
            </div>
          </div>
        </div>

        {/* ── UNREAD MESSAGE BANNER ─────────────────────────────────────────── */}
        {unread > 0 && (
          <div onClick={() => router.push('/agent/messages')}
            className="mt-5 flex items-center justify-between gap-3 bg-[#F15D38]/10 border border-[#F15D38]/30 rounded-2xl px-5 py-3.5 cursor-pointer hover:bg-[#F15D38]/15 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#F15D38] rounded-xl flex items-center justify-center">
                <Bell size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-100">{unread} {unread === 1 ? t.unreadMsg : t.unreadMsgs}</p>
                <p className="text-[10px] text-slate-400 font-bold">From Q Cargo</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#F15D38]">{t.goToMessages}</span>
          </div>
        )}

        {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: t.open, value: open.length + inProgress.length, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-800/20', icon: AlertCircle },
            { label: t.submitted, value: submitted.length, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-800/20', icon: Clock },
            { label: t.completed, value: completed.length, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/20', icon: CheckCircle2 },
            { label: t.messages, value: unread, color: 'text-[#F15D38]', bg: 'bg-[#F15D38]/10 border-[#F15D38]/20', icon: MessageSquare },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-3 text-center ${s.bg}`}>
              <s.icon size={16} className={`${s.color} mx-auto mb-1.5`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── REQUESTS LIST ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package size={12} /> {t.requests}
          </h2>
          {requests.length === 0 ? (
            <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-10 text-center">
              <Package size={28} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-slate-500">{t.noRequests}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => {
                const myResp = responseMap[r._id];
                const ds = deadlineStatus(r.deadline);
                const dsColors: Record<string, string> = {
                  overdue: 'text-rose-400 bg-rose-950/20 border-rose-800/30',
                  today: 'text-amber-400 bg-amber-950/20 border-amber-800/30',
                  urgent: 'text-orange-400 bg-orange-950/20 border-orange-800/30',
                };
                const dsLabels: Record<string, string> = { overdue: t.overdue, today: t.today, urgent: t.urgent };
                return (
                  <button key={r._id} onClick={() => router.push(`/agent/request/${r._id}`)}
                    className="w-full text-left bg-[#131B2E] border border-slate-800 hover:border-[#F15D38]/40 rounded-2xl p-4 transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="text-[9px] font-black text-slate-500 font-mono">{r.requestNumber}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            r.status === 'COMPLETED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' :
                            r.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400 border-blue-800/30' :
                            'bg-amber-950/30 text-amber-400 border-amber-800/30'
                          }`}>{statusLabel[r.status] || r.status}</span>
                          {myResp && <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-950/30 text-emerald-400 border-emerald-800/30">{t.priced}</span>}
                          {ds && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${dsColors[ds]}`}>{dsLabels[ds]}</span>}
                        </div>
                        {/* Product name */}
                        <p className="font-black text-slate-100 text-sm truncate">{r.productName}</p>
                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-bold">{t.for}: {r.customerName}</span>
                          <span className="text-[10px] text-slate-600">·</span>
                          <span className="text-[10px] text-slate-500 font-bold">{r.quantity} {r.unit}</span>
                          {r.deadline && <><span className="text-[10px] text-slate-600">·</span><span className="text-[10px] text-slate-500 font-bold">📅 {r.deadline}</span></>}
                        </div>
                        {/* My price */}
                        {myResp && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400">{t.yourPrice}: {myResp.unitPrice} {myResp.currency}</span>
                            <span className="text-[10px] text-slate-600">·</span>
                            <span className="text-[10px] text-slate-500">{myResp.supplierName}</span>
                          </div>
                        )}
                        {!myResp && r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
                          <p className="text-[10px] text-slate-600 mt-1.5 italic">{t.noPriceYet}</p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-slate-700 group-hover:text-[#F15D38] transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CONTACT Q CARGO ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Phone size={12} /> {t.contactTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CONTACTS.map(c => (
              <div key={c.name} className={`bg-[#131B2E] border rounded-2xl p-4 ${c.color.split(' ')[2] ? '' : ''}`} style={{ borderColor: 'rgb(51 65 85 / 0.5)' }}>
                <p className={`text-xs font-black mb-0.5 ${c.color.split(' ')[2]}`}>{c.name}</p>
                <p className="text-[9px] font-bold text-slate-500 mb-3">{c.role}</p>
                <div className="space-y-2">
                  {/* WhatsApp button */}
                  <a href={`https://wa.me/${c.wa}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl px-3 py-2 text-[10px] font-black transition-all">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.549 4.116 1.516 5.845L.023 23.88a.5.5 0 0 0 .617.617l6.035-1.493A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.858 9.858 0 0 1-5.022-1.37l-.36-.214-3.733.924.942-3.638-.235-.374A9.861 9.861 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/></svg>
                    {t.waBtn} ↗
                  </a>
                  {/* WeChat button */}
                  {c.wc && (
                    <button onClick={() => copyWeChat(c.wc!)}
                      className="w-full flex items-center gap-2 bg-[#07C160]/10 hover:bg-[#07C160]/20 border border-[#07C160]/30 text-[#07C160] rounded-xl px-3 py-2 text-[10px] font-black transition-all">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c-.306-.967-.461-1.99-.461-3.046 0-3.868 3.542-7 7.923-7 .189 0 .375.008.558.021C15.956 4.148 12.567 2.188 8.691 2.188zm-2.48 3.22a1.013 1.013 0 1 1 0 2.026 1.013 1.013 0 0 1 0-2.026zm4.975 0a1.013 1.013 0 1 1 0 2.026 1.013 1.013 0 0 1 0-2.026zM24 14.47c0-3.516-3.337-6.37-7.455-6.37-4.118 0-7.455 2.854-7.455 6.37s3.337 6.37 7.455 6.37c.84 0 1.65-.12 2.41-.34a.71.71 0 0 1 .59.08l1.57.92a.27.27 0 0 0 .14.04.24.24 0 0 0 .24-.24c0-.06-.02-.11-.04-.17l-.32-1.22a.49.49 0 0 1 .18-.55C23.016 18.395 24 16.518 24 14.47zm-10.02-1.145a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7zm5.12 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7z"/></svg>
                      {copiedWc === c.wc ? <><Check size={10} /> {t.copied}</> : <>{t.wcBtn}: {c.wc}</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOCIAL MEDIA ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Globe size={12} /> {t.followUs}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {SOCIAL.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-xs transition-all ${s.color}`}>
                <span className="text-2xl leading-none">{s.icon}</span>
                <span className="text-[10px] uppercase tracking-widest">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-800/50 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-xs">Q</div>
            <span className="text-sm font-black text-slate-400">Q<span className="text-[#F15D38]">CARGO</span> <span className="font-bold text-slate-600">Logistics</span></span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold">Hargeisa, Somaliland</p>
          <a href="https://qcargologistics.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-[#F15D38] font-bold transition-colors">
            <Globe size={10} /> qcargologistics.com <ExternalLink size={9} />
          </a>
          <p className="text-[9px] text-slate-700 font-bold pt-2">Powered by Q Cargo ERP System</p>
        </div>

      </div>
    </div>
  );
}
