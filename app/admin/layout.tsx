'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Ship,
  Plane,
  ShoppingCart,
  FileText,
  CreditCard,
  Users,
  LogOut,
  ChevronRight,
  BarChart3,
  Bell,
  Settings,
  User,
  Menu,
  X,
  CheckSquare,
  Warehouse,
  Megaphone,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoginPage = pathname === '/admin/login';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warnLogout, setWarnLogout]       = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<{
    customers: { _id: string; name: string; phone: string }[];
    shipments: { _id: string; shipmentNumber: string; customer: string; type: string }[];
  }>({ customers: [], shipments: [] });

  const INACTIVITY_MS = 30 * 60 * 1000;  // 30 minutes
  const WARNING_MS   = 25 * 60 * 1000;  // warn at 25 minutes

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [status, isLoginPage, router]);

  // Tab-close logout: sessionStorage is wiped when the tab closes.
  // If the NextAuth cookie is still valid but there is no tab flag, this is a
  // fresh tab — sign out immediately so the user must log in again.
  useEffect(() => {
    if (isLoginPage || status === 'loading') return;
    if (status === 'authenticated') {
      if (!sessionStorage.getItem('qcargo_tab_active')) {
        signOut({ callbackUrl: '/admin/login' });
      }
    }
  }, [status, isLoginPage]);

  // Inactivity auto-logout
  useEffect(() => {
    if (isLoginPage || status !== 'authenticated') return;

    let logoutTimer: ReturnType<typeof setTimeout>;
    let warnTimer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      setWarnLogout(false);
      warnTimer   = setTimeout(() => setWarnLogout(true), WARNING_MS);
      logoutTimer = setTimeout(() => signOut({ callbackUrl: '/admin/login' }), INACTIVITY_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [isLoginPage, status]);

  // Global search — Ctrl+K to open, Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fetch search results whenever query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ customers: [], shipments: [] });
      return;
    }
    const q = searchQuery.toLowerCase();
    const timer = setTimeout(async () => {
      try {
        const [custRes, shipRes] = await Promise.all([fetch('/api/customers'), fetch('/api/shipments')]);
        const custs  = custRes.ok  ? await custRes.json()  : [];
        const ships  = shipRes.ok  ? await shipRes.json()  : [];
        setSearchResults({
          customers: custs.filter((c: { name?: string; phone?: string }) =>
            c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 5),
          shipments: ships.filter((s: { customer?: string; shipmentNumber?: string }) =>
            s.customer?.toLowerCase().includes(q) || s.shipmentNumber?.toLowerCase().includes(q)).slice(0, 5),
        });
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (isLoginPage) return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F15D38]/20 border-t-[#F15D38] rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Shipments', icon: Ship, href: '/admin/shipments' },
    { name: 'Batches', icon: Package, href: '/admin/batches' },
    { name: 'Warehouse', icon: Warehouse, href: '/admin/warehouse' },
    { name: 'Purchases', icon: ShoppingCart, href: '/admin/purchases' },
    { name: 'Customers', icon: Users, href: '/admin/customers' },
    { name: 'Quotations', icon: FileText, href: '/admin/quotations' },
    { name: 'Marketing', icon: Megaphone, href: '/admin/marketing' },
    { name: 'Expenses', icon: CreditCard, href: '/admin/expenses' },
    { name: 'Accounting', icon: BarChart3, href: '/admin/accounting' },
    { name: 'To-Do List', icon: CheckSquare, href: '/admin/todo' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#0B0F19] border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 lg:sticky lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <Link href="/admin" className="text-2xl font-black text-slate-100 tracking-tighter flex items-center gap-3">
            <img src="/logo-black.jpg" className="h-8 w-auto rounded-lg object-contain" alt="Q Cargo" />
            <span>Q<span className="text-[#F15D38]">CARGO</span></span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-100">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-bold transition-all group ${
                  isActive 
                    ? 'bg-[#F15D38] text-white shadow-md shadow-[#F15D38]/15 rounded-xl' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#F15D38]'} />
                  {item.name}
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-6 mt-auto">
          <div className="bg-[#131B2E] rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F15D38] flex items-center justify-center font-black text-white text-xs border-2 border-slate-700">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-slate-100">Admin User</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Logistics</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-slate-100 border border-slate-800 transition-colors flex items-center justify-center">
                <Bell size={16} />
              </button>
              <button className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-slate-100 border border-slate-800 transition-colors flex items-center justify-center">
                <Settings size={16} />
              </button>
              <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 hover:text-white border border-rose-800 transition-all flex items-center justify-center" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Inactivity warning banner */}
        {warnLogout && (
          <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-amber-500 text-amber-950 px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg">
            <span>⚠ You will be automatically logged out in 5 minutes due to inactivity. Move your mouse or press any key to stay logged in.</span>
            <button onClick={() => setWarnLogout(false)} className="underline whitespace-nowrap hover:no-underline">Dismiss</button>
          </div>
        )}
        {/* Top Navbar */}
        <header className="h-20 bg-[#0B0F19] border-b border-slate-800 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 rounded-full text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Connected
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            >
              <Search size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 ml-1">Ctrl K</span>
            </button>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-slate-400 uppercase text-right leading-none">
                Hargeisa Office<br />
                <span className="text-slate-100 font-bold">Main Branch</span>
              </p>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-10 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
      {/* ── Global Search Modal ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
        >
          <div
            className="w-full max-w-xl bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customers, shipments…"
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm font-bold outline-none"
              />
              <span className="text-[9px] font-black text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 cursor-pointer hover:border-slate-500"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>ESC</span>
            </div>

            {/* Results */}
            {(searchResults.customers.length > 0 || searchResults.shipments.length > 0) ? (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.customers.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-2">Customers</p>
                    {searchResults.customers.map(c => (
                      <button key={c._id}
                        onClick={() => { router.push('/admin/customers'); setSearchOpen(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 rounded-xl transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-[#F15D38]/20 border border-[#F15D38]/30 flex items-center justify-center text-[10px] font-black text-[#F15D38]">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{c.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{c.phone}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.shipments.length > 0 && (
                  <div className={`p-3 ${searchResults.customers.length > 0 ? 'border-t border-slate-800' : ''}`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-2">Shipments</p>
                    {searchResults.shipments.map(s => (
                      <button key={s._id}
                        onClick={() => { router.push('/admin/shipments'); setSearchOpen(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 rounded-xl transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-sky-950/30 border border-sky-800/30 flex items-center justify-center">
                          {s.type === 'AIR'
                            ? <Plane size={14} className="text-sky-400" />
                            : <Ship size={14} className="text-sky-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{s.shipmentNumber}</p>
                          <p className="text-[10px] font-bold text-slate-500">{s.customer}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-500">No results for &quot;{searchQuery}&quot;</p>
                <p className="text-[10px] font-bold text-slate-600 mt-1">Try a customer name or shipment number</p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 px-1">Quick navigate</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Shipments',  href: '/admin/shipments',  icon: Ship        },
                    { label: 'Customers',  href: '/admin/customers',  icon: Users       },
                    { label: 'Accounting', href: '/admin/accounting', icon: BarChart3   },
                    { label: 'Expenses',   href: '/admin/expenses',   icon: CreditCard  },
                  ].map(link => (
                    <button key={link.href}
                      onClick={() => { router.push(link.href); setSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors text-left">
                      <link.icon size={15} className="text-[#F15D38]" />
                      <span className="text-xs font-bold text-slate-300">{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
