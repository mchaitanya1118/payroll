"use client";

import { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataEntryPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [riderId, setRiderId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('ALL');
  const [companies, setCompanies] = useState<string[]>([]);
  
  const [payslip, setPayslip] = useState<any>(null);
  const [riderInfo, setRiderInfo] = useState<any>(null);
  const [adjustedSlips, setAdjustedSlips] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    salesCash: 0,
    carRent: 0,
    akama: 0,
    fine: 0,
    deductions: 0,
    bonus: 0,
    bankDeduction: 0,
    advanceDeduction: 0
  });

  useEffect(() => {
    fetchCompanies();
    fetchAdjustedSlips();
  }, [month, year, activeTab]);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/riders/companies');
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies');
    }
  };

  const fetchAdjustedSlips = async () => {
    try {
      const { data } = await api.get(`/payslips/adjustments/list?month=${month}&year=${year}&companyCode=${activeTab}`);
      setAdjustedSlips(data);
    } catch (error) {
      console.error('Failed to fetch adjusted slips:', error);
    }
  };

  const handleSearch = async (targetId?: string) => {
    const idToSearch = targetId || riderId;
    if (!idToSearch) return toast.error('Please enter a Rider ID');
    
    setFetching(true);
    try {
      const { data } = await api.get(`/payslips/${idToSearch}/${month}/${year}`);
      setPayslip(data.payslip);
      setRiderInfo(data.payslip.rider);
      setFormData({
        salesCash: data.payslip.salesCash || 0,
        carRent: data.payslip.carRent || 0,
        akama: data.payslip.akama || 0,
        fine: data.payslip.fine || 0,
        deductions: data.payslip.deductions || 0,
        bonus: data.payslip.bonus || 0,
        bankDeduction: data.payslip.bankDeduction || 0,
        advanceDeduction: data.payslip.advanceDeduction || 0
      });
      if (!targetId) toast.success('Rider record found');
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No payslip record found for this rider in selected month.');
      } else {
        toast.error('Failed to fetch rider data');
      }
      setPayslip(null);
      setRiderInfo(null);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!payslip) return;

    setLoading(true);
    try {
      await api.patch(`/payslips/${payslip.id}`, formData);
      toast.success('Data saved successfully');
      fetchAdjustedSlips();
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/payslips/adjustments/export?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Adjustments_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export successful');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/payslips/adjustments/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(data.message);
      fetchAdjustedSlips();
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateField = (field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <Calculator className="text-emerald-500" size={32} />
            Data Entry Hub
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Enter manual adjustments for specific pilot IDs.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <Button 
              onClick={handleExport} 
              disabled={exporting}
              variant="outline" 
              className="flex-1 md:flex-none border-2 border-slate-900 text-slate-900 rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-12"
           >
              {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              <span className="ml-2 hidden sm:inline">Export Adjustments</span>
              <span className="ml-2 sm:hidden">Export</span>
           </Button>
           <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".xlsx,.xls" />
           <Button 
              onClick={handleImportClick} 
              disabled={importing}
              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-12"
           >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span className="ml-2 hidden sm:inline">Import Adjustments</span>
              <span className="ml-2 sm:hidden">Import</span>
           </Button>
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Target Month</Label>
              <Select value={month.toString()} onValueChange={(v) => v && setMonth(parseInt(v))}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()} className="font-bold">
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Target Year</Label>
              <Select value={year.toString()} onValueChange={(v) => v && setYear(parseInt(v))}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Pilot Identity (Rider ID)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search by ID (e.g. 1545800)" 
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    className="h-12 pl-12 rounded-xl border-slate-200 font-bold focus:border-emerald-500/50 transition-all shadow-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={() => handleSearch()}
                  disabled={fetching}
                  className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase italic tracking-tighter transition-all active:scale-95"
                >
                  {fetching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {payslip && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Rider Info Strip */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between p-6 bg-emerald-500 rounded-[2rem] text-white shadow-2xl shadow-emerald-500/30 gap-6">
             <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="h-16 px-4 min-w-[5rem] rounded-2xl bg-white/20 flex items-center justify-center font-black italic text-2xl border border-white/20 shadow-inner">
                  {riderInfo?.riderId}
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-black uppercase italic tracking-tight text-xl md:text-2xl leading-tight truncate max-w-[20rem] md:max-w-md lg:max-w-xl mb-1" title={riderInfo?.riderName}>
                     {riderInfo?.riderName}
                   </h3>
                   <div className="flex items-center gap-3">
                      <p className="text-[10px] uppercase font-black tracking-[0.2em] px-2 py-0.5 bg-white/20 rounded-md opacity-90">{riderInfo?.companyCode || 'Independent'}</p>
                      <span className="w-1 h-1 rounded-full bg-white/40"></span>
                      <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80">{riderInfo?.vehicleType}</p>
                   </div>
                </div>
             </div>
             <div className="text-left md:text-right w-full md:w-auto bg-black/10 md:bg-transparent p-4 md:p-0 rounded-2xl border border-white/10 md:border-none">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-1">Gross Salary <span className="hidden lg:inline">(Before Adjustments)</span></p>
                <div className="flex items-baseline md:justify-end gap-1">
                   <span className="text-xs font-black opacity-70">SAR</span>
                   <span className="font-black text-3xl italic tracking-tighter leading-none">{payslip.grossAmount.toFixed(2)}</span>
                </div>
             </div>
          </div>

          {/* Data Entry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-slate-200/40">
             {[
               { id: 'salesCash', label: 'Sales Cash' },
               { id: 'carRent', label: 'Car Rent' },
               { id: 'akama', label: 'Akama' },
               { id: 'fine', label: 'Fine' },
               { id: 'deductions', label: 'Deduction' },
               { id: 'bonus', label: 'Bonus', color: 'text-emerald-600' },
               { id: 'bankDeduction', label: 'Bank' },
             ].map((field) => (
                <div key={field.id} className="flex border-b border-r border-slate-100 last:border-r-0 md:even:border-r-0 md:[&:nth-child(4n)]:border-r-0">
                  <div className="w-1/2 bg-[#FFEDD5] flex items-center justify-center p-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-800 text-center">{field.label}</Label>
                  </div>
                  <div className="w-1/2 p-2">
                    <input 
                      type="number"
                      value={(formData as any)[field.id]}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className={cn("w-full h-full text-center font-black text-xl tabular-nums focus:outline-none", field.color)}
                    />
                  </div>
                </div>
             ))}
             
             <div className="flex md:col-span-1">
                <div className="w-1/3 bg-[#FFEDD5] flex flex-col items-center justify-center p-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Advance</Label>
                   <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">BAL: {riderInfo?.advances?.reduce((sum: number, a: any) => sum + a.balance, 0) || 0}</span>
                </div>
                <div className="w-2/3 p-2">
                   <input 
                      type="number"
                      value={formData.advanceDeduction}
                      onChange={(e) => updateField('advanceDeduction', e.target.value)}
                      className="w-full h-full text-center font-black text-xl tabular-nums focus:outline-none"
                   />
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-end">
             <Button 
                onClick={handleSave}
                disabled={loading}
                className="bg-slate-900 hover:bg-black text-white h-16 px-12 rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-4"
             >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                Apply Adjustments
             </Button>
          </div>
        </div>
      )}

      {/* History & Company Tabs Section */}
      <div className="mt-16 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3">
                <History className="text-slate-400" size={24} />
                Recent Adjustments
              </h3>
              <p className="text-xs text-slate-500 font-medium">Tracking all manual overrides for the selected month.</p>
           </div>
           
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
                <TabsTrigger value="ALL" className="rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">ALL COMPANIES</TabsTrigger>
                {companies.map(company => (
                  <TabsTrigger key={company} value={company} className="rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    {company}
                  </TabsTrigger>
                ))}
              </TabsList>
           </Tabs>
        </div>

        <Card className="glass-card border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-xl border border-white/80">
          <Table>
            <TableHeader className="bg-slate-900/5">
              <TableRow className="border-none">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14">Pilot ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14">Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14 text-center">Cash/Rent</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14 text-center">Deduction</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14 text-center">Bonus</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14 text-center">Net Total</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 h-14 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustedSlips.length > 0 ? (
                adjustedSlips.map((slip) => (
                  <TableRow key={slip.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="h-16">
                      <div className="bg-slate-100 px-3 py-1 rounded-lg inline-block font-black text-xs italic text-slate-600">
                        {slip.rider.riderId}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 italic uppercase">{slip.rider.riderName}</TableCell>
                    <TableCell className="text-center font-bold text-slate-500 tabular-nums">
                       {slip.salesCash > 0 && <span className="text-red-500">-{slip.salesCash}</span>}
                       {slip.salesCash > 0 && slip.carRent > 0 && <span className="mx-1">/</span>}
                       {slip.carRent > 0 && <span className="text-orange-500">-{slip.carRent}</span>}
                       {slip.salesCash === 0 && slip.carRent === 0 && '—'}
                    </TableCell>
                    <TableCell className="text-center font-bold text-red-500 tabular-nums">
                       {slip.deductions > 0 || slip.fine > 0 ? `-${slip.deductions + slip.fine}` : '—'}
                    </TableCell>
                    <TableCell className="text-center font-bold text-emerald-500 tabular-nums">
                       {slip.bonus > 0 ? `+${slip.bonus}` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                       <span className="font-black text-slate-900 tabular-nums">SAR {slip.netTotal.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSearch(slip.rider.riderId)}
                          className="rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                       >
                          Edit Data <ArrowRight className="ml-1" size={14} />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                       <Calculator size={48} />
                       <p className="font-black uppercase italic tracking-widest text-xs">No adjusted slips found for this selection.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
