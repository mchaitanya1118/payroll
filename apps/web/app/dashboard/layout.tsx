"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  BarChart,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Database,
  PieChart,
  Edit3,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Daily Entry', href: '/dashboard/daily-entry', icon: Calendar },
  { title: 'Data Entry', href: '/dashboard/entry', icon: Edit3 },
  { title: 'Upload Excel', href: '/dashboard/upload', icon: FileText },
  { title: 'Riders', href: '/dashboard/riders', icon: Users },
  { title: 'Payroll', href: '/dashboard/payroll', icon: BarChart },
  { title: 'Advances', href: '/dashboard/advances', icon: TrendingUp },
  { title: 'Reports', href: '/dashboard/reports', icon: PieChart },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const SidebarContent = ({
  isMobile = false,
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  pathname,
  router,
  logout,
  user
}: any) => (
  <>
    <div className={cn(
      "border-b border-slate-800 transition-all duration-300",
      (sidebarOpen || isMobile)
        ? "p-4 flex items-center justify-between flex-row"
        : "p-2 flex flex-col items-center justify-center gap-2"
    )}>
      <div className={cn(
        "flex items-center justify-center transition-all duration-300",
        (sidebarOpen || isMobile) ? "flex-row gap-1" : "flex-col"
      )}>
        <img
          src="/GD_logo.png"
          alt="GD Logo"
          className={cn(
            "object-contain transition-all duration-300",
            (sidebarOpen || isMobile) ? "h-16 w-16" : "h-16 w-16"
          )}
        />
        {(sidebarOpen || isMobile) && (
          <span className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Groups
          </span>
        )}
      </div>
      {!isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      {isMobile && (
        <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
          <X size={24} />
        </button>
      )}
    </div>

    <nav className={cn(
      "flex-1 py-6 px-3 space-y-2",
      sidebarOpen ? "overflow-y-auto" : "overflow-visible"
    )}>
      {navItems
        .filter((item: any) => {
          if ((item.href === '/dashboard/settings' || item.href === '/dashboard/reports') && user?.role !== 'ADMIN') return false;
          return true;
        })
        .map((item: any) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all group relative duration-300",
                isActive ? "sidebar-item-active" : "hover:bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              <item.icon size={22} className={cn("transition-colors shrink-0", !sidebarOpen && !isMobile && "mx-auto")} />
              <span className={cn(
                "ml-3 text-sm whitespace-nowrap transition-all duration-300",
                (sidebarOpen || isMobile) ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              )}>
                {item.title}
              </span>
              {(sidebarOpen || isMobile) && isActive && (
                <div className="ml-auto bg-slate-900/10 p-0.5 rounded-full shrink-0">
                  <ChevronRight size={14} />
                </div>
              )}
              {!sidebarOpen && !isMobile && (
                <div className="absolute left-16 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 group-hover:left-[70px] transition-all duration-300 whitespace-nowrap z-[100] pointer-events-none border border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-emerald-500/30 rotate-45" />
                  {item.title}
                </div>
              )}
            </button>
          );
        })}
    </nav>

    <div className="p-4 border-t border-slate-800">
      {(sidebarOpen || isMobile) ? (
        <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center group hover:bg-white/10 transition-all">
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-slate-900 font-black text-sm uppercase shadow-lg shadow-emerald-500/20 flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role || 'Guest'}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors group/logout"
            title="Logout"
          >
            <LogOut size={18} className="group-hover/logout:scale-110 transition-transform" />
          </button>
        </div>
      ) : (
        <button
          onClick={logout}
          className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all"
          title="Logout"
        >
          <LogOut size={22} />
        </button>
      )}
    </div>
  </>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isHydrated && !user) {
      router.replace('/login');
    }
  }, [user, isHydrated, router, mounted]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 border-none">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-slate-400 text-sm animate-pulse font-outfit uppercase tracking-widest">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-outfit">
      <Toaster position="top-right" />

      <aside className={cn(
        "glass-sidebar hidden lg:flex flex-col text-white transition-all duration-300 ease-in-out shadow-2xl z-40 shrink-0",
        sidebarOpen ? "w-72" : "w-20"
      )}>
        <SidebarContent
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          pathname={pathname}
          router={router}
          logout={logout}
          user={user}
        />
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-slate-900 z-[70] lg:hidden flex flex-col transition-all duration-300 ease-in-out shadow-2xl",
        mobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"
      )}>
        <SidebarContent
          isMobile
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          pathname={pathname}
          router={router}
          logout={logout}
          user={user}
        />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-[0.1em] md:tracking-[0.2em] italic truncate">
              Dashboard <span className="text-slate-400 mx-1 md:mx-2">/</span> <span className="text-emerald-600">{pathname?.split('/').pop() || 'Overview'}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="h-8 w-8 md:h-9 md:w-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 backdrop-blur-sm scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
