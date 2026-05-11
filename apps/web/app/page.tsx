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
      <div className="flex flex-col items-center gap-8">
        <img src="/GD_logo.png" alt="GD Logo" className="h-48 w-48 object-contain animate-bounce-slow" />
      </div>
    </div>
  );
}
