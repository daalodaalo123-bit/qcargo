'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTACT_SITE_HOST, CONTACT_SITE_URL } from '@/lib/brand';
import {
  Search,
  Ship,
  Plane,
  Globe,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Phone,
  Mail,
  Share2,
  Camera,
  MessageCircle,
  MapPin,
  Menu,
  X,
  User,
} from 'lucide-react';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans text-slate-100 overflow-x-hidden">

      {/* Navigation */}
      <nav className="bg-[#0B0F19] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-black tracking-tighter flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src="/logo-black.jpg" className="h-8 sm:h-9 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-blue-600">CARGO</span></span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#tracking" className="hover:text-blue-600 transition-colors">Tracking</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/customer" className="hidden sm:flex items-center gap-1.5 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-700 transition-all">
              <User size={13} />
              Portal
            </Link>
            <Link href="/tracking" className="hidden sm:block bg-blue-600 text-white rounded-xl px-5 py-2 text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              Track Shipment
            </Link>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
              aria-label="Menu"
            >
              {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden bg-[#131B2E] border-b border-slate-800 animate-in slide-in-from-top duration-200">
            <div className="px-6 py-6 flex flex-col gap-1">
              <a href="#services" onClick={() => setIsMobileOpen(false)}
                className="px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all">Services</a>
              <a href="#tracking" onClick={() => setIsMobileOpen(false)}
                className="px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all">Tracking</a>
              <div className="border-t border-slate-800 my-2" />
              <Link href="/tracking" onClick={() => setIsMobileOpen(false)}
                className="px-4 py-3 text-sm font-bold text-blue-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all flex items-center gap-2">
                <Search size={15} /> Track Shipment
              </Link>
              <Link href="/customer" onClick={() => setIsMobileOpen(false)}
                className="px-4 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2">
                <User size={15} /> Customer Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 md:pt-24 pb-16 md:pb-32 overflow-hidden px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* Left: text */}
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Global Logistics Partner
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.95] mb-5 md:mb-8">
              Sourcing<br />
              <span className="text-blue-600">Simplified.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Your premium partner for air and sea freight from China to Hargeisa — reliable, fast, and fully tracked.
            </p>

            {/* CTAs: 2 on mobile, 3 on desktop */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/tracking"
                className="bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30">
                Track Shipment
                <ArrowRight size={17} />
              </Link>
              <Link href="/customer"
                className="bg-slate-800 text-white border border-slate-700 py-4 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                <User size={17} />
                Customer Portal
              </Link>
              <a href="#services"
                className="hidden sm:flex items-center justify-center gap-2 bg-transparent text-slate-400 border border-slate-700 py-4 px-8 rounded-2xl font-bold text-sm hover:border-slate-500 hover:text-slate-200 transition-all">
                Our Services
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 md:mt-14 flex items-center justify-center lg:justify-start gap-6 md:gap-8">
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">10k+</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shipments</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">99%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reliability</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">24/7</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Support</p>
              </div>
            </div>
          </div>

          {/* Right: cards */}
          <div className="relative mt-4 lg:mt-0">
            <div className="relative z-10 space-y-4 max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-700 sm:-rotate-2 sm:hover:rotate-0 transition-transform duration-500 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">China → Hargeisa</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2 tracking-tight">Express Air Freight</h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-5">
                  Fastest way to get cargo home. Twice-weekly flights with full tracking.
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                  <div className="text-center pr-4 border-r border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</p>
                    <p className="text-sm font-black text-white">2 Weeks</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-400 bg-blue-600/10 border border-blue-600/20 px-2 py-1 rounded-lg">EXPRESS</span>
                </div>
              </div>

              <div className="bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-700 sm:rotate-2 sm:hover:rotate-0 transition-transform duration-500 shadow-xl sm:translate-x-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Guangzhou → Hargeisa</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2 tracking-tight">Premium Sea Freight</h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-5">
                  Cost-effective for large shipments and bulky commercial goods.
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                  <div className="text-center pr-4 border-r border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</p>
                    <p className="text-sm font-black text-white">30–45 Days</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 px-2 py-1 rounded-lg">ECONOMY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section id="tracking" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Real-Time Tracking</h2>
          <p className="text-slate-400 text-base mb-10 max-w-lg mx-auto">
            Enter your shipment number to see live status from China to Hargeisa.
          </p>

          <form action="/tracking" method="GET" className="flex flex-col sm:flex-row gap-3">
            <input
              name="q"
              type="text"
              placeholder="Enter shipment number…"
              className="flex-1 py-4 px-5 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button type="submit"
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 flex-shrink-0">
              <Search size={17} />
              Track
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-500" />
              Live Updates
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-500" />
              Photo Proof
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-500" />
              WhatsApp Alerts
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-28 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Full-Spectrum Logistics</h2>
            <p className="text-slate-400 text-sm md:text-base">From procurement in China to delivery in Hargeisa.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {[
              { title: 'Air Freight', desc: 'Express deliveries for high-value and urgent goods. 2 weeks from Guangzhou to Hargeisa.', icon: Plane, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-600/20' },
              { title: 'Sea Freight', desc: 'Economical shipping for large batches and bulky items. Monthly container departures.', icon: Ship, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-600/20' },
              { title: 'Sourcing', desc: 'Professional sourcing agents in China helping you find the best factories and prices.', icon: Search, color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-600/20' },
            ].map((service, i) => (
              <div key={i} className="group p-7 md:p-9 rounded-[2rem] bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-700 transition-all duration-300">
                <div className={`w-12 h-12 md:w-14 md:h-14 ${service.bg} border ${service.color} rounded-2xl flex items-center justify-center mb-5 md:mb-7 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-3">{service.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{service.desc}</p>
                <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">
                  Learn More
                  <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F19] border-t border-slate-800 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2 mb-5">
                <img src="/logo-black.jpg" className="h-8 w-auto rounded-lg object-contain" alt="Q Cargo" />
                <span>Q<span className="text-blue-600">CARGO</span></span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Premier logistics between China and East Africa.
              </p>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-600/40 transition-all cursor-pointer">
                  <Camera size={16} />
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-600/40 transition-all cursor-pointer">
                  <Share2 size={16} />
                </div>
                <a href="https://wa.me/252633901811" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-600/40 transition-all">
                  <MessageCircle size={16} />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Services</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-400">
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Air Freight</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Sea Freight</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Product Sourcing</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Customs Clearing</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Customer</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-400">
                <li><Link href="/tracking" className="hover:text-blue-400 transition-colors">Track Shipment</Link></li>
                <li><Link href="/customer" className="hover:text-blue-400 transition-colors">Customer Portal</Link></li>
                <li><a href="https://wa.me/252633901811" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">WhatsApp Support</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm text-slate-300">+252 63 390 1811</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="text-xs text-slate-300 break-all">qcargoshipping@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <a href={CONTACT_SITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                      <Globe size={14} />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors">{CONTACT_SITE_HOST}</span>
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
                    <MapPin size={14} />
                  </div>
                  <span className="text-xs text-slate-400 leading-snug">Hadhwanaag Mall<br />Hargeisa, Somaliland</span>
                </li>
                <li>
                  <a href="https://wa.me/252633901811" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-600/20 transition-all">
                    <MessageCircle size={14} />
                    WhatsApp Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
              © 2024 Q Cargo Logistics Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
