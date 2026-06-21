'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, CheckCircle2, Clock, Loader2, X, Pencil } from 'lucide-react';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isOnline(lastSeen?: string) {
  if (!lastSeen) return false;
  return new Date(lastSeen) > new Date(Date.now() - 2 * 60 * 1000);
}

export default function AdminMessagesPage() {
  const [agents, setAgents]             = useState<any[]>([]);
  const [selectedAgent, setSelected]    = useState<any>(null);
  const [messages, setMessages]         = useState<any[]>([]);
  const [tasks, setTasks]               = useState<any[]>([]);
  const [unreadMap, setUnreadMap]       = useState<Record<string, number>>({});
  const [tab, setTab]                   = useState<'chat' | 'tasks'>('chat');
  const [chatText, setChatText]         = useState('');
  const [sending, setSending]           = useState(false);
  const [agentTyping, setAgentTyping]   = useState(false);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const chatRef                         = useRef<HTMLDivElement>(null);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask]   = useState<any>(null);
  const [tCustomer, setTCustomer]       = useState('');
  const [tProduct, setTProduct]         = useState('');
  const [tPriority, setTPriority]       = useState('1');
  const [tDeadline, setTDeadline]       = useState('');
  const [tNotes, setTNotes]             = useState('');
  const [savingTask, setSavingTask]     = useState(false);

  // Load agents + unread counts
  useEffect(() => {
    const load = async () => {
      const [agentsRes, allMsgsRes] = await Promise.all([
        fetch('/api/agents').then(r => r.json()),
        // Get unread counts per agent
        fetch('/api/direct-messages/unread').then(r => r.json()).catch(() => ({})),
      ]);
      if (Array.isArray(agentsRes)) setAgents(agentsRes);
      if (allMsgsRes) setUnreadMap(allMsgsRes);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when agent selected
  useEffect(() => {
    if (!selectedAgent) return;
    setLoadingMsgs(true);
    Promise.all([
      fetch(`/api/direct-messages?agentId=${selectedAgent._id}`).then(r => r.json()),
      fetch(`/api/priority-tasks?agentId=${selectedAgent._id}`).then(r => r.json()),
    ]).then(([msgs, tsks]) => {
      if (Array.isArray(msgs)) setMessages(msgs);
      if (Array.isArray(tsks)) setTasks(tsks);
      // Clear unread for this agent
      setUnreadMap(prev => ({ ...prev, [selectedAgent._id]: 0 }));
    }).finally(() => setLoadingMsgs(false));

    // Poll messages + typing every 2s
    const poll = setInterval(async () => {
      const [msgs, typing] = await Promise.all([
        fetch(`/api/direct-messages?agentId=${selectedAgent._id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/pricing/typing?requestId=dm&agentId=${selectedAgent._id}`).then(r => r.json()).catch(() => ({})),
      ]);
      if (Array.isArray(msgs)) setMessages(msgs);
      setAgentTyping(typing.agentTyping || false);
    }, 2000);
    return () => clearInterval(poll);
  }, [selectedAgent]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, agentTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !selectedAgent) return;
    setSending(true);
    try {
      const res = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent._id, text: chatText, fromAdmin: true }),
      });
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setChatText('');
    } finally { setSending(false); }
  };

  const openTaskForm = (task?: any) => {
    if (task) {
      setEditingTask(task); setTCustomer(task.customerName); setTProduct(task.product);
      setTPriority(String(task.priority)); setTDeadline(task.deadline || ''); setTNotes(task.notes || '');
    } else {
      setEditingTask(null); setTCustomer(''); setTProduct('');
      setTPriority(String(tasks.length + 1)); setTDeadline(''); setTNotes('');
    }
    setShowTaskForm(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      const body = { customerName: tCustomer, product: tProduct, priority: parseInt(tPriority), deadline: tDeadline, notes: tNotes };
      if (editingTask) {
        const res = await fetch('/api/priority-tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingTask._id, ...body }) });
        const updated = await res.json();
        setTasks(prev => prev.map(t => t._id === editingTask._id ? updated : t).sort((a, b) => a.priority - b.priority));
      } else {
        const res = await fetch('/api/priority-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: selectedAgent._id, ...body }) });
        const created = await res.json();
        setTasks(prev => [...prev, created].sort((a, b) => a.priority - b.priority));
      }
      setShowTaskForm(false);
    } finally { setSavingTask(false); }
  };

  const handleToggleTask = async (task: any) => {
    const res = await fetch('/api/priority-tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task._id, done: !task.done }) });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
  };

  const handleDeleteTask = async (id: string) => {
    await fetch('/api/priority-tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  return (
    <div className="admin-container pb-0 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Agent Messages</h1>
        <p className="text-slate-400 font-medium">Private conversations and task sheets for each agent</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Agent list */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {agents.length === 0 && <p className="text-sm text-slate-600 font-bold">No agents yet. Add them in Sourcing → Agents.</p>}
          {agents.map(a => {
            const online = isOnline(a.lastSeen);
            const unread = unreadMap[a._id] || 0;
            return (
              <button key={a._id} onClick={() => setSelected(a)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedAgent?._id === a._id ? 'border-[#F15D38] bg-[#F15D38]/10' : 'border-slate-800 bg-[#131B2E] hover:border-slate-600'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <div className="min-w-0">
                      <p className="font-black text-slate-100 text-sm truncate">{a.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{a.city}, {a.country}</p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 bg-[#F15D38] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </div>
                {!online && a.lastSeen && <p className="text-[9px] text-slate-600 mt-1">Last seen {timeAgo(a.lastSeen)}</p>}
              </button>
            );
          })}
        </div>

        {/* Conversation panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden">
          {!selectedAgent ? (
            <div className="flex-1 flex items-center justify-center text-center p-10">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500">Select an agent to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Agent header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline(selectedAgent.lastSeen) ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <div>
                    <p className="font-black text-slate-100">{selectedAgent.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{selectedAgent.city}, {selectedAgent.country} · {isOnline(selectedAgent.lastSeen) ? <span className="text-emerald-400">Online</span> : `Last seen ${timeAgo(selectedAgent.lastSeen)}`}</p>
                  </div>
                </div>
                {/* Tab switcher */}
                <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                  {(['chat', 'tasks'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                      {t === 'chat' ? `Chat` : `Priority Sheet (${tasks.filter(t => !t.done).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHAT TAB */}
              {tab === 'chat' && (
                <>
                  <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loadingMsgs && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#F15D38]" /></div>}
                    {!loadingMsgs && messages.length === 0 && (
                      <div className="text-center py-10 text-slate-600 text-sm font-bold">No messages yet. Say hello to {selectedAgent.name}!</div>
                    )}
                    {messages.map(m => (
                      <div key={m._id} className={`flex ${!m.fromAgent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm font-bold ${!m.fromAgent ? 'bg-[#F15D38] text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'}`}>
                          {m.fromAgent && <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">{m.agentName}</p>}
                          <p className="leading-relaxed">{m.text}</p>
                          <p className={`text-[9px] mt-1.5 ${!m.fromAgent ? 'text-white/60' : 'text-slate-500'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {!m.fromAgent && m.read && <span className="ml-1">✓✓</span>}
                            {!m.fromAgent && !m.read && <span className="ml-1">✓</span>}
                          </p>
                        </div>
                      </div>
                    ))}
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
                  <form onSubmit={handleSend} className="flex gap-3 p-4 border-t border-slate-800 shrink-0">
                    <input type="text" value={chatText}
                      onChange={e => {
                        setChatText(e.target.value);
                        fetch('/api/pricing/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: 'dm', agentId: selectedAgent._id, role: 'admin' }) }).catch(() => {});
                      }}
                      placeholder={`Message ${selectedAgent.name}...`}
                      className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-[#F15D38] transition-colors" />
                    <button type="submit" disabled={sending || !chatText.trim()} className="bg-[#F15D38] hover:bg-[#d64420] text-white px-5 rounded-xl transition-all disabled:opacity-40 flex items-center gap-2">
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                </>
              )}

              {/* PRIORITY SHEET TAB */}
              {tab === 'tasks' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0">
                    <p className="text-xs font-bold text-slate-400">{tasks.filter(t => !t.done).length} pending · {tasks.filter(t => t.done).length} done</p>
                    <button onClick={() => openTaskForm()} className="flex items-center gap-2 bg-[#F15D38] hover:bg-[#d64420] text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
                      <Plus size={14} /> Add Task
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center p-10">
                        <div>
                          <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-700" />
                          <p className="text-sm font-bold text-slate-500">No tasks yet.</p>
                          <p className="text-xs text-slate-600 mt-1">Add tasks to tell {selectedAgent.name} what to prioritize.</p>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#0B0F19]">
                          <tr className="border-b border-slate-800">
                            {['#', 'Customer', 'Product / Request', 'Deadline', 'Notes', 'Done', ''].map(h => (
                              <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {tasks.map(t => (
                            <tr key={t._id} className={`transition-all ${t.done ? 'opacity-40' : 'hover:bg-slate-800/20'}`}>
                              <td className="px-4 py-3">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${t.priority === 1 ? 'bg-[#F15D38] text-white' : t.priority === 2 ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{t.priority}</span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-100 text-sm">{t.customerName}</td>
                              <td className="px-4 py-3 text-slate-300 text-sm">{t.product}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs font-bold whitespace-nowrap">{t.deadline || '—'}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{t.notes || '—'}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => handleToggleTask(t)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-emerald-400'}`}>
                                  {t.done && <CheckCircle2 size={14} className="text-white" />}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openTaskForm(t)} className="p-1.5 text-slate-600 hover:text-slate-200 rounded-lg transition-colors"><Pencil size={13} /></button>
                                  <button onClick={() => handleDeleteTask(t._id)} className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task form modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTaskForm(false)}>
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-100">{editingTask ? 'Edit Task' : 'Add Priority Task'}</h3>
              <button onClick={() => setShowTaskForm(false)} className="p-2 text-slate-400 hover:text-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Name *</label>
                  <input type="text" required value={tCustomer} onChange={e => setTCustomer(e.target.value)} className="search-input w-full" placeholder="e.g. Ahmed Mohamed" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority #</label>
                  <input type="number" min="1" value={tPriority} onChange={e => setTPriority(e.target.value)} className="search-input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Product / Request *</label>
                <input type="text" required value={tProduct} onChange={e => setTProduct(e.target.value)} className="search-input w-full" placeholder="e.g. 500 pcs iPhone cases" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                <input type="date" value={tDeadline} onChange={e => setTDeadline(e.target.value)} className="search-input w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes for Agent</label>
                <textarea value={tNotes} onChange={e => setTNotes(e.target.value)} rows={2} placeholder="Any special instructions..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F15D38] resize-none" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowTaskForm(false)} className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6">Cancel</button>
                <button type="submit" disabled={savingTask} className="btn btn-primary px-8 flex items-center gap-2">
                  {savingTask ? <Loader2 size={14} className="animate-spin" /> : null} {editingTask ? 'Save' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
