'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Check, User, Mail, Phone, MapPin,
  MessageCircle, Building2, Globe, BadgeCheck, AlertCircle, Camera, X,
} from 'lucide-react';

type Lang = 'en' | 'ar' | 'zh';

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: 'My Profile', sub: 'Keep your details up to date for Q Cargo',
    complete: 'Complete your profile', completeSub: 'Q Cargo needs your contact details so we can work together smoothly.',
    section_id: 'Identity', section_contact: 'Contact', section_about: 'About',
    name: 'Full Name', email: 'Email Address', phone: 'Phone Number', wechat: 'WeChat ID', whatsapp: 'WhatsApp Number',
    city: 'City', country: 'Country', company: 'Company / Market', bio: 'Short Bio', language: 'Preferred Language',
    avatarColor: 'Avatar Colour', save: 'Save Profile', saved: 'Saved!', saving: 'Saving...',
    required: 'Required', optional: 'Optional', back: 'Back',
    namePh: 'e.g. AbdiFatax Ahmed', emailPh: 'you@example.com', phonePh: '+86 ...',
    wechatPh: 'your WeChat ID', whatsappPh: '+86 ...', cityPh: 'e.g. Yiwu', countryPh: 'e.g. China',
    companyPh: 'e.g. Yiwu Market Sourcing', bioPh: 'A line about what you source...',
    missing: 'Please fill in your name, email and phone.', verified: 'Profile complete',
    uploadPhoto: 'Upload Photo', removePhoto: 'Remove', photoHint: 'JPG or PNG · max 5 MB',
  },
  ar: {
    title: 'ملفي الشخصي', sub: 'حافظ على تحديث بياناتك لدى Q كارغو',
    complete: 'أكمل ملفك الشخصي', completeSub: 'يحتاج Q كارغو إلى بيانات تواصلك للعمل معاً بسلاسة.',
    section_id: 'الهوية', section_contact: 'التواصل', section_about: 'نبذة',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', wechat: 'معرف ويتشات', whatsapp: 'رقم واتساب',
    city: 'المدينة', country: 'الدولة', company: 'الشركة / السوق', bio: 'نبذة قصيرة', language: 'اللغة المفضلة',
    avatarColor: 'لون الصورة', save: 'حفظ الملف', saved: 'تم الحفظ!', saving: 'جارٍ الحفظ...',
    required: 'مطلوب', optional: 'اختياري', back: 'رجوع',
    namePh: 'مثال: عبدالفتاح أحمد', emailPh: 'you@example.com', phonePh: '+86 ...',
    wechatPh: 'معرف ويتشات', whatsappPh: '+86 ...', cityPh: 'مثال: ييوو', countryPh: 'مثال: الصين',
    companyPh: 'مثال: سوق ييوو', bioPh: 'سطر عن المنتجات التي تصدّرها...',
    missing: 'يرجى إدخال الاسم والبريد والهاتف.', verified: 'الملف مكتمل',
    uploadPhoto: 'رفع صورة', removePhoto: 'حذف', photoHint: 'JPG أو PNG · 5 ميغا بايت كحد أقصى',
  },
  zh: {
    title: '我的资料', sub: '请保持您的信息为最新',
    complete: '完善您的资料', completeSub: 'Q Cargo 需要您的联系方式以便顺畅合作。',
    section_id: '身份', section_contact: '联系方式', section_about: '关于',
    name: '全名', email: '电子邮箱', phone: '电话号码', wechat: '微信号', whatsapp: 'WhatsApp 号码',
    city: '城市', country: '国家', company: '公司 / 市场', bio: '简介', language: '首选语言',
    avatarColor: '头像颜色', save: '保存资料', saved: '已保存！', saving: '保存中...',
    required: '必填', optional: '选填', back: '返回',
    namePh: '例如：AbdiFatax', emailPh: 'you@example.com', phonePh: '+86 ...',
    wechatPh: '您的微信号', whatsappPh: '+86 ...', cityPh: '例如：义乌', countryPh: '例如：中国',
    companyPh: '例如：义乌市场采购', bioPh: '一句话介绍您采购的产品...',
    missing: '请填写姓名、邮箱和电话。', verified: '资料已完善',
    uploadPhoto: '上传照片', removePhoto: '删除', photoHint: 'JPG 或 PNG · 最大 5MB',
  },
};

const AVATAR_COLORS = ['#F15D38', '#2563EB', '#16A34A', '#9333EA', '#DB2777', '#0891B2', '#CA8A04', '#DC2626'];

function initials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 300;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d')!;
        // crop to square from center
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AgentProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [forceComplete, setForceComplete] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', wechat: '', whatsapp: '',
    city: '', country: '', company: '', bio: '', language: 'en' as Lang,
    avatarColor: AVATAR_COLORS[0], photo: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('qcargo_agent_token') : '';

  useEffect(() => {
    const savedLang = localStorage.getItem('qcargo_agent_lang') as Lang | null;
    if (savedLang && ['en', 'ar', 'zh'].includes(savedLang)) setLang(savedLang);

    if (!token) { router.replace('/agent/login'); return; }

    fetch('/api/agent/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { router.replace('/agent/login'); return null; } return r.json(); })
      .then(d => {
        if (!d) return;
        setForm({
          name: d.name || '', email: d.email || '', phone: d.phone || '', wechat: d.wechat || '',
          whatsapp: d.whatsapp || '', city: d.city || '', country: d.country || '', company: d.company || '',
          bio: d.bio || '', language: d.language || 'en', avatarColor: d.avatarColor || AVATAR_COLORS[0],
          photo: d.photo || '',
        });
        setForceComplete(!d.profileComplete);
      })
      .finally(() => setLoading(false));
  }, [router, token]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (file.size > 5 * 1024 * 1024) { setPhotoError('File is too large. Max 5 MB.'); return; }
    if (!file.type.startsWith('image/')) { setPhotoError('Please select an image file.'); return; }
    try {
      const compressed = await compressImage(file);
      set('photo', compressed);
    } catch {
      setPhotoError('Could not process image. Try another file.');
    }
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone) { setError(t.missing); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const cached = JSON.parse(localStorage.getItem('qcargo_agent') || '{}');
      localStorage.setItem('qcargo_agent', JSON.stringify({
        ...cached, name: updated.name, city: updated.city, country: updated.country, photo: updated.photo,
      }));
      localStorage.setItem('qcargo_agent_lang', form.language);
      setLang(form.language);
      setForceComplete(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); router.push('/agent'); }, 900);
    } catch {
      setError(t.missing);
    } finally {
      setSaving(false);
    }
  };

  const t = T[lang];
  const isRtl = lang === 'ar';

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#F15D38]/20 border-t-[#F15D38] rounded-full animate-spin" />
    </div>
  );

  const field = (
    key: keyof typeof form, label: string, Icon: any, placeholder: string,
    opts?: { required?: boolean; type?: string; full?: boolean },
  ) => (
    <div className={opts?.full ? 'sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
        {label}
        {opts?.required
          ? <span className="text-[#F15D38]">*</span>
          : <span className="text-slate-600 normal-case tracking-normal font-bold">· {t.optional}</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
        <input
          type={opts?.type || 'text'} value={form[key]} placeholder={placeholder}
          onChange={e => set(key, e.target.value)}
          className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] focus:ring-1 focus:ring-[#F15D38]/30 transition-all font-bold text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#131B2E]/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {!forceComplete && (
            <button onClick={() => router.push('/agent')} className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F15D38] flex items-center justify-center font-black text-white text-sm shrink-0">Q</div>
            <div>
              <p className="text-sm font-black leading-none">Q<span className="text-[#F15D38]">CARGO</span></p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{t.title}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">

        {forceComplete && (
          <div className="mb-6 flex items-start gap-3 bg-[#F15D38]/10 border border-[#F15D38]/30 rounded-2xl px-4 py-4">
            <div className="w-9 h-9 bg-[#F15D38] rounded-xl flex items-center justify-center shrink-0">
              <BadgeCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-100">{t.complete}</p>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{t.completeSub}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Left: avatar + photo upload */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 text-center">

              {/* Photo / initials avatar */}
              <div className="relative w-24 h-24 mx-auto">
                {form.photo ? (
                  <img src={form.photo} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
                    style={{ backgroundColor: form.avatarColor }}>
                    {initials(form.name)}
                  </div>
                )}
                {/* Camera overlay button */}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F15D38] hover:bg-[#d64420] rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95">
                  <Camera size={14} className="text-white" />
                </button>
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

              <p className="font-black text-slate-100 mt-5 text-lg leading-tight">{form.name || '—'}</p>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {[form.city, form.country].filter(Boolean).join(', ') || '—'}
              </p>

              {!forceComplete && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-800/30">
                  <BadgeCheck size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{t.verified}</span>
                </div>
              )}

              {/* Upload / remove buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-2">
                  <Camera size={13} /> {t.uploadPhoto}
                </button>
                {form.photo && (
                  <button type="button" onClick={() => set('photo', '')}
                    className="w-full py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 text-xs font-black transition-all flex items-center justify-center gap-2 border border-rose-800/30">
                    <X size={12} /> {t.removePhoto}
                  </button>
                )}
                <p className="text-[9px] text-slate-600 font-bold">{t.photoHint}</p>
                {photoError && <p className="text-[10px] text-rose-400 font-bold">{photoError}</p>}
              </div>

              {/* Avatar colour — only shown when no photo */}
              {!form.photo && (
                <div className="mt-5 pt-5 border-t border-slate-800/60">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.avatarColor}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => set('avatarColor', c)}
                        className={`w-7 h-7 rounded-lg transition-all ${form.avatarColor === c ? 'ring-2 ring-offset-2 ring-offset-[#131B2E] ring-white scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }} aria-label={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: fields */}
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Identity */}
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t.section_id}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('name', t.name, User, t.namePh, { required: true, full: true })}
                {field('city', t.city, MapPin, t.cityPh, { required: true })}
                {field('country', t.country, Globe, t.countryPh, { required: true })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t.section_contact}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('email', t.email, Mail, t.emailPh, { required: true, type: 'email' })}
                {field('phone', t.phone, Phone, t.phonePh, { required: true })}
                {field('whatsapp', t.whatsapp, Phone, t.whatsappPh)}
                {field('wechat', t.wechat, MessageCircle, t.wechatPh)}
              </div>
            </div>

            {/* About */}
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t.section_about}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('company', t.company, Building2, t.companyPh, { full: true })}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {t.bio} <span className="text-slate-600 normal-case tracking-normal font-bold">· {t.optional}</span>
                  </label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder={t.bioPh}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] transition-all font-bold text-sm resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.language}</label>
                  <div className="flex bg-[#0B0F19] border border-slate-800 rounded-xl p-1 gap-1">
                    {(['en', 'ar', 'zh'] as Lang[]).map(l => (
                      <button key={l} type="button" onClick={() => set('language', l)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${form.language === l ? 'bg-[#F15D38] text-white' : 'text-slate-400 hover:text-slate-100'}`}>
                        {l === 'en' ? 'EN' : l === 'ar' ? 'عربي' : '中文'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3">
              {!forceComplete && (
                <button type="button" onClick={() => router.push('/agent')}
                  className="px-6 py-3.5 rounded-xl border border-slate-800 bg-[#131B2E] text-slate-300 font-black text-sm hover:border-slate-600 transition-all">
                  {t.back}
                </button>
              )}
              <button type="submit" disabled={saving || saved}
                className="px-8 py-3.5 rounded-xl bg-[#F15D38] hover:bg-[#d64420] text-white font-black text-sm transition-all flex items-center gap-2 disabled:opacity-60">
                {saving ? <><Loader2 size={16} className="animate-spin" /> {t.saving}</>
                  : saved ? <><Check size={16} /> {t.saved}</>
                  : t.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
