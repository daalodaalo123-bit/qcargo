'use client';

import { 
  LayoutDashboard, 
  Package, 
  Ship,
  ShoppingCart, 
  FileText, 
  CreditCard, 
  Users,
  LogOut,
  ChevronRight,
  BarChart3,
  Globe,
  Bell,
  Settings,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Shipments', icon: Ship, href: '/admin/shipments' },
    { name: 'Batches', icon: Package, href: '/admin/batches' },
    { name: 'Purchases', icon: ShoppingCart, href: '/admin/purchases' },
    { name: 'Customers', icon: Users, href: '/admin/customers' },
    { name: 'Quotations', icon: FileText, href: '/admin/quotations' },
    { name: 'Expenses', icon: CreditCard, href: '/admin/expenses' },
    { name: 'Accounting', icon: BarChart3, href: '/admin/accounting' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-8">
          <Link href="/admin" className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe size={18} />
            </div>
            DURDUR<span className="text-blue-600">CARGO</span>
          </Link>
          <div className="mt-2 px-1 py-0.5 bg-blue-600/10 rounded w-fit">
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em]">Master Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                  {item.name}
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-[2rem] p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs border-2 border-white/20">
                AD
              </div>
              <div>
                <p className="text-xs font-black text-white">Admin User</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Logistics</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                <Bell size={16} />
              </button>
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                <Settings size={16} />
              </button>
              <Link href="/" className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Connected to Atlas
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Global Search</span>
              <div className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black border border-slate-200">⌘K</div>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-slate-400 uppercase text-right leading-none">
                Mogadishu Office<br />
                <span className="text-slate-900 font-bold">Main Branch</span>
              </p>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
