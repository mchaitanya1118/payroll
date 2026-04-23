"use client";

import { useEffect, useState, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Upload Excel', href: '/dashboard/upload', icon: FileText },
  { title: 'Riders', href: '/dashboard/riders', icon: Users },
  { title: 'Payroll', href: '/dashboard/payroll', icon: BarChart },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Handle auto-closing mobile menu on navigation
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

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className={cn(
        "p-6 flex items-center justify-between border-b border-slate-800",
        !sidebarOpen && !isMobile && "justify-center"
      )}>
        {(sidebarOpen || isMobile) && (
          <div className="text-xl font-black tracking-tighter uppercase italic text-white">
            Neqtra <span className="text-emerald-500">P.</span>
          </div>
        )}
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

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
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
              <item.icon size={22} className={cn("transition-colors", !sidebarOpen && !isMobile && "mx-auto")} />
              {(sidebarOpen || isMobile) && <span className="ml-3 text-sm">{item.title}</span>}
              {isActive && (sidebarOpen || isMobile) && (
                <div className="ml-auto bg-slate-900/10 p-0.5 rounded-full">
                  <ChevronRight size={14} />
                </div>
              )}
              {!sidebarOpen && !isMobile && (
                <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-slate-700">
                  {item.title}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center p-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-all",
            !sidebarOpen && !isMobile && "justify-center"
          )}
        >
          <LogOut size={22} />
          {(sidebarOpen || isMobile) && <span className="ml-3 text-sm font-bold">Logout</span>}
        </button>
        {(sidebarOpen || isMobile) && (
          <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl flex items-center group cursor-pointer hover:bg-white/10 transition-all">
            <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-slate-900 font-black text-sm uppercase shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-bold truncate text-white">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role || 'Guest'}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-outfit">
      <Toaster position="top-right" />
      
      {/* Desktop Sidebar */}
      <aside className={cn(
        "glass-sidebar hidden lg:flex flex-col text-white transition-all duration-300 ease-in-out shadow-2xl z-40",
        sidebarOpen ? "w-72" : "w-20"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-slate-900 z-[70] lg:hidden flex flex-col transition-transform duration-300 ease-in-out shadow-2xl",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent isMobile />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic truncate">
              Dashboard <span className="text-slate-400 mx-1 md:mx-2">/</span> <span className="text-emerald-600">{pathname?.split('/').pop() || 'Overview'}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
             <div className="hidden sm:flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
             </div>
             {/* Mobile Profile Trigger (Optional) */}
             <div className="h-8 w-8 bg-emerald-500 rounded-full flex lg:hidden items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 backdrop-blur-sm scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
