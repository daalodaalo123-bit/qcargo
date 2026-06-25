'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';

type Lang = 'en' | 'ar' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  en: { title: 'Messages', subtitle: 'Q Cargo Office', online: 'Online', offline: 'Offline', noMsgs: 'No messages yet. Send the first one!', placeholder: 'Type a message...', chat: 'Chat', tasks: 'My Tasks', pending: 'pending', done: 'done', customer: 'Customer', product: 'Product', deadline: 'Deadline', notes: 'Notes', noTasks: 'No tasks assigned yet.' },
  ar: { title: 'الرسائل', subtitle: 'مكتب Q كارغو', online: 'متصل', offline: 'غير متصل', noMsgs: 'لا رسائل بعد. أرسل أول رسالة!', placeholder: 'اكتب رسالة...', chat: 'محادثة', tasks: 'مهامي', pending: 'معلق', done: 'منجز', customer: 'العميل', product: 'المنتج', deadline: 'الموعد', notes: 'ملاحظات', noTasks: 'لا مهام مسندة بعد.' },
  zh: { title: '消息', subtitle: 'Q Cargo 办公室', online: '在线', offline: '离线', noMsgs: '暂无消息。发送第一条！', placeholder: '输入消息...', chat: '聊天', tasks: '我的任务', pending: '待处理', done: '已完成', customer: '客户', product: '产品', deadline: '截止日期', notes: '备注', noTasks: '暂无分配任务。' },
};

export default function AgentMessagesPage() {
  const router = useRouter();
  const [agent, setAgent]           = useState<any>(null);
  const [messages, setMessages]     = useState<any[]>([]);
  const [tasks, setTasks]           = useState<any[]>([]);
  const [chatText, setChatText]     = useState('');
  const [sending, setSending]       = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [tab, setTab]               = useState<'chat' | 'tasks'>('chat');
  const [lang, setLang]             = useState<Lang>('en');
  const chatRef                     = useRef<HTMLDivElement>(null);
  const token                       = typeof window !== 'undefined' ? localStorage.getItem('qcargo_agent_token') : '';

  useEffect(() => {
    const saved = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (saved && ['en','ar','zh'].includes(saved)) setLang(saved);

    if (!token) { router.replace('/agent/login'); return; }
    const raw = localStorage.getItem('qcargo_agent');
    if (raw) setAgent(JSON.parse(raw));
    const ag = raw ? JSON.parse(raw) : null;
    if (!ag) return;

    const loadAll = () => Promise.all([
      fetch(`/api/direct-messages?agentId=${ag.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (Array.isArray(d)) setMessages(d); }),
      fetch(`/api/priority-tasks?agentId=${ag.id}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setTasks(d); }),
      fetch('/api/admin/heartbeat').then(r => r.json()).then(d => setAdminOnline(d.online)),
    ]).catch(() => {});

    loadAll();

    // Poll messages + typing every 2s
    const poll = setInterval(async () => {
      const [msgs, typing, adminStatus] = await Promise.all([
        fetch(`/api/direct-messages?agentId=${ag.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        fetch(`/api/pricing/typing?requestId=dm&agentId=${ag.id}`).then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/heartbeat').then(r => r.json()).catch(() => ({})),
      ]);
      if (Array.isArray(msgs)) setMessages(msgs);
      setAdminTyping(typing.adminTyping || false);
      setAdminOnline(adminStatus.online || false);
    }, 2000);

    // Agent heartbeat every 30s
    const hb = setInterval(() => {
      fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }, 30000);
    fetch('/api/agent/heartbeat', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});

    return () => { clearInterval(poll); clearInterval(hb); };
  }, [router, token]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, adminTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !agent) return;
    setSending(true);
    try {
      const res = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId: agent.id, text: chatText }),
      });
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setChatText('');
    } finally { setSending(false); }
  };

  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <header className="bg-[#131B2E]/95 backdrop-blur-sm border-b border-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-40 shrink-0">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"><ArrowLeft size={18} /></button>
          <div className="w-9 h-9 rounded-xl bg-[#F15D38] flex items-center justify-center font-black text-white text-sm shrink-0">Q</div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${adminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <div className="min-w-0">
              <p className="font-black text-slate-100 text-sm truncate">{t.subtitle}</p>
              <p className={`text-[10px] font-bold ${adminOnline ? 'text-emerald-400' : 'text-slate-500'}`}>{adminOnline ? t.online : t.offline}</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            {(['chat', 'tasks'] as const).map(tb => (
              <button key={tb} onClick={() => setTab(tb)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${tab === tb ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {tb === 'chat' ? t.chat : t.tasks}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto" style={{ height: 'calc(100vh - 70px)' }}>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-3">
            {messages.length === 0 && <div className="text-center py-16 text-slate-600 text-sm font-bold">{t.noMsgs}</div>}
            {messages.map(m => (
              <div key={m._id} className={`flex ${m.fromAgent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm font-bold ${m.fromAgent ? 'bg-[#F15D38] text-white rounded-br-sm' : 'bg-[#131B2E] border border-slate-800 text-slate-100 rounded-bl-sm'}`}>
                  {!m.fromAgent && <p className="text-[9px] font-black text-slate-500 mb-1 uppercase">Q Cargo</p>}
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-1.5 ${m.fromAgent ? 'text-white/60' : 'text-slate-500'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {m.fromAgent && m.read && <span className="ml-1">✓✓</span>}
                    {m.fromAgent && !m.read && <span className="ml-1">✓</span>}
                  </p>
                </div>
              </div>
            ))}
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
          <form onSubmit={handleSend} className="flex gap-2 p-4 sm:px-6 border-t border-slate-800 shrink-0">
            <input type="text" value={chatText}
              onChange={e => {
                setChatText(e.target.value);
                if (agent) fetch('/api/pricing/typing', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: 'dm', agentId: agent.id, role: 'agent' }) }).catch(() => {});
              }}
              placeholder={t.placeholder}
              className="flex-1 bg-[#131B2E] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-[#F15D38] text-sm font-bold" />
            <button type="submit" disabled={sending || !chatText.trim()} className="bg-[#F15D38] hover:bg-[#d64420] text-white px-4 rounded-xl transition-all disabled:opacity-40">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500">
            <span>{tasks.filter(t => !t.done).length} {T[lang].pending}</span>
            <span>·</span>
            <span>{tasks.filter(t => t.done).length} {T[lang].done}</span>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">{t.noTasks}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task._id} className={`bg-[#131B2E] border rounded-2xl p-4 transition-all ${task.done ? 'border-slate-800/40 opacity-50' : 'border-slate-800'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${task.priority === 1 ? 'bg-[#F15D38] text-white' : task.priority === 2 ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                      {task.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.customerName}</p>
                      <p className={`text-xs mt-0.5 ${task.done ? 'text-slate-600' : 'text-slate-400'} font-bold`}>{task.product}</p>
                      {task.deadline && <p className="text-[10px] text-slate-500 mt-1">📅 {task.deadline}</p>}
                      {task.notes && <p className="text-[10px] text-slate-500 mt-1 italic">"{task.notes}"</p>}
                    </div>
                    <button onClick={async () => {
                      const res = await fetch('/api/priority-tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task._id, done: !task.done }) });
                      const updated = await res.json();
                      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
                    }} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-emerald-400'}`}>
                      {task.done && <CheckCircle2 size={14} className="text-white" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
