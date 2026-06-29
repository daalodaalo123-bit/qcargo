'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Save, Loader2, Send, ArrowLeft, CheckCircle2,
  XCircle, Eye, EyeOff, ExternalLink, ShieldCheck,
} from 'lucide-react';

interface WaSettings {
  phoneNumberId: string;
  wabaId: string;
  apiVersion: string;
  enabled: boolean;
  senderLabel: string;
  tokenSet: boolean;
  tokenPreview: string;
}

const BLANK: WaSettings = {
  phoneNumberId: '', wabaId: '', apiVersion: 'v21.0', enabled: false,
  senderLabel: '', tokenSet: false, tokenPreview: '',
};

export default function WhatsAppSettingsPage() {
  const [s, setS] = useState<WaSettings>(BLANK);
  const [token, setToken] = useState('');        // new token to save (blank = keep existing)
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/settings');
      if (res.ok) setS({ ...BLANK, ...(await res.json()) });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, accessToken: token }),
      });
      if (res.ok) {
        const d = await res.json();
        setS({ ...BLANK, ...d });
        setToken('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to save');
      }
    } finally { setSaving(false); }
  };

  const sendTest = async () => {
    if (!testPhone.trim()) { alert('Enter a phone number to test'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      });
      const d = await res.json().catch(() => ({}));
      setTestResult(res.ok && d.success
        ? { ok: true, msg: 'Sent! Check that WhatsApp number for a "hello_world" message.' }
        : { ok: false, msg: d.error || 'Failed to send.' });
    } catch (e: unknown) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : 'Network error' });
    } finally { setTesting(false); }
  };

  const field = 'w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#25D366]';
  const lbl = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/settings" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 mb-6">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366]">
          <MessageCircle size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">WhatsApp API</h1>
          <p className="text-slate-400 text-sm font-bold mt-0.5">Connect Meta WhatsApp Business to send invoices & quotations</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#25D366]" /></div>
      ) : (
        <div className="space-y-6">
          {/* Credentials */}
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-7" style={{ borderTopWidth: 2, borderTopColor: '#25D366' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest">Meta Credentials</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-[11px] font-black uppercase ${s.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>{s.enabled ? 'Enabled' : 'Disabled'}</span>
                <button type="button" onClick={() => setS({ ...s, enabled: !s.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${s.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={lbl}>Phone Number ID</label><input className={field} value={s.phoneNumberId} onChange={e => setS({ ...s, phoneNumberId: e.target.value })} placeholder="e.g. 1227868733738807" /></div>
                <div><label className={lbl}>WhatsApp Business Account ID</label><input className={field} value={s.wabaId} onChange={e => setS({ ...s, wabaId: e.target.value })} placeholder="e.g. 2010257043197118" /></div>
              </div>

              <div>
                <label className={lbl}>Access Token {s.tokenSet && <span className="text-emerald-400 normal-case">· saved {s.tokenPreview}</span>}</label>
                <div className="relative">
                  <input className={`${field} pr-10`} type={showToken ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)}
                    placeholder={s.tokenSet ? 'Leave blank to keep saved token, or paste a new one' : 'Paste your Meta access token (starts with EAA…)'} />
                  <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1"><ShieldCheck size={11} className="text-[#25D366]" /> Use a permanent System-User token so it never expires. Kept secret — never shown again after saving.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={lbl}>API Version</label><input className={field} value={s.apiVersion} onChange={e => setS({ ...s, apiVersion: e.target.value })} placeholder="v21.0" /></div>
                <div><label className={lbl}>Sender label (optional)</label><input className={field} value={s.senderLabel} onChange={e => setS({ ...s, senderLabel: e.target.value })} placeholder="e.g. Q Cargo Test Number" /></div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn btn-primary px-7 flex items-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
              </button>
              {saved && <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>}
            </div>
          </div>

          {/* Test */}
          <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-7">
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-2">Send a Test</h2>
            <p className="text-[11px] text-slate-400 mb-4">Sends the universal <b>hello_world</b> template. With a test number, the recipient must be a number you verified in Meta first.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input className={`${field} flex-1`} value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="Recipient WhatsApp e.g. +252 6XXXXXXXX" />
              <button onClick={sendTest} disabled={testing} className="btn bg-[#25D366] hover:bg-[#1eb858] text-white px-7 flex items-center justify-center gap-2 font-black rounded-xl">
                {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Test
              </button>
            </div>
            {testResult && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${testResult.ok ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30' : 'bg-rose-950/30 text-rose-400 border border-rose-800/30'}`}>
                {testResult.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {testResult.msg}
              </div>
            )}
          </div>

          {/* Help */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Where to find these</h3>
            <ul className="text-[11px] text-slate-400 space-y-1.5 font-medium list-disc list-inside">
              <li><b>Phone Number ID</b> & <b>WABA ID</b> — Meta for Developers → your app → WhatsApp → API Setup.</li>
              <li><b>Access Token</b> — same page (temporary), or make a permanent one via Business Settings → System Users.</li>
              <li>To message real customers you need an <b>approved message template</b> and a registered business number.</li>
            </ul>
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#25D366] hover:underline mt-3">
              Open Meta for Developers <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
