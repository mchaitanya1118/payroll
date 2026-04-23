"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Calculator, CheckCircle2, Search, Users, Upload, Trash2, Loader2 } from 'lucide-react';
import { toTitleCase } from '@/lib/format';
import RiderPayslipView from './RiderPayslipView';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function PayrollPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());
      if (search) params.append('search', search);

      const [dashboardRes, slipsRes] = await Promise.all([
        api.get(`/payslips/dashboard?${params.toString()}`),
        api.get(`/payslips?${params.toString()}`)
      ]);
      setDashboardData({
        ...dashboardRes.data,
        slips: slipsRes.data
      });
    } catch (error) {
      toast.error('Failed to load payroll dashboard');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      await api.post('/payslips/generate-all', { month, year });
      toast.success('Successfully generated/synced slips for all riders');
      fetchDashboard(false);
    } catch (error) {
      toast.error('Failed to generate batch slips');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', month.toString());
      formData.append('year', year.toString());

      await api.post('/upload/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Excel processed successfully! Payroll data updated.');
      fetchDashboard(false);
    } catch (error) {
      toast.error('Failed to process Excel file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetData = async () => {
    if (!confirm('WARNING: This will permanently delete ALL payroll entries and slips for this tenant. Proceed?')) return;
    
    try {
      await api.post('/upload/reset');
      toast.success('All payroll data has been reset.');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to reset data');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchDashboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [month, year, search]);

  if (selectedRiderId) {
    return (
      <RiderPayslipView 
        riderId={selectedRiderId} 
        month={month} 
        year={year} 
        onBack={() => {
          setSelectedRiderId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Rider Payroll</h2>
          <p className="text-sm text-slate-500">Auto-calculated payslips based on Excel uploads</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx" 
                onChange={handleFileUpload} 
            />
            <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 lg:flex-none border-2 border-slate-900 text-slate-900 font-black text-[10px] tracking-widest uppercase h-10 px-6 rounded-xl transition-all active:scale-95"
            >
                {uploading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Upload className="mr-2" size={14} />}
                {uploading ? 'PROCESSING...' : 'UPLOAD MASTER'}
            </Button>
            <Button 
                onClick={handleGenerateAll} 
                disabled={generating || uploading}
                className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest uppercase h-10 px-6 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
                {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <Calculator className="mr-2" size={14} />}
                {generating ? 'GENERATING...' : 'SYNC ALL'}
            </Button>
            <Button 
                variant="outline"
                onClick={() => {
                  const url = `/api/reports/payroll/export?month=${month}&year=${year}`;
                  const token = localStorage.getItem('token');
                  fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  .then(res => res.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payroll_${month}_${year}.csv`;
                    a.click();
                  });
                }}
                className="flex-1 lg:flex-none border-2 border-slate-900 text-slate-900 font-black text-[10px] tracking-widest uppercase h-10 px-6 rounded-xl transition-all active:scale-95"
            >
                <FileText className="mr-2" size={14} /> EXPORT SHEET
            </Button>
            <Button 
                variant="ghost"
                onClick={handleResetData}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 font-black tracking-widest uppercase h-10 px-4 rounded-xl transition-all ml-auto lg:ml-0"
                title="Reset All Data"
            >
                <Trash2 size={16} />
            </Button>
        </div>
      </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
            {[
              { label: 'Total Payout', icon: Calculator, color: 'bg-emerald-500', value: formatCurrency(dashboardData?.summary?.totalPayout || 0) },
              { label: 'Active Riders', icon: Users, color: 'bg-blue-500', value: dashboardData?.summary?.totalRiders || 0 },
              { label: 'Slips Finalized', icon: CheckCircle2, color: 'bg-amber-500', value: dashboardData?.summary?.completed || 0 },
              { label: 'Avg Payout', icon: FileText, color: 'bg-purple-500', value: formatCurrency((dashboardData?.summary?.totalPayout || 0) / (dashboardData?.summary?.totalRiders || 1)) },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm transition-all hover:scale-[1.02]">
                <div className={`p-2.5 ${stat.color}/10 rounded-xl`}>
                    <stat.icon className={`text-${stat.color.split('-')[1]}-600`} size={20} />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] leading-none mb-1">{stat.label}</span>
                    <span className="text-xl font-black text-slate-900 leading-none truncate">
                        {loading ? <Skeleton className="h-5 w-20 mt-1" /> : stat.value}
                    </span>
                </div>
              </div>
            ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-end glass-card p-6 rounded-2xl mb-8 premium-shadow">
            <div className="flex-1 space-y-2 w-full">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Search Rider</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input 
                        placeholder="Search name or ID..." 
                        className="pl-9 input-premium h-11 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">Month</Label>
                  <Select value={month.toString()} onValueChange={(v) => v && setMonth(+v)}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 font-bold rounded-xl md:w-36">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="font-medium">{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">Year</Label>
                  <Select value={year.toString()} onValueChange={(v) => v && setYear(+v)}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 font-bold rounded-xl md:w-28">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()} className="font-medium">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
        </div>

      <div className="glass-card rounded-2xl overflow-hidden premium-shadow border border-white/60">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-900/5 hover:bg-slate-900/5 border-b border-slate-200/60 h-14">
                <TableHead className="w-32 font-black text-slate-900 text-center tracking-widest text-[10px] uppercase">RIDER ID</TableHead>
                <TableHead className="font-black text-slate-900 tracking-widest text-[10px] uppercase">PILOT NAME</TableHead>
                <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase">GROSS AMOUNT</TableHead>
                <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase">NET PAYOUT</TableHead>
                <TableHead className="text-right font-black text-slate-900 tracking-widest text-[10px] uppercase px-8">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="h-16 border-b border-slate-100/60">
                    <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right px-8"><Skeleton className="h-9 w-28 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : dashboardData?.slips?.map((slip: any) => (
                <TableRow key={slip.id} className="group hover:bg-emerald-50/40 transition-all duration-300 h-16 border-b border-slate-100/60">
                  <TableCell className="font-black text-slate-400 text-center tabular-nums">{slip.rider.riderId}</TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 tabular-nums tracking-tight mb-1">{toTitleCase(slip.rider.riderName)}</div>
                    <Badge variant="outline" className="text-[9px] text-slate-400 uppercase font-black tracking-widest px-1.5 h-4 border-slate-200 bg-white">
                      {slip.rider.vehicleType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-500 tabular-nums">
                    {formatCurrency(slip.grossAmount)}
                  </TableCell>
                  <TableCell className="text-right font-black text-emerald-600 tabular-nums text-lg">
                    {formatCurrency(slip.netTotal)}
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <Button 
                      onClick={() => setSelectedRiderId(slip.rider.id)}
                      className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black text-[10px] tracking-widest uppercase h-9 px-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      <FileText size={14} className="mr-2" /> VIEW SLIP
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!loading && (!dashboardData?.slips || dashboardData.slips.length === 0)) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic font-medium">
                    {search ? `No results found for "${search}"` : "No payroll data found for this month."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
