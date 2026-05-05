"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Table as TableIcon, 
  Users, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  BarChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const { format } = useCurrency();

  const fetchReportData = useCallback(async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());
      if (companyFilter !== 'ALL') params.append('companyCode', companyFilter);

      const response = await api.get(`/reports/riders/data?${params.toString()}`);
      setReportData(response.data.data);
      setTotals(response.data.totals);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch riders report data");
    } finally {
      setReportLoading(false);
    }
  }, [month, year, companyFilter]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/riders/companies');
      setAvailableCompanies(res.data);
    } catch (error) {
      console.error('Failed to load companies');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = [2024, 2025, 2026];

  const handleDownload = async (type: 'payroll' | 'riders' | 'rates' | 'performance') => {
    setLoading(type);
    try {
      let url = '';
      let filename = '';

      if (type === 'payroll') {
        url = `/reports/payroll/export?month=${month}&year=${year}`;
        if (companyFilter !== 'ALL') url += `&companyCode=${companyFilter}`;
        filename = `payroll_report_${month}_${year}.xlsx`;
      } else if (type === 'riders') {
        url = `/reports/riders/export`;
        if (companyFilter !== 'ALL') url += `?companyCode=${companyFilter}`;
        filename = `riders_directory.xlsx`;
      } else if (type === 'rates') {
        url = `/rates/export`;
        filename = `rate_configurations.xlsx`;
      } else if (type === 'performance') {
        url = `/reports/performance/export?month=${month}&year=${year}`;
        if (companyFilter !== 'ALL') url += `&companyCode=${companyFilter}`;
        filename = `riders_performance_${month}_${year}.xlsx`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success(`${type.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to download ${type} report`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <TrendingUp className="text-emerald-500 shrink-0" size={32} />
            Analytics & Reports
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Generate and export system data for auditing and analysis.</p>
        </div>

        <div className="flex flex-row gap-2 md:gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Month</Label>
            <Select value={month.toString()} onValueChange={(v) => v && setMonth(parseInt(v))}>
              <SelectTrigger className="h-9 bg-white border-slate-200 font-bold rounded-xl w-24 md:w-32 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="font-bold">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Year</Label>
            <Select value={year.toString()} onValueChange={(v) => v && setYear(parseInt(v))}>
              <SelectTrigger className="h-9 bg-white border-slate-200 font-bold rounded-xl w-20 md:w-28 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                {years.map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dynamic Company Tabs */}
      <Tabs value={companyFilter} onValueChange={setCompanyFilter} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 overflow-x-auto flex-nowrap justify-start h-auto">
          <TabsTrigger 
            value="ALL" 
            className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300"
          >
            All Entities
          </TabsTrigger>
          {availableCompanies.map(company => (
            <TabsTrigger 
              key={company} 
              value={company}
              className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300"
            >
              {company}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Monthly Payroll Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Card className="relative glass-card border-none shadow-xl h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:-translate-y-2">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <CardHeader className="relative z-10 p-4 md:p-5 pb-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-500">
                <Zap className="text-white" size={20} />
              </div>
              <CardTitle className="text-base md:text-lg font-black uppercase italic tracking-tight text-slate-900 mb-1">Monthly Payroll</CardTitle>
              <CardDescription className="text-[10px] md:text-xs text-slate-500 font-medium leading-tight line-clamp-2">Full payout breakdown with target achievements and bonus calculations.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-4 md:p-5 pt-3">
              <Button 
                onClick={() => handleDownload('payroll')} 
                disabled={loading === 'payroll'}
                className="w-full bg-slate-900 hover:bg-black text-white h-10 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all active:scale-95 shadow-lg group"
              >
                <Download className="mr-1.5 group-hover:translate-y-0.5 transition-transform" size={14} />
                {loading === 'payroll' ? '...' : 'GET PAYROLL CSV'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Riders Directory Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Card className="relative glass-card border-none shadow-xl h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:-translate-y-2">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            <CardHeader className="relative z-10 p-4 md:p-5 pb-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                <Users className="text-white" size={20} />
              </div>
              <CardTitle className="text-base md:text-lg font-black uppercase italic tracking-tight text-slate-900 mb-1">Riders Directory</CardTitle>
              <CardDescription className="text-[10px] md:text-xs text-slate-500 font-medium leading-tight line-clamp-2">Complete pilot database with vehicle specs and registration status.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-4 md:p-5 pt-3">
              <Button 
                onClick={() => handleDownload('riders')} 
                disabled={loading === 'riders'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all active:scale-95 shadow-lg group"
              >
                <Download className="mr-1.5 group-hover:translate-y-0.5 transition-transform" size={14} />
                {loading === 'riders' ? '...' : 'GET RIDERS LIST'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Rate Standards Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Card className="relative glass-card border-none shadow-xl h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:-translate-y-2">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
            <CardHeader className="relative z-10 p-4 md:p-5 pb-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="text-white" size={20} />
              </div>
              <CardTitle className="text-base md:text-lg font-black uppercase italic tracking-tight text-slate-900 mb-1">Rate Standards</CardTitle>
              <CardDescription className="text-[10px] md:text-xs text-slate-500 font-medium leading-tight line-clamp-2">Current revenue configurations and payout rules for auditing.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-4 md:p-5 pt-3">
              <Button 
                onClick={() => handleDownload('rates')} 
                disabled={loading === 'rates'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all active:scale-95 shadow-lg group"
              >
                <Download className="mr-1.5 group-hover:translate-y-0.5 transition-transform" size={14} />
                {loading === 'rates' ? '...' : 'GET RATES EXCEL'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Report Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Card className="relative glass-card border-none shadow-xl h-full overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl transition-all duration-500 group-hover:-translate-y-2">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
            <CardHeader className="relative z-10 p-4 md:p-5 pb-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform duration-500">
                <BarChart className="text-white" size={20} />
              </div>
              <CardTitle className="text-base md:text-lg font-black uppercase italic tracking-tight text-slate-900 mb-1">Performance</CardTitle>
              <CardDescription className="text-[10px] md:text-xs text-slate-500 font-medium leading-tight line-clamp-2">Deep dive into rider productivity and revenue generation trends.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-4 md:p-5 pt-3">
              <Button 
                onClick={() => handleDownload('performance')} 
                disabled={loading === 'performance'}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10 rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all active:scale-95 shadow-lg group"
              >
                <Download className="mr-1.5 group-hover:translate-y-0.5 transition-transform" size={14} />
                {loading === 'performance' ? '...' : 'GET PERFORMANCE CSV'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Riders Performance Report Table */}
      <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <BarChart className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight leading-tight">Riders Performance Report</h3>
              <p className="text-[10px] md:text-xs font-medium text-slate-500">Period: {months.find(m => m.value === month)?.label} {year}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchReportData} 
            disabled={reportLoading}
            className="h-9 w-full sm:w-auto rounded-lg font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            {reportLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl">
          <div className="overflow-x-auto scrollbar-hide">
            <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-4 md:px-6">Rider ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-center">Single</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-center">Double</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right pr-4 md:pr-6">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="py-5 px-6"><div className="h-4 w-full bg-slate-100 animate-pulse rounded-lg"></div></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32 text-slate-400 font-bold italic">
                    <div className="flex flex-col items-center gap-4">
                      <TableIcon size={48} className="opacity-10" />
                      No performance data available for this period.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {reportData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/80 transition-colors group">
                      <TableCell className="font-bold text-slate-500 px-6">{row.riderId}</TableCell>
                      <TableCell className="font-black text-slate-900 uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors">{row.riderName}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700">{row.singleRides}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700">{row.doubleRides}</TableCell>
                      <TableCell className="text-right font-black text-slate-900">{format(row.paidAmount)}</TableCell>
                      <TableCell className="text-right font-black italic pr-4 md:pr-6 group-hover:translate-x-[-4px] transition-transform">
                        <span className={cn(
                          row.profit >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {row.profit > 0 && '+'}
                          {format(row.profit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                    <TableRow className="bg-slate-900 text-white hover:bg-slate-800 transition-all border-none">
                      <TableCell colSpan={2} className="font-black uppercase italic tracking-widest py-4 md:py-8 px-4 md:px-6 text-[10px] md:text-sm">Totals</TableCell>
                      <TableCell className="text-center font-black text-sm md:text-xl">{totals?.singleRides}</TableCell>
                      <TableCell className="text-center font-black text-sm md:text-xl">{totals?.doubleRides}</TableCell>
                      <TableCell className="text-right font-black text-sm md:text-xl">{format(totals?.paidAmount || 0)}</TableCell>
                      <TableCell className="text-right font-black text-sm md:text-xl italic pr-4 md:pr-6">
                        <span className={cn(
                          (totals?.profit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {(totals?.profit || 0) > 0 && '+'}
                          {format(totals?.profit || 0)}
                        </span>
                      </TableCell>
                    </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      </div>

      <div className="glass-card border-none shadow-xl p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Need custom reporting?</h3>
            <p className="text-slate-400 max-w-xl">
              Our engineering team can build bespoke analytics dashboards and automated report delivery schedules tailored to your business needs.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={14} className="text-emerald-500" /> Secure Data
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Zap size={14} className="text-amber-500" /> Real-time
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl transition-all">
            Contact Support <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
