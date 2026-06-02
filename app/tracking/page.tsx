'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTACT_SITE_HOST, CONTACT_SITE_URL } from '@/lib/brand';
import {
  Search,
  MapPin,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Truck,
  Ship,
  Plane,
  Bell,
  Printer,
  AlertCircle,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  Share2,
  Camera,
  XCircle,
} from 'lucide-react';

interface TrackingResult {
  found: boolean;
  id: string;
  customer: string;
  goods: string;
  status: string;
  type: 'AIR' | 'SEA';
  origin: string;
  destination: string;
  progress: number;
  estimatedArrival: string;
  lastUpdate: string;
  batch: string | null;
  paymentStatus: string;
  timeline: {
    status: string;
    location: string;
    date: string;
    completed: boolean;
    current: boolean;
  }[];
}

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await fetch(`/api/tracking?q=${encodeURIComponent(trackingId.trim())}`);
      if (res.status === 404) {
        setNotFound(true);
        setShowResult(true);
      } else if (res.ok) {
        const data: TrackingResult = await res.json();
        setResult(data);
        setShowResult(true);
      }
    } catch {
      setNotFound(true);
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowResult(false);
    setResult(null);
    setNotFound(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans text-slate-100">
      {/* Navigation Header */}
      <nav className="bg-[#0B0F19] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <img src="/logo-black.jpg" className="h-9 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-blue-600">CARGO</span></span>
          </Link>
          <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <a href="/#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="/#about" className="hover:text-blue-600 transition-colors">About</a>
          </div>
          <Link href="/tracking" className="hidden md:block bg-blue-600 text-white rounded-xl px-5 py-2.5 text-xs font-black hover:bg-blue-700 transition-all shadow-lg">
            Track Cargo
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {!showResult ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Search size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Track Your Cargo</h1>
            <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Enter your shipment number or batch ID to see the real-time status of your cargo from China to Somalia.
            </p>
            <form onSubmit={handleTrack} className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Enter Shipment Number (e.g. QC-2024-001)"
                className="w-full py-6 px-8 rounded-[2rem] bg-white border-none shadow-2xl shadow-blue-900/10 text-lg font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 transition-all"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {loading ? 'Searching...' : (
                  <>
                    <Truck size={20} />
                    Track Now
                  </>
                )}
              </button>
            </form>
          </div>
        ) : notFound ? (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors group mx-auto">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to search
            </button>
            <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">Shipment Not Found</h2>
              <p className="text-slate-500 mb-6">
                No shipment found for <span className="font-bold text-slate-800">"{trackingId}"</span>. Check the number and try again, or contact our office.
              </p>
              <a
                href="https://wa.me/252633901811"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
              >
                <MessageCircle size={18} />
                WhatsApp Support
              </a>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to search
            </button>

            {/* Shipment Header Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.type === 'SEA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {result.type === 'SEA' ? <Ship size={32} /> : <Plane size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargo Shipment</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${result.type === 'SEA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {result.type} FREIGHT
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 font-mono">{result.id}</h2>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                    result.status === 'ARRIVED' || result.status === 'DELIVERED' || result.status === 'COLLECTED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : result.status === 'IN_TRANSIT'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      result.status === 'ARRIVED' || result.status === 'DELIVERED'
                        ? 'bg-emerald-500'
                        : result.status === 'IN_TRANSIT'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                    }`} />
                    {result.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs font-bold text-slate-400">Last update: {result.lastUpdate}</p>
                </div>
              </div>

              {/* Progress Visualizer */}
              <div className="space-y-4 mb-12">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</span>
                    <span className="font-bold text-slate-900">{result.origin}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{result.progress}% Journey</span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</span>
                    <span className="font-bold text-slate-900">{result.destination}</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${result.progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items Description</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{result.goods}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                    <p className="text-sm font-bold text-slate-700">{result.estimatedArrival}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Timeline Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Shipment Journey
                  </h3>
                  <div className="space-y-8 relative before:absolute before:left-3 md:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                    {result.timeline.map((event, i) => (
                      <div key={i} className="flex gap-6 md:gap-8 relative">
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 z-10 flex items-center justify-center transition-all ${
                          event.completed ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'
                        } ${event.current ? 'ring-4 ring-blue-100' : ''}`}>
                          {event.completed ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                        </div>
                        <div>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                            <h4 className={`text-sm font-bold ${event.current ? 'text-blue-600' : 'text-slate-900'}`}>{event.status}</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md tracking-wider">
                              {event.location}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{event.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side Support Panel */}
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20">
                  <h4 className="text-sm font-bold opacity-40 uppercase tracking-widest mb-6">Need Support?</h4>
                  <div className="space-y-5">
                    <a
                      href={`https://wa.me/252633901811?text=I need updates on shipment ${result.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-4 group"
                    >
                      <div className="p-3 bg-white/5 rounded-xl text-blue-400 transition-transform group-hover:scale-110">
                        <Bell size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">Get Updates</p>
                        <p className="text-[10px] opacity-40">Notify via WhatsApp</p>
                      </div>
                    </a>
                    <div className="w-full flex items-center gap-4 group border-t border-white/5 pt-5 opacity-40 cursor-not-allowed">
                      <div className="p-3 bg-white/5 rounded-xl text-emerald-400">
                        <Printer size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">Print Receipt</p>
                        <p className="text-[10px] opacity-60">Request from office</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-rose-600">
                    <AlertCircle size={24} />
                    <h5 className="font-bold text-rose-900">Report Issue</h5>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Missing items or damaged cargo? Contact us immediately for investigation.
                  </p>
                  <a
                    href="https://wa.me/252633901811?text=I want to report an issue with my shipment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-rose-900 underline decoration-2 underline-offset-4"
                  >
                    Contact Us via WhatsApp
                  </a>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <HelpCircle size={24} />
                    <h5 className="font-bold text-slate-900">Questions?</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Call us or visit our office at Hadhwanaag Mall, Hargeisa.
                  </p>
                  <a href="tel:+252633901811" className="text-xs font-bold text-blue-600 flex items-center gap-1 group hover:underline">
                    +252 63 390 1811
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 py-24 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-3 mb-8">
              <img src="/logo-black.jpg" className="h-9 w-auto rounded-lg object-contain" alt="Q Cargo" />
              <span>Q<span className="text-blue-600">CARGO</span></span>
            </Link>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
              Q Cargo is a premier logistics provider specializing in sourcing and transportation between China and East Africa.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Services</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600">
              <li><a href="#" className="hover:text-blue-600">Air Freight</a></li>
              <li><a href="#" className="hover:text-blue-600">Sea Freight</a></li>
              <li><a href="#" className="hover:text-blue-600">Product Sourcing</a></li>
              <li><a href="#" className="hover:text-blue-600">Customs Clearing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Support</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600">
              <li><Link href="/tracking" className="hover:text-blue-600">Track Shipment</Link></li>
              <li><Link href="/customer" className="hover:text-blue-600">Customer Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Contact</h4>
            <ul className="space-y-6">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Phone size={18} />
                </div>
                <div className="text-sm font-bold text-slate-900">+252 63 390 1811</div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Mail size={18} />
                </div>
                <div className="text-sm font-bold text-slate-900">qcargoshipping@gmail.com</div>
              </li>
              <li className="flex items-center gap-4">
                <a href={CONTACT_SITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Globe size={18} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{CONTACT_SITE_HOST}</div>
                </a>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight uppercase tracking-tight">Hargeisa, Somaliland<br />Hadhwanaag Mall</div>
              </li>
              <li className="flex items-center gap-4">
                <a href="https://wa.me/252633901811" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <MessageCircle size={18} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">WhatsApp: +252 63 390 1811</div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            © 2024 Q Cargo Logistics Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
