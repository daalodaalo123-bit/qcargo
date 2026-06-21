'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Package, Clock, CheckCircle2, AlertCircle, ChevronRight, Bell, MapPin } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  IN_PROGRESS: 'bg-blue-950/30 text-blue-400 border-blue-800/30',
  COMPLETED: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
  CANCELLED: 'bg-slate-900 text-slate-500 border-slate-800',
};

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [responseMap, setResponseMap] = useState<Record<string, any>>({});
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qcargo_agent_token');
    if (!token) { router.replace('/agent/login'); return; }
    fetch('/api/agent/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { localStorage.removeItem('qcargo_agent_token'); router.replace('/agent/login'); return null; } return r.json(); })
      .then(data => { if (!data) return; setAgent(data.agent); setRequests(data.requests); setResponseMap(data.responseMap || {}); setUnread(data.unread || 0); })
      .finally(() => setLoading(false));
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
          <span className="text-xs font-bold text-slate-400">Agent Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {unread > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-800/30 text-rose-400 px-3 py-1.5 rounded-xl text-[10px] font-black">
              <Bell size={12} /> {unread} new message{unread !== 1 ? 's' : ''}
            </div>
          )}
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
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-100">Welcome back, {agent?.name?.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm mt-1">You have {open.length} open request{open.length !== 1 ? 's' : ''} waiting for pricing.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Open', value: open.length, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-blue-400' },
            { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 text-center">
              <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Requests list */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Your Assigned Requests</h2>
          {requests.length === 0 ? (
            <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-10 text-center">
              <Package size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-slate-500">No requests assigned to you yet.</p>
            </div>
          ) : requests.map(r => {
            const myResponse = responseMap[r._id];
            const hasResponse = !!myResponse;
            return (
              <button key={r._id} onClick={() => router.push(`/agent/request/${r._id}`)}
                className="w-full bg-[#131B2E] border border-slate-800 hover:border-slate-600 rounded-2xl p-5 text-left transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-500 font-mono">{r.requestNumber}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      {hasResponse && <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-950/30 text-emerald-400 border-emerald-800/30">✓ Priced</span>}
                    </div>
                    <p className="font-black text-slate-100 text-sm truncate">{r.productName}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">For: {r.customerName} · {r.quantity} {r.unit}</p>
                    {r.deadline && <p className="text-[10px] text-slate-500 mt-1">Deadline: {r.deadline}</p>}
                    {hasResponse && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-1">
                        Your price: ${myResponse.unitPrice} {myResponse.currency} / {r.unit} — {myResponse.supplierName}
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
