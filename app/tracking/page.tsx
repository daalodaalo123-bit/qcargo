'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Camera
} from 'lucide-react';

export default function TrackingPage({ searchParams }: { searchParams: { q?: string } }) {
  const [trackingId, setTrackingId] = useState(searchParams.q || '');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(!!searchParams.q);

  const mockShipment = {
    id: trackingId || "QC-2024-KM-901",
    customer: "Ahmed Ali",
    goods: "Mixed Electronics & Household Goods",
    status: "IN_TRANSIT",
    type: "SEA",
    origin: "Guangzhou, China",
    destination: "Hargeisa, Somaliland",
    progress: 65,
    estimatedArrival: "June 12, 2024",
    lastUpdate: "May 20, 2024 • 10:30 AM",
    timeline: [
      { status: 'Arrived at Berbera Port', location: 'Somaliland', date: 'June 12 (Est.)', completed: false, current: false },
      { status: 'In Transit - Indian Ocean', location: 'At Sea', date: 'May 20, 2024', completed: true, current: true },
      { status: 'Departed Nansha Port', location: 'Guangzhou, China', date: 'May 12, 2024', completed: true, current: false },
      { status: 'Consolidated & Loaded', location: 'Q Cargo Warehouse, GZ', date: 'May 10, 2024', completed: true, current: false },
      { status: 'Shipment Received', location: 'Guangzhou, China', date: 'May 08, 2024', completed: true, current: false },
    ]
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <img src="/logo-black.jpg" className="h-9 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-blue-600">CARGO</span></span>
          </Link>
          <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <a href="/#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="/#about" className="hover:text-blue-600 transition-colors">About</a>
            <Link href="/admin/login" className="text-blue-600">Agent Access</Link>
          </div>
          <Link href="/tracking" className="hidden md:block btn btn-primary !rounded-xl !px-6 !py-2.5 !text-xs shadow-lg shadow-blue-600/20">
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
              Enter your tracking number or batch ID to see the real-time status of your shipments from China to Somalia.
            </p>

            <form onSubmit={handleTrack} className="relative max-w-2xl mx-auto">
              <input 
                type="text" 
                placeholder="Enter Tracking Number (e.g. QC-2024-KM-901)"
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
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button 
              onClick={() => setShowResult(false)}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to search
            </button>

            {/* Shipment Header Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mockShipment.type === 'SEA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {mockShipment.type === 'SEA' ? <Ship size={32} /> : <Plane size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargo Shipment</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mockShipment.type === 'SEA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {mockShipment.type} FREIGHT
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 font-mono">{mockShipment.id}</h2>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {mockShipment.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs font-bold text-slate-400">Last update: {mockShipment.lastUpdate}</p>
                </div>
              </div>

              {/* Progress Visualizer */}
              <div className="space-y-4 mb-12">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</span>
                    <span className="font-bold text-slate-900">{mockShipment.origin}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{mockShipment.progress}% Journey</span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</span>
                    <span className="font-bold text-slate-900">{mockShipment.destination}</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${mockShipment.progress}%` }}
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
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{mockShipment.goods}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                    <p className="text-sm font-bold text-slate-700">{mockShipment.estimatedArrival}</p>
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
                    {mockShipment.timeline.map((event, i) => (
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
                    <button className="w-full flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-xl text-blue-400 transition-transform group-hover:scale-110">
                        <Bell size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">Get Updates</p>
                        <p className="text-[10px] opacity-40">Notify via WhatsApp</p>
                      </div>
                    </button>
                    <button className="w-full flex items-center gap-4 group border-t border-white/5 pt-5">
                      <div className="p-3 bg-white/5 rounded-xl text-emerald-400 transition-transform group-hover:scale-110">
                        <Printer size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">Print Receipt</p>
                        <p className="text-[10px] opacity-40">Download as PDF</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-rose-600">
                    <AlertCircle size={24} />
                    <h5 className="font-bold text-rose-900">Report Issue</h5>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Missing items or damaged cargo? Report directly to our claims department for immediate investigation.
                  </p>
                  <button className="text-xs font-bold text-rose-900 underline decoration-2 underline-offset-4">
                    Open Dispute Case
                  </button>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <HelpCircle size={24} />
                    <h5 className="font-bold text-slate-900">FAQ & Guides</h5>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Learn more about customs clearance, shipping durations, and prohibited items.
                  </p>
                  <button className="text-xs font-bold text-blue-600 flex items-center gap-1 group hover:underline">
                    Read Guides
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer */}
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
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                <Camera size={20} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                <Share2 size={20} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                <MessageCircle size={20} />
              </div>
            </div>
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
              <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-600">Track Shipment</a></li>
              <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
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
                <div className="text-sm font-bold text-slate-900 leading-none">qcargoshipping@gmail.com</div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight uppercase tracking-tight">Hargeisa, Somaliland<br/>Hadhwanaag Mall</div>
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
