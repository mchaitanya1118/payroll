"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Wallet, 
  Calendar,
  User,
  ArrowUpRight,
  Info,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdvancesPage() {
  const { format } = useCurrency();
  const [advances, setAdvances] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [companies, setCompanies] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    riderId: '',
    amount: '',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advancesRes, ridersRes, companiesRes] = await Promise.all([
        api.get(`/advances?search=${search}&companyCode=${activeTab}`),
        api.get('/riders'),
        api.get('/riders/companies')
      ]);
      setAdvances(advancesRes.data);
      setRiders(ridersRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Failed to fetch advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.riderId || !formData.amount) return;

    try {
      await api.post('/advances', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Advance issued successfully');
      setIsModalOpen(false);
      setFormData({ riderId: '', amount: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to issue advance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/advances/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[2rem] premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <Wallet className="text-emerald-500" size={32} />
            Advance Ledger
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
            Manage rider loans, track outstanding balances, and oversee financial assistance.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200"
        >
          <Plus className="mr-2" size={18} /> New Advance
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
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

         <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <Input 
              placeholder="Search by rider name or ID..." 
              className="pl-12 h-12 bg-white/60 border-none rounded-2xl text-sm font-bold shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all italic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl overflow-hidden border border-white/60">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
             <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Outstanding Records</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 mt-1">Total active loans: {advances.length}</CardDescription>
             </div>
             <Button 
               variant="outline" 
               onClick={async () => {
                 const token = localStorage.getItem('token');
                 const res = await fetch(`/api/advances/export?companyCode=${activeTab}`, {
                   headers: { 'Authorization': `Bearer ${token}` }
                 });
                 const blob = await res.blob();
                 const url = window.URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `advance_ledger_${activeTab}.xlsx`;
                 a.click();
               }}
               className="rounded-xl border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest h-10 px-6 hover:bg-slate-50 transition-all"
             >
               Export Ledger
             </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rider Details</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Loan Amount</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Remaining Balance</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Issue Date</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-6"><Skeleton className="h-8 w-full" /></td></tr>
                  ))
                ) : advances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-400 italic text-sm">
                      No advance records found for this selection.
                    </td>
                  </tr>
                ) : (
                  advances.map((advance, i) => (
                    <motion.tr 
                      key={advance.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                             {advance.rider.riderName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-black text-slate-900 leading-tight">{advance.rider.riderName}</p>
                               <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-widest">{advance.rider.companyCode || 'IND'}</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {advance.rider.riderId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <p className="text-sm font-black text-slate-900 tabular-nums">{format(advance.amount)}</p>
                      </td>
                      <td className="p-6 text-right">
                        <div className="inline-flex flex-col items-end">
                           <p className="text-sm font-black text-emerald-600 tabular-nums">{format(advance.balance)}</p>
                           <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full" 
                                style={{ width: `${(advance.balance / advance.amount) * 100}%` }}
                              />
                           </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} className="text-slate-300" />
                          <span className="text-xs font-bold">{new Date(advance.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-medium text-slate-500 italic max-w-[150px] truncate" title={advance.reason}>
                          {advance.reason || 'No reason provided'}
                        </p>
                      </td>
                      <td className="p-6 text-right">
                         <button 
                           onClick={() => handleDelete(advance.id)}
                           className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         >
                           <Trash2 size={18} />
                         </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Advance Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <TrendingUp size={100} />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Issue New Advance</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Financial Assistance Program</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Rider</Label>
                    <select 
                      className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={formData.riderId}
                      onChange={(e) => setFormData({ ...formData, riderId: e.target.value })}
                      required
                    >
                      <option value="">Choose a rider...</option>
                      {riders.map(r => (
                        <option key={r.id} value={r.id}>{r.riderName} ({r.riderId})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (SAR)</Label>
                    <Input 
                      type="number"
                      placeholder="Enter amount..."
                      className="h-12 bg-slate-50 border-none rounded-xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-emerald-500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason / Description</Label>
                    <Input 
                      placeholder="Why is this advance being issued?"
                      className="h-12 bg-slate-50 border-none rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-500"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200"
                  >
                    Issue Advance
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Info size={150} />
         </div>
         <div className="space-y-3 relative z-10 text-center md:text-left">
            <h4 className="text-xl font-black uppercase italic tracking-tight">Financial Policy Reminder</h4>
            <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
               Advances are automatically tracked in the system. You can choose to deduct these installments manually during the monthly payroll generation process to keep the balance up to date.
            </p>
         </div>
         <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="flex-1 md:flex-none p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Active Portfolio</p>
               <p className="text-2xl font-black italic tracking-tighter">{format(advances.reduce((sum, a) => sum + a.balance, 0))}</p>
            </div>
         </div>
      </div>
    </div>
  );
}
