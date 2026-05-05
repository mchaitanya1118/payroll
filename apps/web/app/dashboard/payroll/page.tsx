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
import { FileText, Calculator, CheckCircle2, Search, Users, Upload, Trash2, Loader2, Mail, ShieldCheck, TrendingUp, Download, Building } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toTitleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import RiderPayslipView from './RiderPayslipView';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';

export default function PayrollPage() {
  const { format } = useCurrency();
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
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
      if (companyFilter !== 'ALL') params.append('companyCode', companyFilter);

      const [dashboardRes, slipsRes] = await Promise.all([
        api.get(`/payslips/dashboard?${params.toString()}`),
        api.get(`/payslips?${params.toString()}`)
      ]);
      setDashboardData({
        ...dashboardRes.data,
        slips: slipsRes.data
      });
    } catch (error) {
      console.error('Failed to load payroll dashboard', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/riders/companies');
      setAvailableCompanies(res.data);
    } catch (error) {
      console.error('Failed to load companies');
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
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to process Excel file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetData = async () => {
    const monthName = months.find(m => m.value === month)?.label;
    if (!confirm(`WARNING: This will permanently delete payroll entries and slips for ${monthName} ${year}. Historical data will be preserved. Proceed?`)) return;
    
    try {
      await api.post('/upload/reset', { month, year });
      toast.success(`Payroll records for ${monthName} ${year} have been cleared.`);
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to reset data');
    }
  };

  const [sendingEmails, setSendingEmails] = useState(false);
  const handleSendAllEmails = async () => {
    if (!confirm('Send payslips to ALL riders with registered email addresses?')) return;
    try {
      setSendingEmails(true);
      const res = await api.post('/payslips/send-all-emails', { month, year });
      toast.success(`Successfully sent ${res.data.sent} emails! ${res.data.failed} failed.`);
      if (res.data.errors.length > 0) {
        console.error('Email errors:', res.data.errors);
      }
    } catch (error) {
      toast.error('Failed to initiate bulk email process');
    } finally {
      setSendingEmails(false);
    }
  };

  const handleSendSingleEmail = async (slipId: string) => {
    try {
      await api.post(`/payslips/${slipId}/send-email`);
      toast.success('Email sent successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send email';
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchDashboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [month, year, search, companyFilter]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <Calculator className="text-emerald-500 shrink-0" size={32} />
            Payroll Engine
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Execute payouts and synchronize rider performance data.</p>
        </div>

        <div className="flex flex-row gap-2 md:gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
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
                className="flex-1 md:flex-none border-2 border-slate-900 text-slate-900 font-black text-[10px] tracking-widest uppercase h-10 md:h-12 px-6 rounded-2xl transition-all active:scale-95"
            >
                {uploading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Upload className="mr-2" size={14} />}
                <span className="hidden sm:inline">{uploading ? 'INGESTING...' : 'IMPORT SOURCE'}</span>
                <span className="sm:hidden">IMPORT</span>
            </Button>
            <Button 
                onClick={handleGenerateAll} 
                disabled={generating || uploading}
                className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] tracking-widest uppercase h-10 md:h-12 px-6 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95"
            >
                {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <Calculator className="mr-2" size={14} />}
                <span className="hidden sm:inline">{generating ? 'SYNCING...' : 'SYNC ALL'}</span>
                <span className="sm:hidden">SYNC</span>
            </Button>
            {user?.role === 'ADMIN' && (
              <Button 
                  variant="ghost"
                  onClick={handleResetData}
                  className="h-10 md:h-12 w-10 md:w-12 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all"
                  title="Wipe Period Data"
              >
                  <Trash2 size={18} />
              </Button>
            )}
        </div>
      </div>

      {/* Company Tabs */}
      <div className="w-full">
        <Tabs defaultValue="ALL" value={companyFilter} onValueChange={setCompanyFilter} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-sm overflow-x-auto scrollbar-hide max-w-full justify-start h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger 
                value="ALL" 
                className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg"
              >
                All Entities
              </TabsTrigger>
              {availableCompanies.map(company => (
                <TabsTrigger 
                  key={company} 
                  value={company}
                  className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-lg"
                >
                  {company}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Total Payout', icon: Calculator, color: 'emerald', value: format(dashboardData?.summary?.totalPayout || 0) },
              { label: 'Active Pilots', icon: Users, color: 'blue', value: dashboardData?.summary?.totalRiders || 0 },
              { label: 'Slips Finalized', icon: CheckCircle2, color: 'amber', value: dashboardData?.summary?.completed || 0 },
              { label: 'Average Yield', icon: TrendingUp, color: 'purple', value: format((dashboardData?.summary?.totalPayout || 0) / (dashboardData?.summary?.totalRiders || 1)) },
            ].map((stat, i) => (
              <div key={i} className="group relative">
                <div className={cn(
                  "absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500",
                  stat.color === 'emerald' && "from-emerald-500 to-teal-600",
                  stat.color === 'blue' && "from-blue-500 to-indigo-600",
                  stat.color === 'amber' && "from-amber-500 to-orange-600",
                  stat.color === 'purple' && "from-purple-500 to-fuchsia-600"
                )}></div>
                <div className="relative flex items-center gap-4 bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110",
                    stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-600",
                    stat.color === 'blue' && "bg-blue-500/10 text-blue-600",
                    stat.color === 'amber' && "bg-amber-500/10 text-amber-600",
                    stat.color === 'purple' && "bg-purple-500/10 text-purple-600"
                  )}>
                    <stat.icon size={24} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">{stat.label}</span>
                    <span className="text-xl font-black text-slate-900 leading-none tabular-nums truncate">
                        {loading ? <Skeleton className="h-5 w-20 mt-1" /> : stat.value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-end bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/60 premium-shadow">
            <div className="w-full md:flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Search Identifier</Label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                        placeholder="Name, Pilot ID or Akama..." 
                        className="pl-12 h-12 bg-white border-slate-200 rounded-2xl font-bold shadow-sm focus:border-emerald-500/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex flex-row gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-36 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Period</Label>
                  <Select value={month.toString()} onValueChange={(v) => v && setMonth(+v)}>
                  <SelectTrigger className="h-12 bg-white border-slate-200 font-bold rounded-2xl shadow-sm">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="font-bold">{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>

              <div className="flex-1 md:w-28 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Year</Label>
                  <Select value={year.toString()} onValueChange={(v) => v && setYear(+v)}>
                  <SelectTrigger className="h-12 bg-white border-slate-200 font-bold rounded-2xl shadow-sm">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
        </div>

      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/40 backdrop-blur-xl">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="w-full">
            <TableHeader className="hidden md:table-header-group">
              <TableRow className="bg-slate-900/5 hover:bg-slate-900/5 border-b border-white/40 h-16">
                <TableHead className="w-32 font-black text-slate-900 text-center tracking-widest text-[10px] uppercase">RIDER ID</TableHead>
                <TableHead className="font-black text-slate-900 tracking-widest text-[10px] uppercase">PILOT NAME</TableHead>
                <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase">GROSS</TableHead>
                <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase">PAYOUT</TableHead>
                <TableHead className="text-right font-black text-slate-900 tracking-widest text-[10px] uppercase px-8">PROTOCOL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="h-16 border-b border-slate-100/60">
                    <TableCell className="hidden md:table-cell text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right px-4 md:px-8"><Skeleton className="h-9 w-28 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : dashboardData?.slips?.map((slip: any) => (
                <TableRow key={slip.id} className="flex flex-col md:table-row group hover:bg-emerald-50/40 transition-all duration-300 py-4 md:py-0 md:h-16 border-b border-slate-100/60">
                  <TableCell className="md:table-cell font-black text-slate-400 md:text-center tabular-nums pb-2 md:pb-0">
                    <div className="flex justify-between items-center w-full md:block">
                      <div>
                        <span className="md:hidden text-[9px] uppercase tracking-widest text-slate-300 mr-2">ID:</span>
                        {slip.rider.riderId}
                      </div>
                      <div className="flex md:hidden gap-2">
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendSingleEmail(slip.id)}
                            className={`h-8 w-8 p-0 rounded-xl transition-all ${!slip.rider.email ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 border border-slate-100'}`}
                            disabled={!slip.rider.email}
                        >
                            <Mail size={14} />
                        </Button>
                        <Button 
                            onClick={() => setSelectedRiderId(slip.rider.id)}
                            className="bg-slate-900 text-white font-black text-[8px] tracking-widest uppercase h-8 px-3 rounded-xl shadow-sm"
                        >
                            VIEW SLIP
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="pb-3 md:pb-0">
                    <div className={`font-bold tabular-nums tracking-tight mb-1 ${slip.targetAchieved ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {toTitleCase(slip.rider?.riderName || 'Unknown Rider')}
                      {slip.targetAchieved && <span className="ml-2 text-emerald-500">✓</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] text-slate-400 uppercase font-black tracking-widest px-1.5 h-4 border-slate-200 bg-white">
                        {slip.rider?.companyCode ? slip.rider.companyCode : (slip.rider?.vehicleType || 'Unknown')}
                      </Badge>
                      {slip.rider?.companyCode && (
                        <Badge variant="outline" className="text-[9px] text-slate-300 uppercase font-black tracking-widest px-1.5 h-4 border-slate-100 bg-white ml-1">
                          {slip.rider?.vehicleType}
                        </Badge>
                      )}
                      {(slip.targetOrders > 0) && (
                        <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest px-1.5 h-4 ${slip.targetAchieved ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400'}`}>
                          {slip.totalSingleOrders || 0} / {slip.targetOrders}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-between md:table-cell text-right font-bold text-slate-500 tabular-nums py-2 md:py-0 border-t border-slate-50 md:border-none mt-2 md:mt-0">
                    <span className="md:hidden text-[9px] uppercase tracking-widest text-slate-300">Gross</span>
                    {format(slip.grossAmount)}
                  </TableCell>
                  <TableCell className="flex justify-between md:table-cell text-right font-black text-emerald-600 tabular-nums text-lg py-2 md:py-0">
                    <span className="md:hidden text-[9px] uppercase tracking-widest text-slate-300">Payout</span>
                    {format(slip.netTotal)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right pt-4 md:pt-0 md:px-8">
                    <div className="flex justify-end gap-2 w-full">
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendSingleEmail(slip.id)}
                            className={`h-10 w-10 md:h-9 md:w-9 p-0 rounded-xl transition-all hover:scale-105 active:scale-95 ${!slip.rider.email ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                            title={slip.rider.email ? `Email to ${slip.rider.email}` : 'No email registered'}
                            disabled={!slip.rider.email}
                        >
                            <Mail size={16} />
                        </Button>
                        <Button 
                        onClick={() => setSelectedRiderId(slip.rider.id)}
                        className="flex-1 md:flex-none bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black text-[10px] tracking-widest uppercase h-10 md:h-9 px-6 md:px-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                        VIEW FULL SLIP
                        </Button>
                    </div>
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

      <div className="glass-card border-none shadow-xl p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Bulk Execution Protocol</h3>
            <p className="text-slate-400 max-w-xl">
              Initiate mass synchronization and distribution of payslips across the entire fleet. Ensure all Excel source data is imported before execution.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={14} className="text-emerald-500" /> Secure Sync
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Mail size={14} className="text-blue-500" /> Auto Email
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <Button 
                onClick={handleSendAllEmails} 
                disabled={sendingEmails || !dashboardData?.slips?.length}
                className="bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl transition-all"
             >
                {sendingEmails ? <Loader2 className="animate-spin mr-2" size={16} /> : <Mail className="mr-2" size={16} />}
                Send All Emails
             </Button>
             <Button 
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.append('month', month.toString());
                  params.append('year', year.toString());
                  if (companyFilter !== 'ALL') params.append('companyCode', companyFilter);
                  const url = `/api/reports/payroll/export?${params.toString()}`;
                  const token = localStorage.getItem('token');
                  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                  .then(res => res.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payroll_${month}_${year}.csv`;
                    a.click();
                  });
                }}
                className="border-white/20 text-white hover:bg-white/10 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl transition-all"
             >
                <Download className="mr-2" size={16} /> Export Sheet
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
