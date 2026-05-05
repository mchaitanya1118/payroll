"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Save, 
  User, 
  Calculator,
  Loader2,
  Download,
  Upload,
  Building,
  CheckCircle2,
  History,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  X,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from '@/hooks/useCurrency';

export default function DataEntryPage() {
  const { format } = useCurrency();
  const [pilotId, setPilotId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [riderInfo, setRiderInfo] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [companies, setCompanies] = useState<string[]>([]);
  const [adjustedSlips, setAdjustedSlips] = useState<any[]>([]);

  // Form State
  const [adjustments, setAdjustments] = useState({
    salesCash: 0,
    carRent: 0,
    akama: 0,
    fine: 0,
    deductions: 0,
    bonus: 0,
    bankDeduction: 0,
    advanceDeduction: 0
  });

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/riders/companies');
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies');
    }
  };

  const fetchAdjustedSlips = useCallback(async () => {
    try {
      const { data } = await api.get(`/payslips/adjustments/list?month=${month}&year=${year}&companyCode=${activeTab}`);
      setAdjustedSlips(data);
    } catch (error) {
      console.error('Failed to fetch adjusted slips:', error);
    }
  }, [month, year, activeTab]);

  useEffect(() => {
    fetchCompanies();
    fetchAdjustedSlips();
  }, [fetchAdjustedSlips]);

  const handleSearch = async (idToSearch?: string) => {
    const id = idToSearch || pilotId;
    if (!id) return;
    
    setSearching(true);
    try {
      const { data } = await api.get(`/payslips/${id}/${month}/${year}`);
      setRiderInfo(data.payslip);
      setEntries(data.entries);
      setAdjustments({
        salesCash: data.payslip.salesCash || 0,
        carRent: data.payslip.carRent || 0,
        akama: data.payslip.akama || 0,
        fine: data.payslip.fine || 0,
        deductions: data.payslip.deductions || 0,
        bonus: data.payslip.bonus || 0,
        bankDeduction: data.payslip.bankDeduction || 0,
        advanceDeduction: data.payslip.advanceDeduction || 0,
      });
      if (idToSearch) setPilotId(id);
      toast.success(`Records loaded for ${data.payslip.rider.riderName}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No payslip record found for this rider in selected month.');
      } else {
        toast.error('Failed to fetch rider data');
      }
      setRiderInfo(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!riderInfo) return;
    setLoading(true);
    try {
      await api.patch(`/payslips/${riderInfo.id}`, adjustments);
      toast.success('Adjustments saved and net salary recalculated');
      fetchAdjustedSlips();
      // Keep rider info to allow further edits but refresh it
      handleSearch(); 
    } catch (error) {
      toast.error('Failed to save adjustments');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setRiderInfo(null);
    setPilotId('');
    setEntries([]);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (riderInfo) handleSave();
      }
      if (e.key === 'Escape') {
        clearSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [riderInfo, adjustments]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/payslips/adjustments/export?month=${month}&year=${year}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Adjustments_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export adjustments');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const { data } = await api.post('/payslips/adjustments/import', formData);
      toast.success(data.message || 'Import successful');
      fetchAdjustedSlips();
    } catch (error) {
      toast.error('Failed to import adjustments');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Real-time Net Total Preview
  const projectedNetTotal = useMemo(() => {
    if (!riderInfo) return 0;
    const base = riderInfo.grossAmount + adjustments.bonus;
    const deds = adjustments.deductions + adjustments.salesCash + adjustments.carRent + adjustments.akama + adjustments.fine + adjustments.bankDeduction + adjustments.advanceDeduction;
    return base - deds;
  }, [riderInfo, adjustments]);

  const stats = [
    { label: 'Base Revenue', value: riderInfo?.grossAmount || 0, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Total Adjustments', value: Object.values(adjustments).reduce((a, b) => a + b, 0) - adjustments.bonus, icon: Calculator, color: 'text-amber-500' },
    { label: 'Projected Net', value: projectedNetTotal, icon: Zap, color: 'text-indigo-500' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header with Glassmorphism */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
            <Calculator className="text-emerald-500 animate-pulse" size={40} />
            Data Entry Hub
          </h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] pl-1 opacity-70">
            Manual Payroll Adjustments & Overrides
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <Button 
               variant="outline" 
               onClick={handleExport}
               className="h-14 px-8 rounded-2xl border-slate-200 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] transition-all shadow-sm"
            >
               <Download className="mr-2" size={16} /> Export
            </Button>
            <div className="relative">
               <input 
                 type="file" 
                 id="import-excel" 
                 className="hidden" 
                 accept=".xlsx,.xls"
                 onChange={handleImport}
               />
               <Button 
                 className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-200"
                 onClick={() => document.getElementById('import-excel')?.click()}
               >
                 <Upload className="mr-2" size={16} />
                 <span className="hidden sm:inline">Bulk Import</span>
                 <span className="ml-2 sm:hidden">Import</span>
               </Button>
            </div>
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 transition-all hover:shadow-emerald-500/5">
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 pl-1">Target Month</Label>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full h-14 rounded-2xl bg-white border-none shadow-sm px-4 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 pl-1">Target Year</Label>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full h-14 rounded-2xl bg-white border-none shadow-sm px-4 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 pl-1">Search Pilot</Label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <Input 
                  placeholder="Enter Pilot ID (e.g. 1545800)" 
                  className="pl-14 h-14 rounded-2xl bg-white border-none shadow-sm font-black text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all placeholder:text-slate-300 italic"
                  value={pilotId}
                  onChange={(e) => setPilotId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  className="absolute right-2 top-2 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest px-6 shadow-lg shadow-slate-200"
                  onClick={() => handleSearch()}
                  disabled={searching}
                >
                  {searching ? <Loader2 className="animate-spin" size={16} /> : 'Lookup'}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {riderInfo ? (
              <motion.div 
                key="rider-details"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                className="mt-12 space-y-10"
              >
                {/* Rider Info Strip */}
                <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl group">
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                      <User size={200} />
                   </div>
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                           <User size={36} className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black tracking-tighter uppercase italic">{riderInfo.rider.riderName}</h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                             <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase tracking-widest">Pilot: {riderInfo.rider.riderId}</span>
                             <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/30 uppercase tracking-widest">{riderInfo.rider.companyCode || 'Independent'}</span>
                             <span className="px-4 py-1.5 bg-slate-700/50 text-slate-300 text-[10px] font-black rounded-full border border-slate-600/50 uppercase tracking-widest">{riderInfo.rider.vehicleType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                         <div className="flex-1 md:flex-none p-5 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[140px] hover:bg-white/10 transition-colors">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</p>
                            <p className={cn(
                              "text-sm font-black italic",
                              riderInfo.status === 'FINAL' ? "text-emerald-400" : "text-amber-400"
                            )}>{riderInfo.status}</p>
                         </div>
                         <Button 
                           variant="ghost" 
                           onClick={clearSearch}
                           className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 transition-all"
                         >
                           <X size={24} />
                         </Button>
                      </div>
                   </div>

                   {/* Quick Stats Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:border-white/10 transition-all">
                           <div className="flex items-center gap-3 mb-2">
                              <stat.icon className={cn("size-4", stat.color)} />
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</span>
                           </div>
                           <p className="text-2xl font-black tabular-nums">{format(stat.value)}</p>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Entry Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                          <Calculator size={16} /> Adjustment Entries
                       </h4>
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          {month}/{year} Billing Cycle
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { label: 'Sales Cash', key: 'salesCash', color: 'emerald' },
                        { label: 'Car Rent', key: 'carRent', color: 'indigo' },
                        { label: 'Akama', key: 'akama', color: 'blue' },
                        { label: 'Fines', key: 'fine', color: 'rose' },
                        { label: 'Deductions', key: 'deductions', color: 'orange' },
                        { label: 'Bonus', key: 'bonus', color: 'emerald' },
                        { label: 'Bank Deduction', key: 'bankDeduction', color: 'slate' },
                        { label: 'Advance Payment', key: 'advanceDeduction', color: 'amber' },
                      ].map((field) => (
                        <div key={field.key} className="group/field relative">
                           <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-focus-within/field:bg-emerald-500 rounded-full transition-all" />
                           <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group-focus-within/field:ring-2 ring-emerald-500/20">
                              <div className="flex justify-between items-center mb-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">{field.label}</Label>
                                {adjustments[field.key as keyof typeof adjustments] > 0 && (
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                )}
                              </div>
                              <Input 
                                type="number" 
                                className="h-10 text-lg font-black bg-transparent border-none focus-visible:ring-0 p-0 tabular-nums"
                                value={adjustments[field.key as keyof typeof adjustments] || ''}
                                onChange={(e) => setAdjustments({ ...adjustments, [field.key]: parseFloat(e.target.value) || 0 })}
                              />
                           </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full h-16 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-200 group mt-4"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save size={18} /> Update Financials & Recalculate <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* Summary Sidebar */}
                  <div className="space-y-6">
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-50 border border-white p-8">
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 italic">Balance Breakdown</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                             <span className="text-[10px] font-black uppercase text-slate-400">Advance Balance</span>
                             <span className="text-sm font-black text-amber-600">
                                {format(riderInfo.rider.advances?.reduce((sum: number, a: any) => sum + a.balance, 0) || 0)}
                             </span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                             <span className="text-[10px] font-black uppercase text-slate-400">Monthly Revenue</span>
                             <span className="text-sm font-black text-slate-900">{format(riderInfo.grossAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200 animate-in zoom-in-95 duration-300">
                             <span className="text-[10px] font-black uppercase opacity-60">Final Net Total</span>
                             <span className="text-xl font-black tabular-nums">{format(projectedNetTotal)}</span>
                          </div>
                       </div>
                       
                       <div className="mt-8 p-6 bg-slate-900/5 rounded-[1.5rem] border border-slate-200/50 italic">
                          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                             Deductions are calculated using the FIFO method for advances. Bonuses are added to the gross amount before final tally.
                          </p>
                       </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-24 text-center space-y-4"
              >
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4 border-4 border-white shadow-inner">
                   <Search size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Ready for entry</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                  Enter a Pilot ID above to load their payroll profile for the selected billing cycle.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* History Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 px-4">
           <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                 <History className="text-emerald-500" size={24} /> Recent Adjustments
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit log for the current filter</p>
           </div>
           
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-white/50 backdrop-blur-md p-1 rounded-2xl h-auto border border-white/60 shadow-sm flex flex-wrap gap-1">
                <TabsTrigger value="ALL" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">ALL ENTITIES</TabsTrigger>
                {companies.map(company => (
                  <TabsTrigger key={company} value={company} className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                    {company}
                  </TabsTrigger>
                ))}
              </TabsList>
           </Tabs>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl overflow-hidden border border-white/60">
           <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-slate-100 hover:bg-slate-50/50">
                    <TableHead className="w-[100px] pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pilot</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rider Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Total</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustedSlips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-slate-400 italic font-medium">
                        No adjusted records found for this selection.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustedSlips.map((slip, i) => (
                      <motion.tr 
                        key={slip.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-all border-slate-50"
                      >
                        <TableCell className="h-20 pl-8">
                          <div className="bg-slate-100 px-3 py-1.5 rounded-xl inline-block font-black text-xs italic text-slate-600 shadow-inner">
                            {slip.rider.riderId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white transition-all">
                                {slip.rider.riderName.charAt(0)}
                             </div>
                             <span className="font-black text-slate-900 tracking-tight">{slip.rider.riderName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[9px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-black uppercase tracking-widest border border-slate-200/50">
                            {slip.rider.companyCode || 'IND'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-black tabular-nums text-slate-900">
                          {format(slip.netTotal)}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSearch(slip.rider.riderId)}
                              className="rounded-xl font-black text-[9px] uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 group/edit"
                           >
                              Edit Data <ArrowRight className="ml-1 group-hover/edit:translate-x-1 transition-transform" size={14} />
                           </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
