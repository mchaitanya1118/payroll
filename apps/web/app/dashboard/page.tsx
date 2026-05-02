"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, FileCheck, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { format } = useCurrency();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayoutLastMonth: 0,
    activeSlips: 0,
    payoutGrowth: 0,
    insights: {
      efficiencyGrowth: 0,
      dominantStructure: 'Order-based',
      avgSalary: 0,
      topEarner: 0
    }
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ];

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    // Fetch core stats
    try {
      const [ridersCountRes, dashboardRes] = await Promise.all([
        api.get('/riders/count'),
        api.get(`/payslips/dashboard?month=${month}&year=${year}`)
      ]);
      
      const summary = dashboardRes.data.summary || {};
      setStats({
        totalEmployees: ridersCountRes.data || 0,
        totalPayoutLastMonth: summary.totalPayout || 0,
        activeSlips: dashboardRes.data.slipsCount || 0,
        payoutGrowth: summary.payoutGrowth || 0,
        insights: dashboardRes.data.insights || {
          efficiencyGrowth: 0,
          dominantStructure: 'Order-based',
          avgSalary: 0,
          topEarner: 0
        }
      });
      setRecentActivity(dashboardRes.data.recentActivity || []);
    } catch (error) {
      console.error('Failed to fetch core dashboard stats');
    }

    // Fetch analytics separately
    try {
      const analyticsRes = await api.get(`/reports/analytics?month=${month}&year=${year}`);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [month, year]);

  const cards = [
    { 
      title: 'Total Workforce', 
      value: stats.totalEmployees, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Active employees across all roles'
    },
    { 
      title: 'Monthly Payout', 
      value: format(stats.totalPayoutLastMonth), 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      description: `Total payout for ${months.find(m => m.value === month)?.label} ${year}`
    },
    { 
      title: 'Slips Generated', 
      value: stats.activeSlips, 
      icon: FileCheck, 
      color: 'bg-amber-500',
      description: 'Completed slips for this period'
    },
    { 
      title: 'Growth Rate', 
      value: `${stats.payoutGrowth}%`, 
      icon: TrendingUp, 
      color: 'bg-indigo-500',
      description: 'Month-over-month increase'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] premium-shadow border border-white/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <TrendingUp className="text-emerald-500 shrink-0" size={32} />
              Commander Center
            </h2>
            <button 
              onClick={() => fetchDashboardData()} 
              disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <ArrowUpRight size={16} className={loading ? "animate-spin text-slate-400" : "text-slate-400 group-hover:text-emerald-500"} />
            </button>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
            Intelligence oversight for {months.find(m => m.value === month)?.label} {year}.
            {lastUpdated && <span className="ml-2 text-[10px] text-slate-400 opacity-60">Last sync: {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-slate-900/5 p-1 rounded-2xl border border-slate-200">
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest px-3 py-2 outline-none cursor-pointer"
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="h-4 w-[1px] bg-slate-200" />
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest px-3 py-2 outline-none cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           {!loading && (
             <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : (
          cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <Card className="relative glass-card border-none shadow-md h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-300">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`h-6 w-6 rounded-md ${card.color.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600')} flex items-center justify-center shrink-0 shadow-sm`}>
                      <card.icon size={12} />
                    </div>
                    <CardTitle className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{card.title}</CardTitle>
                  </div>
                  <div className="text-base md:text-xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</div>
                  <p className="text-[7px] md:text-[8px] text-slate-400 font-medium mt-1 leading-none tracking-tight truncate">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-3xl bg-white/60 backdrop-blur-xl overflow-hidden border border-white/60">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-1">Financial Trajectory</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">Revenue vs Payout trends for the last 6 months.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Payout</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64 relative px-8">
            {loading || !analytics ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <div className="w-full h-full flex items-end justify-between gap-4">
                {analytics.monthlyTrends.map((month: any, i: number) => {
                  const maxVal = Math.max(...analytics.monthlyTrends.map((m: any) => Math.max(m.revenue, m.payout, 1)));
                  const revHeight = (month.revenue / maxVal) * 100;
                  const payHeight = (month.payout / maxVal) * 100;
                  
                  return (
                    <div key={month.name} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-[80%]">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${revHeight}%` }}
                          transition={{ delay: i * 0.1, duration: 0.8 }}
                          className="w-4 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg shadow-lg shadow-emerald-200/50 relative"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {format(month.revenue)}
                          </div>
                        </motion.div>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${payHeight}%` }}
                          transition={{ delay: (i * 0.1) + 0.2, duration: 0.8 }}
                          className="w-4 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg shadow-lg shadow-blue-200/50 relative"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {format(month.payout)}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{month.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Distribution */}
        <Card className="border-none shadow-2xl rounded-3xl bg-slate-900 text-white overflow-hidden relative group">
           <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={200} />
           </div>
           <CardHeader className="p-8">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white mb-1">Fleet Composition</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400">Distribution by vehicle type.</CardDescription>
           </CardHeader>
           <CardContent className="p-8 pt-0 flex flex-col items-center justify-center">
              {loading || !analytics ? (
                <Skeleton className="h-40 w-40 rounded-full bg-white/10" />
              ) : (
                <div className="relative h-48 w-48 flex items-center justify-center">
                   {/* Simple CSS-based Pie/Circle segments */}
                   <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                      {analytics.vehicleDistribution.map((item: any, i: number) => {
                        const total = analytics.vehicleDistribution.reduce((sum: number, d: any) => sum + d.value, 0) || 1;
                        const prevTotal = analytics.vehicleDistribution.slice(0, i).reduce((sum: number, d: any) => sum + d.value, 0);
                        const startPercent = (prevTotal / total) * 100;
                        const percent = (item.value / total) * 100;
                        
                        return (
                          <motion.circle
                            key={item.name}
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            stroke={item.name === 'CAR' ? '#10b981' : '#3b82f6'}
                            strokeWidth="12"
                            strokeDasharray={`${percent * 2.51} 251.2`}
                            strokeDashoffset={-(startPercent * 2.51)}
                            initial={{ strokeDasharray: "0 251.2" }}
                            animate={{ strokeDasharray: `${percent * 2.51} 251.2` }}
                            transition={{ delay: 0.5 + (i * 0.2), duration: 1 }}
                            className="drop-shadow-xl"
                          />
                        );
                      })}
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Riders</p>
                      <p className="text-3xl font-black italic tracking-tighter">{stats.totalEmployees}</p>
                   </div>
                </div>
              )}
              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                 {analytics?.vehicleDistribution.map((item: any) => (
                   <div key={item.name} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">{item.name}</p>
                      <p className="text-lg font-black tracking-tighter">{item.value}</p>
                   </div>
                 ))}
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/60">
          <CardHeader className="p-8 border-b border-slate-100">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-1">Top Performers</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 italic">Leading revenue contributors for this month.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {loading || !analytics ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-6">
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))
              ) : analytics?.topRiders?.length > 0 ? (
                analytics.topRiders.map((rider: any, i: number) => (
                  <motion.div 
                    key={rider.name} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6 p-6 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div className="h-10 w-10 bg-slate-900 text-white flex items-center justify-center rounded-2xl font-black text-xs uppercase italic group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 tracking-tight">{rider.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Top Contributor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 tabular-nums leading-none mb-1">{format(rider.revenue)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-400 italic text-sm">No performance data for this cycle.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 text-white rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={200} strokeWidth={1} className="text-emerald-500" />
          </div>
          <CardHeader className="relative z-10 p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">System Intelligence</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 p-8 pt-0">
            {loading || !analytics ? (
              <div className="space-y-4">
                 <Skeleton className="h-4 w-full bg-white/10" />
                 <Skeleton className="h-20 w-full rounded-xl bg-white/10" />
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                  Your current payroll distribution shows a <span className="text-emerald-400 font-black italic">Target Achievement Rate of {analytics?.efficiency?.targetAchievementRate || 0}%</span>. 
                  The operational margin is currently <span className="text-white font-bold">{analytics?.efficiency?.operationalMargin || 0}%</span>, which demonstrates high capital efficiency.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group/stat hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover/stat:text-emerald-400 transition-colors">Avg Profit / Rider</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tighter">{format(analytics?.efficiency?.avgProfitPerRider || 0)}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group/stat hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover/stat:text-amber-400 transition-colors">Net Profit</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tighter">{format(analytics?.efficiency?.totalProfit || 0)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Support Section */}
      <div className="glass-card border-none shadow-2xl p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-3xl font-black uppercase italic tracking-tight">Need operational support?</h3>
            <p className="text-slate-400 max-w-xl text-sm md:text-base">
              Our engineering team is standing by to assist with complex data reconciliation, custom report generation, or system configuration.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <ShieldCheck size={14} className="text-emerald-500" /> Enterprise SLA
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <TrendingUp size={14} className="text-blue-500" /> 99.9% Uptime
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-14 px-10 rounded-2xl transition-all shadow-xl shadow-black/20">
            Open Support Ticket <ArrowUpRight className="ml-3" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
