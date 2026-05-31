'use client';

import { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid credentials. Please check your access key.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#F15D38]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-[#F15D38]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-slate-900/20 rounded-full blur-[200px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-[#131B2E] border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/40">
              <img src="/logo-black.jpg" className="h-10 w-auto rounded-xl object-contain" alt="Q Cargo" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                Q<span className="text-[#F15D38]">CARGO</span>
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                Admin Control Panel
              </p>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 text-slate-500 uppercase tracking-[0.2em] text-[10px] font-black mt-4">
            <ShieldCheck size={13} className="text-emerald-500" />
            Secure Access — Authorized Personnel Only
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-6 p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in fade-in zoom-in-95">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Agent Identifier
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#F15D38] transition-colors" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] focus:ring-2 focus:ring-[#F15D38]/20 transition-all font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Access Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#F15D38] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#F15D38] focus:ring-2 focus:ring-[#F15D38]/20 transition-all font-bold"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-700 bg-[#0B0F19] accent-[#F15D38]" 
                />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                  Stay Connected
                </span>
              </label>
              <button type="button" className="text-xs font-bold text-[#F15D38]/70 hover:text-[#F15D38] transition-colors">
                Forgot Key?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#F15D38] hover:bg-[#d64420] text-white font-black py-4 rounded-xl shadow-lg shadow-[#F15D38]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative mt-2"
            >
              <span className={`flex items-center gap-3 transition-transform duration-500 ${loading ? '-translate-y-10 opacity-0' : ''}`}>
                Unlock Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white/25 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/60 text-center">
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              Authorized Agent Personnel Only.<br />
              All access attempts are monitored and logged.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6">
          <Link href="/" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-300 transition-colors">
            Main Terminal
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/tracking" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-300 transition-colors">
            Global Tracking
          </Link>
        </div>
      </div>
    </div>
  );
}
