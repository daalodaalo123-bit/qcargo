'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Truck, 
  Ship, 
  Plane, 
  Globe, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Package,
  CheckCircle2,
  Phone,
  Mail,
  Share2,
  Camera,
  MessageCircle,
  MapPin
} from 'lucide-react';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Premium Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Globe size={20} />
            </div>
            DURDUR<span className="text-blue-600">CARGO</span>
          </Link>
          <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#tracking" className="hover:text-blue-600 transition-colors">Tracking</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About Us</a>
            <Link href="/admin/login" className="text-blue-600">Agent Access</Link>
          </div>
          <Link href="/tracking" className="hidden md:block btn btn-primary !rounded-xl !px-6 !py-2.5 !text-xs shadow-lg shadow-blue-600/20">
            Track Shipment
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Global Logistics Partner
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-8">
              Sourcing <br />
              <span className="text-blue-600">Simplified.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
              Your premium partner for air and sea freight. We bridge the gap between international markets and East Africa with unmatched reliability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tracking" className="btn btn-primary !py-5 !px-10 !text-sm flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/30">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <a href="#services" className="btn bg-white border border-slate-200 text-slate-600 !py-5 !px-10 !text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                Our Services
              </a>
            </div>
            
            <div className="mt-16 flex items-center gap-8">
              <div>
                <p className="text-3xl font-black text-slate-900">10k+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipments</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div>
                <p className="text-3xl font-black text-slate-900">99%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reliability</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div>
                <p className="text-3xl font-black text-slate-900">24/7</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Visual element: Abstract cargo cards */}
            <div className="relative z-10 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 transform -rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">China → Hargeisa</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Express Air Freight</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                  The fastest way to get your cargo home. Twice-weekly flights with full tracking.
                </p>
                <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                  <div className="text-center px-4 border-r border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-black text-slate-900">2 Weeks</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">EXPRESS</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-slate-100 transform rotate-3 hover:rotate-0 transition-transform duration-700 translate-x-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Guangzhou → Hargeisa</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Premium Sea Freight</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                  Cost-effective solutions for large shipments and bulky commercial goods.
                </p>
                <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                  <div className="text-center px-4 border-r border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-black text-slate-900">30-45 Days</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">ECONOMY</span>
                </div>
              </div>
            </div>
            
            {/* Background decorative circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Interactive Tracking Section */}
      <section id="tracking" className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Globe size={800} className="absolute -right-1/4 -bottom-1/4 text-blue-400" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Real-Time Visibility</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
            Your cargo is valuable. Track it every step of the way with our advanced global tracking system.
          </p>
          
          <form action="/tracking" method="GET" className="relative group">
            <input 
              name="q"
              type="text" 
              placeholder="Enter your Tracking ID (e.g. DUR-2024-KM-901)"
              className="w-full py-8 px-10 rounded-[2.5rem] bg-white/5 border border-white/10 text-xl font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-600/20 focus:bg-white/10 transition-all outline-none"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-blue-500 transition-all flex items-center gap-2 shadow-xl shadow-blue-600/40">
              <Search size={20} />
              Track Now
            </button>
          </form>
          
          <div className="mt-8 flex justify-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-500" />
              Live Updates
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-500" />
              Photo Proof
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-500" />
              Direct SMS
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Full-Spectrum Logistics</h2>
            <p className="text-slate-500 text-lg font-medium">From procurement in China to delivery in Somalia.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Air Freight', desc: 'Express deliveries for high-value and urgent goods. 5-7 days from Guangzhou to Mogadishu.', icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'Sea Freight', desc: 'Economical shipping for large batches and bulky items. Monthly container departures.', icon: Ship, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { title: 'Sourcing', desc: 'Professional sourcing agents in China helping you find the best factories and prices.', icon: Search, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((service, i) => (
              <div key={i} className="group p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
                <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <service.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{service.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium mb-8">{service.desc}</p>
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                  Learn More
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Globe size={20} />
              </div>
              DURDUR<span className="text-blue-600">CARGO</span>
            </Link>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
              Durdur Cargo is a premier logistics provider specializing in sourcing and transportation between China and East Africa.
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
                <div className="text-sm font-bold text-slate-900 leading-none">durdur.shipping@gmail.com</div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight uppercase tracking-tight">Hargeisa, Somaliland<br/>Curruba Mall</div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            © 2024 Durdur Cargo Logistics Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
