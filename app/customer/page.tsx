'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, MessageCircle, RefreshCw } from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/customer/request-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return; }
      setHint(data.hint || '');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/customer/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid code'); return; }
      localStorage.setItem('customer_token', data.token);
      localStorage.setItem('customer_name', data.name);
      router.push('/customer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans text-slate-100">
      <nav className="bg-[#0B0F19] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
            <img src="/logo-black.jpg" className="h-8 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-blue-600">CARGO</span></span>
          </Link>
          <Link href="/tracking" className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">
            Track Shipment →
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-900/30 text-blue-400 border border-blue-800/40 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Phone size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-100 mb-2">Customer Portal</h1>
            <p className="text-slate-400">
              {step === 'phone'
                ? 'Enter your registered phone number to receive a verification code on WhatsApp.'
                : 'Enter the 6-digit code sent to your WhatsApp.'}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            {step === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+252 63 390 XXXX or 0633XXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full py-4 px-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                </div>
                {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  {loading ? 'Sending...' : 'Send WhatsApp Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {hint && <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 font-medium">{hint}</p>}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    className="w-full py-4 px-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-2xl text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                </div>
                {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {loading ? 'Verifying...' : 'Enter Portal'}
                </button>
                <button type="button" onClick={() => { setStep('phone'); setError(''); setCode(''); }}
                  className="w-full text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors text-center py-2">
                  ← Change phone number
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-8 font-medium">
            Don't have an account?{' '}
            <a href="https://wa.me/252638884837" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
              Contact us on WhatsApp
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
