'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Shield, User, Check, X } from 'lucide-react';

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  active: boolean;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('staff');
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
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="admin-container max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Settings</h1>
          <p className="text-slate-400 font-medium">Manage admin users and roles</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-bold text-slate-100 mb-6">{editingUser ? 'Edit User' : 'New Admin User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F15D38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required={!editingUser}
                  disabled={!!editingUser}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F15D38] disabled:opacity-40" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F15D38]" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Password {editingUser && <span className="text-slate-500 normal-case font-normal">(leave blank to keep)</span>}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUser}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F15D38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F15D38]">
                  <option value="admin">Admin (Full Access)</option>
                  <option value="staff">Staff (Limited Access)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-rose-400 text-sm font-bold">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                <Check size={16} /> {saving ? 'Saving...' : 'Save User'}
              </button>
              <button type="button" onClick={resetForm} className="btn bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center gap-2">
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading users...</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className={`bg-slate-800 rounded-2xl p-5 border flex items-center justify-between gap-4 ${u.active ? 'border-slate-700' : 'border-slate-800 opacity-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${u.role === 'admin' ? 'bg-[#F15D38] text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {u.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{u.name}</p>
                  <p className="text-xs text-slate-400">@{u.username} · {u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-[#F15D38]/20 text-[#F15D38]' : 'bg-slate-700 text-slate-400'}`}>
                  {u.role}
                </span>
                <button onClick={() => handleToggleActive(u)} title={u.active ? 'Deactivate' : 'Activate'}
                  className={`p-2 rounded-lg text-xs font-bold transition-colors ${u.active ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                  {u.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => startEdit(u)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(u)} className="p-2 rounded-lg bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
