"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isHydrated) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, router, mounted, isHydrated]);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="animate-pulse text-2xl font-black text-emerald-500 italic uppercase">
        Neqtra Payroll
      </div>
    </div>
  );
}
