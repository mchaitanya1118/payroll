"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Save, 
  Calculator,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DailyEntryGrid() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [companyCode, setCompanyCode] = useState('ALL');
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryMap, setEntryMap] = useState<Record<string, any>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  const fetchGrid = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/daily-entries?month=${month}&year=${year}&companyCode=${companyCode}`);
      setRiders(data.riders);
      setEntryMap(data.entryMap);
      setPendingChanges({});
    } catch (error) {
      console.error('[DailyEntryGrid] fetchGrid error:', error);
      toast.error('Failed to fetch daily entries');
    } finally {
      setLoading(false);
    }
  }, [month, year, companyCode]);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/riders/companies');
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const handleCellChange = (riderId: string, day: number, field: string, value: any) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const changeKey = `${riderId}_${dateKey}`;
    
    setPendingChanges(prev => ({
      ...prev,
      [changeKey]: {
        ...prev[changeKey],
        riderId,
        date: dateKey,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const updates = Object.values(pendingChanges);
    if (updates.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await api.post('/daily-entries/bulk', { updates });
      toast.success('Daily entries saved successfully');
      setPendingChanges({});
      fetchGrid();
    } catch (error) {
      toast.error('Failed to save entries');
    } finally {
      setSaving(false);
    }
  };

  const getEntryValue = useCallback((riderId: string, day: number, field: string) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${riderId}_${dateKey}`;
    
    if (pendingChanges[key] && pendingChanges[key][field] !== undefined) {
      return pendingChanges[key][field];
    }
    
    const entry = entryMap[key];
    if (entry) {
      return entry[field];
    }
    
    if (field === 'status') return 'working';
    return 0;
  }, [year, month, pendingChanges, entryMap]);

  const dailySummaries = useMemo(() => {
    const summaries: Record<number, { worked: number, notWorked: number }> = {};
    daysArray.forEach(day => {
      let worked = 0;
      let notWorked = 0;
      riders.forEach(rider => {
        const status = getEntryValue(rider.id, day, 'status');
        if (status === 'working') worked++;
        else if (status === 'not_working' || status === 'absent') notWorked++;
      });
      summaries[day] = { worked, notWorked };
    });
    return summaries;
  }, [riders, entryMap, pendingChanges, daysArray, getEntryValue]);

  const filteredRiders = useMemo(() => {
    if (!searchQuery) return riders;
    const lowerQuery = searchQuery.toLowerCase();
    return riders.filter(rider => 
      rider.riderName.toLowerCase().includes(lowerQuery) || 
      rider.riderId.toLowerCase().includes(lowerQuery)
    );
  }, [riders, searchQuery]);

  // Group riders by nationality
  const groupedRiders = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredRiders.forEach(rider => {
      const nationality = rider.nationality || 'OTHER';
      if (!groups[nationality]) groups[nationality] = [];
      groups[nationality].push(rider);
    });
    return groups;
  }, [filteredRiders]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const totalWorked = useMemo(() => {
    return Object.values(dailySummaries).reduce((acc, curr) => acc + curr.worked, 0);
  }, [dailySummaries]);

  // Calendar Logic
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const calendarDays = useMemo(() => {
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  return (
    <div className="max-w-[100vw] overflow-hidden flex flex-col h-[calc(100vh-100px)] space-y-6">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] premium-shadow border border-white/60 mx-4 mt-4">
        <div className="flex flex-wrap items-center gap-8">
          <div className="h-20 w-28 bg-slate-900 rounded-[1.75rem] flex flex-col items-center justify-center shadow-2xl shadow-slate-200 border-4 border-white/10 group overflow-hidden relative shrink-0">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="text-3xl font-black text-white tracking-tighter leading-none relative z-10">{totalWorked}</span>
             <span className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1 relative z-10">Total Worked</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Attendance Calendar</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interactive Performance Hub</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-3 flex-1 xl:flex-none">
            <Select value={String(month)} onValueChange={(val) => setMonth(parseInt(val))}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-sm font-black text-xs uppercase tracking-widest min-w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {months.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)} className="font-bold text-xs uppercase tracking-widest">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val))}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-sm font-black text-xs uppercase tracking-widest min-w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)} className="font-bold text-xs uppercase tracking-widest">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            onClick={handleSave}
            disabled={saving || Object.keys(pendingChanges).length === 0}
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
            Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-4 h-full overflow-hidden pb-4">
        {/* Left Side: Calendar Dashboard */}
        <div className="w-full lg:w-[500px] flex flex-col gap-4">
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] premium-shadow border border-white/60">
            <div className="grid grid-cols-7 gap-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400 py-2 tracking-widest">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => (
                <div key={idx} className="aspect-square">
                  {day ? (
                    <button
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "w-full h-full rounded-2xl p-2 flex flex-col items-center justify-between transition-all relative group overflow-hidden border-2",
                        selectedDate === day 
                          ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200" 
                          : "bg-white/80 border-transparent hover:border-emerald-500/30 hover:bg-white"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-black self-start",
                        selectedDate === day ? "text-white" : "text-slate-400"
                      )}>
                        {String(day).padStart(2, '0')}
                      </span>
                      
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[10px] font-black leading-none",
                          selectedDate === day ? "text-emerald-400" : "text-emerald-600"
                        )}>
                          {dailySummaries[day]?.worked || 0}
                        </span>
                        <span className={cn(
                          "text-[6px] font-black uppercase tracking-tighter mt-0.5",
                          selectedDate === day ? "text-slate-400" : "text-slate-300"
                        )}>
                          Worked
                        </span>
                      </div>

                      {/* Indicator dot */}
                      {dailySummaries[day]?.notWorked > 0 && (
                        <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-rose-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-full h-full opacity-20" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats for selected day */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Detailed View</p>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">
                      {new Date(year, month - 1, selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                  </div>
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Calendar className="text-emerald-400" size={20} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <span className="text-2xl font-black block">{dailySummaries[selectedDate]?.worked || 0}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pilots Worked</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <span className="text-2xl font-black block text-rose-400">{dailySummaries[selectedDate]?.notWorked || 0}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Absentees</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Rider List for Selected Day */}
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden min-h-0">
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-900">
                  {new Date(year, month - 1, selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                  Managing Attendance & Performance
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Session</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Tabs value={companyCode} onValueChange={setCompanyCode} className="w-full md:w-auto">
                <TabsList className="bg-white p-1 rounded-xl h-auto border border-slate-200 flex flex-wrap gap-1">
                  <TabsTrigger value="ALL" className="rounded-lg px-4 py-2 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">ALL</TabsTrigger>
                  {companies.map(c => (
                    <TabsTrigger key={c} value={c} className="rounded-lg px-4 py-2 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">{c}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Search Pilot..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10 rounded-xl bg-white border-slate-200 font-bold text-xs uppercase tracking-widest"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
              {filteredRiders.map((rider) => (
                <div key={rider.id} className="bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-100 border border-transparent hover:border-slate-100 transition-all p-4 rounded-3xl group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        {rider.riderId.slice(-2)}
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-tight text-slate-900">{rider.riderName}</h4>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">{rider.riderId}</p>
                      </div>
                    </div>
                    <select 
                      value={getEntryValue(rider.id, selectedDate, 'status')}
                      onChange={(e) => handleCellChange(rider.id, selectedDate, 'status', e.target.value)}
                      className={cn(
                        "text-[9px] font-black uppercase px-3 py-1.5 rounded-lg outline-none cursor-pointer transition-all",
                        getEntryValue(rider.id, selectedDate, 'status') === 'working' 
                          ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white" 
                          : "bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white"
                      )}
                    >
                      <option value="working">Working</option>
                      <option value="not_working">Not Working</option>
                      <option value="absent">Absent</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 group-hover:border-slate-200 transition-colors">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Orders</Label>
                      <input 
                        type="number"
                        value={getEntryValue(rider.id, selectedDate, 'orders')}
                        onChange={(e) => handleCellChange(rider.id, selectedDate, 'orders', parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent font-black text-xs text-slate-900 outline-none tabular-nums"
                      />
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 group-hover:border-slate-200 transition-colors">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cash Collected</Label>
                      <input 
                        type="number"
                        step="0.01"
                        value={getEntryValue(rider.id, selectedDate, 'cashCollected')}
                        onChange={(e) => handleCellChange(rider.id, selectedDate, 'cashCollected', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent font-black text-xs text-slate-900 outline-none tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRiders.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
                <Search size={48} className="text-slate-300 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No Pilots Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
