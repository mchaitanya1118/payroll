"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  ChevronRight, 
  LogOut, 
  ShieldCheck,
  Calendar,
  ChevronLeft,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

export default function RiderPortalDashboard() {
  const router = useRouter();
  const { format } = useCurrency();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rider, setRider] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('rider_token');
    const riderData = localStorage.getItem('rider_data');
    if (!token || !riderData) {
      router.push('/portal/login');
      return;
    }
    setRider(JSON.parse(riderData));
    fetchPortalData(token);
  }, []);

  const fetchPortalData = async (token: string) => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        api.get('/rider-portal/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/rider-portal/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setData(summaryRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      toast.error('Failed to load portal data');
      localStorage.removeItem('rider_token');
      router.push('/portal/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_token');
    localStorage.removeItem('rider_data');
    router.push('/portal/login');
  };

  if (loading) return (
    <div className="p-8 space-y-6">
       <Skeleton className="h-20 w-full rounded-2xl" />
       <Skeleton className="h-48 w-full rounded-3xl" />
       <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
       </div>
       <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col pb-10">
      {/* Premium Profile Header */}
      <div className="p-8 pb-12 bg-slate-900 text-white relative overflow-hidden rounded-b-[3rem] shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
         </div>
         <div className="flex justify-between items-start relative z-10">
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] italic">Active Session</p>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase">{rider?.name}</h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">ID: {rider?.riderId}</p>
            </div>
            <button onClick={handleLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
               <LogOut size={20} className="text-red-400" />
            </button>
         </div>
      </div>

      {/* Main Dashboard Stats */}
      <div className="px-6 -mt-10 relative z-20 space-y-6">
         {/* Monthly Earnings Card */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100"
         >
            <div className="flex items-center gap-3 mb-6">
               <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp size={20} />
               </div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Earnings this month</span>
            </div>
            <div className="space-y-1">
               <p className="text-5xl font-black italic tracking-tighter text-slate-900">{format(data?.payslip?.netTotal || 0)}</p>
               <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Expected Payout</p>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Orders</p>
                  <p className="text-lg font-black text-slate-900 italic">{(data?.payslip?.totalSingleOrders || 0) + (data?.payslip?.totalDoubleOrders || 0)}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Status</p>
                  <p className={`text-sm font-black uppercase italic ${data?.payslip?.targetAchieved ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {data?.payslip?.targetAchieved ? 'Target Hit ✓' : 'In Progress'}
                  </p>
               </div>
            </div>
         </motion.div>

         {/* Secondary Stats */}
         <div className="grid grid-cols-2 gap-4">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 group"
            >
               <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
               </div>
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Loan Balance</p>
               <p className="text-xl font-black text-slate-900 italic">{format(data?.totalAdvanceBalance || 0)}</p>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 group"
            >
               <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                  <Clock size={20} />
               </div>
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Recent Activity</p>
               <p className="text-xl font-black text-slate-900 italic">{data?.recentEntries?.length || 0} Days</p>
            </motion.div>
         </div>

         {/* History Section */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-lg font-black uppercase italic text-slate-900 tracking-tight">Payslip History</h3>
               <button className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">View All</button>
            </div>
            <div className="space-y-3">
               {history.length === 0 ? (
                 <p className="text-center py-10 text-slate-400 italic text-sm">No historical data found.</p>
               ) : (
                 history.map((slip, i) => (
                   <motion.div 
                     key={slip.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                   >
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-900">
                           <span className="text-[8px] font-black uppercase leading-none">{new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'short' })}</span>
                           <span className="text-xs font-black">{slip.year}</span>
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900">Final Payout</p>
                           <p className={`text-[10px] font-black uppercase tracking-widest ${slip.status === 'FINAL' ? 'text-emerald-500' : 'text-slate-400'}`}>{slip.status}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-base font-black text-slate-900">{format(slip.netTotal)}</p>
                        <ChevronRight className="ml-auto text-slate-300" size={16} />
                     </div>
                   </motion.div>
                 ))
               )}
            </div>
         </div>
      </div>

      {/* Support / Bottom CTA */}
      <div className="px-6 mt-10">
         <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Calendar size={100} />
            </div>
            <h4 className="text-xl font-black uppercase italic tracking-tight mb-2">Need a copy?</h4>
            <p className="text-emerald-50 text-xs font-medium mb-6 leading-relaxed">
               Official PDF payslips are generated by the accounts team. You can request a physical copy via WhatsApp.
            </p>
            <Button className="w-full h-14 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
               Request Official PDF <Download size={16} />
            </Button>
         </div>
      </div>
    </div>
  );
}
