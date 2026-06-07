'use client';

import { useState, useEffect } from 'react';
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
  User,
  Menu,
  X,
  CheckSquare,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [status, isLoginPage, router]);

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
              <Link href="/" className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 hover:text-white border border-rose-800 transition-all flex items-center justify-center">
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
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
            <div className="hidden md:flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
              <div className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-black border border-slate-700">⌘K</div>
            </div>
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
    </div>
  );
}
