"use client";

import { Toaster } from "@/components/ui/sonner";

export default function RiderPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-900">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative flex flex-col">
         {children}
      </div>
    </div>
  );
}
