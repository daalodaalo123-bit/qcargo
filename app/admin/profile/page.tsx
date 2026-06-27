'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Check, Loader2, MapPin, Phone, Mail, FileText, Shield } from 'lucide-react';
import { ROLE_META, type StaffRole } from '@/lib/permissions';

interface Profile {
  _id:      string;
  name:     string;
  username: string;
  email:    string;
  role:     StaffRole;
  phone:    string;
  location: string;
  bio:      string;
  photo:    string;
  lastSeen: string | null;
}

export default function ProfilePage() {
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [saved,         setSaved]         = useState(false);

  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [location, setLocation] = useState('');
  const [bio,      setBio]      = useState('');
  const [photo,    setPhoto]    = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setName(p.name || '');
        setPhone(p.phone || '');
        setLocation(p.location || '');
        setBio(p.bio || '');
        setPhoto(p.photo || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setPhoto(data.url);
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, phone, location, bio, photo }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-[#0d9488]" size={32} />
    </div>
  );

  if (!profile) return null;

  const roleMeta = ROLE_META[profile.role] ?? ROLE_META['sales_rep'];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">My Profile</h1>
        <p className="text-slate-400 text-sm font-bold mt-1">Update your personal information and photo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photo + identity */}
        <div className="space-y-4">
          {/* Photo */}
          <div className="bg-[#131B2E] rounded-2xl border border-slate-800 p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#0d9488]/40 bg-slate-800 flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-slate-300">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#0d9488] hover:bg-[#0f766e] rounded-full flex items-center justify-center transition-colors border-2 border-[#0B0F19]"
              >
                {uploading
                  ? <Loader2 size={14} className="animate-spin text-white" />
                  : <Camera size={14} className="text-white" />
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div className="text-center">
              <p className="text-sm font-black text-slate-100">{name}</p>
              <p className="text-[10px] text-slate-500 font-bold">@{profile.username}</p>
              <span className={`mt-2 inline-block text-[10px] font-black px-3 py-1 rounded-full ${roleMeta.color} ${roleMeta.textColor}`}>
                {roleMeta.label}
              </span>
            </div>
          </div>

          {/* Read-only info */}
          <div className="bg-[#131B2E] rounded-2xl border border-slate-800 p-5 space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Info</p>
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 font-bold">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={14} className="text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 font-bold">{roleMeta.label}</span>
            </div>
            <p className="text-[9px] text-slate-600 font-bold">Role and email can only be changed by the admin</p>
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2 bg-[#131B2E] rounded-2xl border border-slate-800 p-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Personal Information</p>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <div className="flex items-center gap-2"><Phone size={11} /> Phone Number</div>
              </label>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+252 ..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <div className="flex items-center gap-2"><MapPin size={11} /> Location / City</div>
              </label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Hargeisa, Somaliland"
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <div className="flex items-center gap-2"><FileText size={11} /> Bio / Short Description</div>
              </label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="A short description about yourself..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0d9488] transition-colors placeholder-slate-600 resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-60"
              style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, #0d9488, #0f766e)' }}
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : saved
                ? <><Check size={16} /> Saved!</>
                : 'Save Changes'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
