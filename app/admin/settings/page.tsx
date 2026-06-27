'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Lock, ChevronDown } from 'lucide-react';
import { ROLE_META, type StaffRole } from '@/lib/permissions';

interface AdminUser {
  _id:      string;
  name:     string;
  username: string;
  email:    string;
  role:     StaffRole;
  active:   boolean;
}

const ROLE_OPTIONS = Object.entries(ROLE_META) as [StaffRole, typeof ROLE_META[StaffRole]][];

export default function SettingsPage() {
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<StaffRole>('sales_rep');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('sales_rep');
    setError(''); setEditingUser(null); setShowForm(false);
  };

  const startEdit = (u: AdminUser) => {
    setEditingUser(u);
    setName(u.name); setUsername(u.username); setEmail(u.email);
    setPassword(''); setRole(u.role);
    setError(''); setShowForm(true);
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
      } else {
        if (!password) { setError('Password is required'); return; }
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username, email, password, role }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
      }
      await fetchUsers();
      resetForm();
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

  // Owner = first-created super admin
  const ownerId = users.find(u => u.role === 'admin')?._id;
  const selectedRoleMeta = ROLE_META[role];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">User Management</h1>
          <p className="text-slate-400 font-medium text-sm">Manage staff accounts and role-based access</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F15D38] hover:bg-[#d94e2d] text-white text-sm font-black rounded-xl transition-colors">
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#131B2E] rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-black text-slate-100 mb-6">
            {editingUser ? `Edit — ${editingUser.name}` : 'New Staff User'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required={!editingUser}
                  disabled={!!editingUser}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors disabled:opacity-40" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Password {editingUser && <span className="text-slate-500 normal-case font-normal">(leave blank to keep)</span>}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUser}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors" />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                Position / Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ROLE_OPTIONS.map(([r, meta]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                      role === r
                        ? 'border-[#0d9488] bg-[#0d9488]/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} ${meta.textColor}`}>
                        {meta.label}
                      </span>
                      {role === r && <Check size={12} className="text-[#0d9488]" />}
                    </div>
                    <p className="text-[9px] text-slate-500 leading-snug">{meta.description}</p>
                  </button>
                ))}
              </div>

              {/* Selected role access summary */}
              {selectedRoleMeta && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Access for this role</p>
                  <p className="text-xs text-slate-300 font-medium">{selectedRoleMeta.description}</p>
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
            const isOwner = u._id === ownerId;
            const meta    = ROLE_META[u.role] ?? ROLE_META['sales_rep'];
            return (
              <div
                key={u._id}
                className={`bg-[#131B2E] rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOwner ? 'border-[#F15D38]/40' : u.active ? 'border-slate-800' : 'border-slate-800 opacity-50'
                }`}
              >
                {/* Left: identity */}
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs ${meta.color} ${meta.textColor}`}>
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-100">{u.name}</p>
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#F15D38]/20 text-[#F15D38]">
                          <Lock size={9} /> Owner
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">@{u.username} · {u.email}</p>
                  </div>
                </div>

                {/* Right: role badge + controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${meta.color} ${meta.textColor}`}>
                    {meta.label}
                  </span>

                  {isOwner ? (
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-900/30 text-emerald-400">Active</span>
                  ) : (
                    <button onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors ${
                        u.active
                          ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </button>
                  )}

                  <button onClick={() => startEdit(u)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
                    <Pencil size={13} />
                  </button>

                  {isOwner ? (
                    <span title="Protected owner account" className="p-2 rounded-lg bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800">
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

      {/* Role reference legend */}
      <div className="mt-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Role Access Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_OPTIONS.map(([r, meta]) => (
            <div key={r} className="bg-[#131B2E] rounded-xl p-4 border border-slate-800">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} ${meta.textColor}`}>
                {meta.label}
              </span>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{meta.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
