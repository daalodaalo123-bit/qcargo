'use client';

import { useState } from 'react';
import { Globe, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of secure login
    setTimeout(() => {
      router.push('/admin');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 text-3xl font-black text-white tracking-tighter mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/40">
              <Globe size={24} />
            </div>
            DURDUR<span className="text-blue-600">CARGO</span>
          </Link>
          <div className="flex items-center justify-center gap-2 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure Agent Access
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Agent Identifier</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder="Username or Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-0 focus:ring-offset-0" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Stay Connected</span>
              </label>
              <button type="button" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">Forgot Key?</button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
            >
              <span className={`flex items-center gap-3 transition-transform duration-500 ${loading ? '-translate-y-10' : ''}`}>
                Unlock Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center animate-in slide-in-from-bottom-10">
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Authorized Agent Personnel Only.<br />
              All access attempts are monitored and recorded.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6">
          <Link href="/" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">Main Terminal</Link>
          <span className="text-slate-800">•</span>
          <Link href="/tracking" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">Global Tracking</Link>
        </div>
      </div>
    </div>
  );
}
