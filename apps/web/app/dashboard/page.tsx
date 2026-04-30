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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
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
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { 
      title: 'Total Workforce', 
      value: stats.totalEmployees, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Active employees across all roles'
    },
    { 
      title: 'Current Payroll', 
      value: format(stats.totalPayoutLastMonth), 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      description: 'Total payout for this month'
    },
    { 
      title: 'Slips Generated', 
      value: stats.activeSlips, 
      icon: FileCheck, 
      color: 'bg-amber-500',
      description: 'Completed slips for review'
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <TrendingUp className="text-emerald-500 shrink-0" size={32} />
            Commander Center
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Real-time intelligence and workforce performance oversight.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-6 pr-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Status</p>
                <p className="text-xs font-bold text-emerald-600 uppercase italic">All Systems Operational</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))
        ) : (
          cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                index === 0 ? 'from-blue-500 to-indigo-600' :
                index === 1 ? 'from-emerald-500 to-teal-600' :
                index === 2 ? 'from-amber-500 to-orange-600' :
                'from-indigo-500 to-purple-600'
              } rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500`}></div>
              <Card className="relative glass-card border-none shadow-xl h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:-translate-y-2">
                <CardHeader className="p-4 md:p-5 pb-2">
                  <div className={`h-10 w-10 rounded-xl ${card.color.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600')} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                    <card.icon size={20} />
                  </div>
                  <CardTitle className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-5 pt-0">
                  <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{card.value}</div>
                  <p className="text-[9px] md:text-[10px] text-slate-500 font-medium mt-1 leading-tight line-clamp-1">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Track changes and updates to payroll</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full flex-shrink-0">
                      <FileCheck size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{new Date(activity.timestamp).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400 flex-shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 italic text-sm">No recent activity found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 text-white rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={200} strokeWidth={1} className="text-emerald-500" />
          </div>
          <CardHeader className="relative z-10 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">System Intelligence</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 p-6 md:p-8 pt-0">
            {loading ? (
              <div className="space-y-4">
                 <Skeleton className="h-4 w-full bg-white/10" />
                 <Skeleton className="h-20 w-full rounded-xl bg-white/10" />
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                  Your current payroll distribution shows a growth of <span className="text-emerald-400 font-black italic">+{stats.insights.efficiencyGrowth}%</span>. The majority of operations are <span className="text-white font-bold">{stats.insights.dominantStructure}</span>, which currently maximizes your net profit margins.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group/stat hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover/stat:text-emerald-400 transition-colors">Average Earnings</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tighter">{format(stats.insights.avgSalary)}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group/stat hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 group-hover/stat:text-amber-400 transition-colors">Top Performer</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tighter">{format(stats.insights.topEarner)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="glass-card border-none shadow-xl p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Need operational support?</h3>
            <p className="text-slate-400 max-w-xl">
              Our engineering team is standing by to assist with complex data reconciliation, custom report generation, or system configuration.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={14} className="text-emerald-500" /> Enterprise SLA
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <TrendingUp size={14} className="text-blue-500" /> 99.9% Uptime
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl transition-all">
            Open Support Ticket <ArrowUpRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
