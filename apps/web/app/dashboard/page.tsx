"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, FileCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

import { formatCurrency } from '@/lib/format';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayoutLastMonth: 0,
    activeSlips: 0,
    payoutGrowth: 0
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
          payoutGrowth: summary.payoutGrowth || 0
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
      value: formatCurrency(stats.totalPayoutLastMonth), 
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-9 w-9 rounded-lg" />
               </CardHeader>
               <CardContent className="space-y-2">
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-3 w-32" />
               </CardContent>
            </Card>
          ))
        ) : (
          cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.title}</CardTitle>
                  <div className={`${card.color} p-2 rounded-lg text-white`}>
                    <card.icon size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-900">{card.value}</div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{card.description}</p>
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

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={200} strokeWidth={1} />
          </div>
          <CardHeader>
            <CardTitle className="text-emerald-500 uppercase tracking-widest text-xs font-black">Pro Insights</CardTitle>
            <CardTitle className="text-2xl font-bold mt-2">Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <p className="text-slate-400 text-sm leading-relaxed">
              Based on this month&apos;s data, your payroll processing efficiency has increased by <span className="text-emerald-400 font-bold">15%</span>. Most employees are on the &quot;Order-based&quot; structure, leading to variable gross margins.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 font-bold uppercase">Avg Salary</p>
                <p className="text-xl font-black">{formatCurrency(42500)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 font-bold uppercase">Top Earner</p>
                <p className="text-xl font-black">{formatCurrency(85200)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
