'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ChevronRight, Bell, MapPin, MessageSquare,
  Clock, CheckCircle2, AlertCircle, Package, Phone,
  Globe, ExternalLink, Copy, Check, UserCog,
} from 'lucide-react';

// ── Brand social icons (real SVG logos) ─────────────────────────────────────────
const FacebookIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);
const InstagramIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 002.12-1.38 5.86 5.86 0 001.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 00-1.38-2.12A5.86 5.86 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z" />
    <path d="M12 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84M12 16a4 4 0 114-4 4 4 0 01-4 4z" />
    <circle cx="18.41" cy="5.59" r="1.44" />
  </svg>
);
const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

// ── Contacts ──────────────────────────────────────────────────────────────────
const CONTACTS = [
  { name: 'Zakaria', role: 'Admin', wa: '252634508824', wc: '252634508824' },
  { name: 'Khalid',  role: 'Partner', wa: '252634845067', wc: '252634845067' },
  { name: 'Sales',   role: 'Sales Team', wa: '252638884837', wc: null },
  { name: 'Operations', role: 'Ops Team', wa: '252638884835', wc: null },
];

const SOCIAL = [
  { name: 'Facebook',  Icon: FacebookIcon,  url: 'https://facebook.com/qcargologistics',  bg: '#1877F2' },
  { name: 'Instagram', Icon: InstagramIcon, url: 'https://instagram.com/qcargologistics', bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' },
  { name: 'TikTok',    Icon: TikTokIcon,    url: 'https://tiktok.com/@qcargologistics',   bg: '#010101' },
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
    loading: 'Loading your portal...', profile: 'My Profile', completeProfile: 'Complete your profile',
    completeProfileSub: 'Add your contact details so Q Cargo can reach you.', completeCta: 'Complete now →',
    openChat: 'Open Chat',
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
    loading: 'جارٍ التحميل...', profile: 'ملفي الشخصي', completeProfile: 'أكمل ملفك الشخصي',
    completeProfileSub: 'أضف بيانات تواصلك ليتمكن Q كارغو من الوصول إليك.', completeCta: 'أكمل الآن ←',
    openChat: 'فتح المحادثة',
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
    loading: '加载中...', profile: '我的资料', completeProfile: '完善您的资料',
    completeProfileSub: '添加您的联系方式，方便 Q Cargo 联系您。', completeCta: '立即完善 →',
    openChat: '打开聊天',
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

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
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
    if (!sessionStorage.getItem('qcargo_agent_session')) {
      const lastActive = localStorage.getItem('qcargo_agent_last_active');
      const elapsed = lastActive ? Date.now() - parseInt(lastActive, 10) : Infinity;
      if (elapsed < GRACE_MS) {
        sessionStorage.setItem('qcargo_agent_session', '1');
      } else {
        localStorage.removeItem('qcargo_agent_token');
        localStorage.removeItem('qcargo_agent');
        router.replace('/agent/login');
        return;
      }
    }

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
        // First login — send the agent to complete their profile.
        if (data.agent && !data.agent.profileComplete) {
          router.replace('/agent/profile');
          return;
        }
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

    // Keep unread count fresh without leaving the page
    const unreadPoll = setInterval(() => {
      fetch('/api/agent/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) { setUnread(d.unread || 0); if (Array.isArray(d.requests)) setRequests(d.requests); } })
        .catch(() => {});
    }, 20000);

    return () => { clearInterval(activityInterval); clearInterval(hbInterval); clearInterval(adminInterval); clearInterval(unreadPoll); };
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
  const avatarColor = agent?.avatarColor || '#F15D38';
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

  // ── Reusable blocks (shared by mobile + desktop) ──────────────────────────────
  const ContactBlock = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CONTACTS.map(c => (
        <div key={c.name} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
          <p className="font-black text-slate-100 text-sm">{c.name}</p>
          <p className="text-[9px] font-bold text-slate-500 mb-3 uppercase tracking-widest">{c.role}</p>
          <div className="space-y-2">
            <a href={`https://wa.me/${c.wa}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all hover:brightness-110"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>
              <span className="text-base leading-none">💬</span>{t.wa} ↗
            </a>
            {c.wc && (
              <button onClick={() => copyWc(c.wc!)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all hover:brightness-110"
                style={{ background: 'rgba(7,193,96,0.10)', border: '1px solid rgba(7,193,96,0.22)', color: '#07C160' }}>
                {copiedWc === c.wc ? <><Check size={12} /> {t.copied}</> : <><Copy size={12} /> {t.wc}: {c.wc}</>}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const SocialBlock = (
    <div className="flex gap-2.5">
      {SOCIAL.map(s => (
        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} aria-label={s.name}
          className="group flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all hover:scale-[1.04]"
          style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.10)' }}>
          <span className="text-white"><s.Icon size={17} /></span>
        </a>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#131B2E]/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-sm shrink-0">Q</div>
            <div>
              <p className="text-sm font-black text-slate-100 leading-none">Q<span className="text-[#F15D38]">CARGO</span></p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
              {(['en','ar','zh'] as Lang[]).map(l => (
                <button key={l} onClick={() => changeLang(l)}
                  className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${lang === l ? 'bg-[#F15D38] text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                  {l === 'en' ? 'EN' : l === 'ar' ? 'ع' : '中'}
                </button>
              ))}
            </div>
            <button onClick={() => router.push('/agent/messages')} className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all" title={t.messages}>
              <MessageSquare size={18} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#F15D38] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{unread}</span>}
            </button>
            <button onClick={() => router.push('/agent/profile')} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all" title={t.profile}>
              <UserCog size={18} />
            </button>
            {/* Avatar */}
            <button onClick={() => router.push('/agent/profile')}
              className="w-8 h-8 rounded-lg overflow-hidden shrink-0 hover:ring-2 hover:ring-white/20 transition-all flex items-center justify-center font-black text-white text-xs"
              style={agent?.photo ? {} : { backgroundColor: avatarColor }} title={agent?.name}>
              {agent?.photo
                ? <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" />
                : initials(agent?.name)}
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all" title="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">

        {/* ── WELCOME ─────────────────────────────────────────────────────── */}
        <div className="py-6 border-b border-slate-800/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg flex items-center justify-center font-black text-white text-lg sm:text-xl"
                style={agent?.photo ? {} : { backgroundColor: avatarColor }}>
                {agent?.photo
                  ? <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" />
                  : initials(agent?.name)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
                  {getGreeting(lang, t)}, <span className="text-[#F15D38]">{agent?.name?.split(' ')[0] || ''}</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{formatDate(lang)}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${adminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className={`text-[10px] font-black ${adminOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {adminOnline ? t.online : `${t.offline}${adminLastSeen ? ` · ${lastSeenText(adminLastSeen)}` : ''}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                <MapPin size={11} />{agent?.city}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-5">
          {[
            { label: t.open,      value: openCount,        icon: AlertCircle,  color: 'text-amber-400',   top: '#f59e0b' },
            { label: t.submitted, value: submitted.length, icon: Clock,        color: 'text-blue-400',    top: '#3b82f6' },
            { label: t.completed, value: completedCount,   icon: CheckCircle2, color: 'text-emerald-400', top: '#0d9488' },
            { label: t.messages,  value: unread,           icon: MessageSquare,color: 'text-[#F15D38]',   top: '#F15D38' },
          ].map(s => (
            <div key={s.label} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-3.5 sm:p-4"
              style={{ borderTopWidth: '2px', borderTopColor: s.top }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <s.icon size={15} className={s.color} />
              </div>
              <p className={`text-2xl sm:text-[28px] font-bold leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID (1-col mobile, 3-col desktop) ─────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mt-8">

          {/* LEFT — Requests (spans 2 on desktop) */}
          <div className="lg:col-span-2">
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
                  const needsAction = !resp && (r.status === 'OPEN' || r.status === 'IN_PROGRESS');
                  const statusColor = r.status === 'COMPLETED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' :
                                      r.status === 'IN_PROGRESS' ? 'bg-blue-950/30 text-blue-400 border-blue-800/30' :
                                      'bg-amber-950/30 text-amber-400 border-amber-800/30';
                  return (
                    <button key={r._id} onClick={() => router.push(`/agent/request/${r._id}`)}
                      className={`w-full text-left bg-[#131B2E] border rounded-2xl p-4 sm:p-5 transition-all group hover:border-[#F15D38]/40 hover:shadow-lg ${needsAction ? 'border-slate-700 border-l-[3px] border-l-[#F15D38]' : 'border-slate-800'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-[9px] font-black text-slate-600 font-mono">{r.requestNumber}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel[r.status] || r.status}</span>
                            {resp && <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-950/30 text-emerald-400 border-emerald-800/30">{t.priced}</span>}
                            {tag && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${dlTagColors[tag]}`}>{dlTagLabels[tag]}</span>}
                          </div>
                          <p className="font-bold text-slate-100 text-sm sm:text-base truncate">{r.productName}</p>
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

          {/* RIGHT — Contact + Social (sidebar on desktop) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick chat CTA */}
            <button onClick={() => router.push('/agent/messages')}
              className="w-full flex items-center justify-between gap-3 bg-[#131B2E] border border-slate-800 hover:border-[#F15D38]/40 rounded-2xl px-4 py-4 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#F15D38]/15 border border-[#F15D38]/30 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare size={16} className="text-[#F15D38]" />
                </div>
                <span className="text-sm font-black text-slate-100">{t.openChat}</span>
              </div>
              <ChevronRight size={16} className="text-slate-700 group-hover:text-[#F15D38] transition-colors" />
            </button>

            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Phone size={11} /> {t.contact}
              </p>
              {ContactBlock}
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Globe size={11} /> {t.followUs}
              </p>
              {SocialBlock}
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-800/40 text-center space-y-2">
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
