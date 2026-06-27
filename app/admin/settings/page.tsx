'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X, Lock, Copy, ExternalLink, MapPin, Phone, Eye, EyeOff } from 'lucide-react';
import { ROLE_META, type StaffRole } from '@/lib/permissions';

interface AdminUser {
  _id:      string;
  name:     string;
  username: string;
  email:    string;
  role:     StaffRole;
  active:   boolean;
  lastSeen: string | null;
  photo:    string;
  phone:    string;
  location: string;
}

interface NewCredentials {
  name:     string;
  username: string;
  password: string;
  role:     StaffRole;
}

const ROLE_OPTIONS = Object.entries(ROLE_META) as [StaffRole, typeof ROLE_META[StaffRole]][];

function timeAgo(dateStr: string | null): { label: string; online: boolean } {
  if (!dateStr) return { label: 'Never logged in', online: false };
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 2)  return { label: 'Online now',          online: true  };
  if (mins < 60) return { label: `${mins}m ago`,         online: false };
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return { label: `${hrs}h ago`,          online: false };
  const days = Math.floor(hrs / 24);
  return { label: `${days}d ago`,        online: false };
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

export default function SettingsPage() {
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newCreds,    setNewCreds]    = useState<NewCredentials | null>(null);

  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<StaffRole>('sales_rep');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  // Auto-generate username from full name
  const autoUsername = (n: string) =>
    n.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Refresh lastSeen every 30s
  useEffect(() => {
    const t = setInterval(fetchUsers, 30000);
    return () => clearInterval(t);
  }, [fetchUsers]);

  const resetForm = () => {
    setName(''); setUsername(''); setPassword(''); setRole('sales_rep');
    setError(''); setEditingUser(null); setShowForm(false); setShowPass(false);
  };

  const startEdit = (u: AdminUser) => {
    setEditingUser(u);
    setName(u.name); setUsername(u.username);
    setPassword(''); setRole(u.role);
    setError(''); setShowForm(true); setShowPass(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = { name, role, active: editingUser.active };
        if (password) body.password = password;
        const res = await fetch(`/api/admin/users?id=${editingUser._id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
        await fetchUsers();
        resetForm();
      } else {
        if (!password) { setError('Password is required'); return; }
        const finalUsername = username || autoUsername(name);
        if (!finalUsername) { setError('Name is required to generate username'); return; }
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username: finalUsername, password, role }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
        setNewCreds({ name, username: finalUsername, password, role });
        await fetchUsers();
        resetForm();
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?id=${u._id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    setUsers(prev => prev.filter(x => x._id !== u._id));
  };

  const handleToggleActive = async (u: AdminUser) => {
    const res = await fetch(`/api/admin/users?id=${u._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) await fetchUsers();
  };

  const ownerId         = users.find(u => u.role === 'admin')?._id;
  const selectedRoleMeta = ROLE_META[role];
  const loginLink       = typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : '/admin/login';

  const onlineCount  = users.filter(u => u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() < 2 * 60 * 1000).length;
  const offlineCount = users.length - onlineCount;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm font-bold mt-1">Manage staff accounts and role-based access</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live status summary */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#131B2E] border border-slate-800 rounded-xl">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{onlineCount} Online
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] font-black text-slate-500">{offlineCount} Offline</span>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F15D38] hover:bg-[#d94e2d] text-white text-sm font-black rounded-xl transition-colors">
              <Plus size={18} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Credentials modal */}
      {newCreds && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-[#0d9488]/40 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-lg font-black text-slate-100">User Created!</p>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Share these credentials with {newCreds.name}</p>
              </div>
              <button onClick={() => setNewCreds(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Login Link', value: loginLink },
                { label: 'Username',   value: newCreds.username },
                { label: 'Password',   value: newCreds.password },
                { label: 'Position',   value: ROLE_META[newCreds.role]?.label || newCreds.role },
              ].map(row => (
                <div key={row.label} className="bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{row.label}</p>
                    <p className="text-sm font-bold text-slate-100 truncate">{row.value}</p>
                  </div>
                  <CopyButton value={row.value} />
                </div>
              ))}
            </div>

            {/* Copy all button */}
            <button
              onClick={() => {
                const text = `Q Cargo ERP — Login Credentials\n\nName: ${newCreds.name}\nPosition: ${ROLE_META[newCreds.role]?.label}\nLogin: ${loginLink}\nUsername: ${newCreds.username}\nPassword: ${newCreds.password}`;
                navigator.clipboard.writeText(text);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-black text-sm transition-colors mb-3"
            >
              <Copy size={16} /> Copy All as Message
            </button>

            <a href={loginLink} target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors">
              <ExternalLink size={14} /> Open Login Page
            </a>
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-[#131B2E] rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-black text-slate-100 mb-6">
            {editingUser ? `Edit — ${editingUser.name}` : 'New Staff User'}
          </h2>
          {/* Hidden dummy fields to block browser autofill */}
          <input type="text" name="fake_user" style={{ display: 'none' }} autoComplete="username" readOnly />
          <input type="password" name="fake_pass" style={{ display: 'none' }} autoComplete="new-password" readOnly />

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); if (!editingUser) setUsername(autoUsername(e.target.value)); }}
                  required autoComplete="off" name="new_name"
                  placeholder="e.g. Ahmed Hassan"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors placeholder-slate-600"
                />
              </div>

              {/* Username — auto-generated, editable */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Username <span className="normal-case font-normal text-slate-600">(auto-generated, editable)</span>
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '.'))}
                  disabled={!!editingUser}
                  autoComplete="off" name="new_username"
                  placeholder="ahmed.hassan"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors disabled:opacity-40 placeholder-slate-600"
                />
                {!editingUser && username && (
                  <p className="text-[10px] text-[#0d9488] font-bold mt-1">Login: {username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Password {editingUser && <span className="text-slate-500 normal-case font-normal">(leave blank to keep)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!editingUser}
                    autoComplete="new-password"
                    name="new_password"
                    placeholder="Type password manually"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 pr-12 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors placeholder-slate-600"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role cards */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Position / Role</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {ROLE_OPTIONS.map(([r, meta]) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                      role === r ? 'border-[#0d9488] bg-[#0d9488]/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${meta.color} ${meta.textColor}`}>{meta.label}</span>
                      {role === r && <Check size={11} className="text-[#0d9488]" />}
                    </div>
                    <p className="text-[9px] text-slate-500 leading-snug">{meta.description}</p>
                  </button>
                ))}
              </div>
              {selectedRoleMeta && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-300 font-medium">{selectedRoleMeta.description}</p>
                </div>
              )}
            </div>

            {error && <p className="text-rose-400 text-sm font-bold">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-colors">
                <Check size={16} /> {saving ? 'Saving…' : 'Save User'}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-black rounded-xl transition-colors">
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading users…</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => {
            const isOwner  = u._id === ownerId;
            const meta     = ROLE_META[u.role] ?? ROLE_META['sales_rep'];
            const status   = timeAgo(u.lastSeen);
            const initials = u.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={u._id}
                className={`bg-[#131B2E] rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOwner ? 'border-[#F15D38]/30' : u.active ? 'border-slate-800' : 'border-slate-800 opacity-50'
                }`}>
                {/* Avatar + info */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                      {u.photo
                        ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                        : <span className={`text-sm font-black ${meta.textColor}`}>{initials}</span>
                      }
                    </div>
                    {/* Online dot */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0B0F19] ${
                      status.online ? 'bg-emerald-400' : 'bg-slate-600'
                    }`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-100">{u.name}</p>
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#F15D38]/20 text-[#F15D38]">
                          <Lock size={8} /> Owner
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">@{u.username}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {u.location && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin size={9} />{u.location}
                        </span>
                      )}
                      {u.phone && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Phone size={9} />{u.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: status + role + controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Last seen */}
                  <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                    status.online
                      ? 'bg-emerald-900/30 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    {status.label}
                  </span>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${meta.color} ${meta.textColor}`}>
                    {meta.label}
                  </span>

                  {isOwner ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-900/30 text-emerald-400">Active</span>
                  ) : (
                    <button onClick={() => handleToggleActive(u)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                        u.active ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </button>
                  )}

                  <button onClick={() => startEdit(u)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
                    <Pencil size={13} />
                  </button>

                  {isOwner ? (
                    <span className="p-2 rounded-lg bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800">
                      <Lock size={13} />
                    </span>
                  ) : (
                    <button onClick={() => handleDelete(u)}
                      className="p-2 rounded-lg bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 transition-colors border border-rose-900/30">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role reference */}
      <div className="mt-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Role Access Reference</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_OPTIONS.map(([r, meta]) => (
            <div key={r} className="bg-[#131B2E] rounded-xl p-4 border border-slate-800">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} ${meta.textColor}`}>{meta.label}</span>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{meta.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
