'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const T: Record<string, Record<string, string>> = {
  en: { title: 'Agent Portal', sub: 'Q Cargo Sourcing Network', username: 'Username', password: 'Password', login: 'Sign In', error: 'Invalid username or password.' },
  ar: { title: 'بوابة الوكيل', sub: 'شبكة مصادر Q كارغو', username: 'اسم المستخدم', password: 'كلمة المرور', login: 'تسجيل الدخول', error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' },
  zh: { title: '代理门户', sub: 'Q Cargo 采购网络', username: '用户名', password: '密码', login: '登录', error: '用户名或密码错误。' },
};

export default function AgentLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ar' | 'zh'>('en');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = T[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(t.error); return; }
      localStorage.setItem('qcargo_agent_token', data.token);
      localStorage.setItem('qcargo_agent', JSON.stringify(data.agent));
      localStorage.setItem('qcargo_agent_last_active', String(Date.now()));
      sessionStorage.setItem('qcargo_agent_session', '1');
      router.push('/agent');
    } catch { setError(t.error); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 ${lang === 'ar' ? 'dir-rtl' : ''}`}
      style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-8">
          {(['en', 'ar', 'zh'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-[#F15D38] text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-100'}`}>
              {l === 'en' ? 'EN' : l === 'ar' ? 'عر' : '中文'}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black text-slate-100 tracking-tight mb-1">
            Q<span className="text-[#F15D38]">CARGO</span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.title}</p>
          <p className="text-[10px] text-slate-600 mt-1">{t.sub}</p>
        </div>

        {/* Card */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-5 p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.username}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] transition-all font-bold text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3.5 pl-11 pr-11 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] transition-all font-bold text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t.login} <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
