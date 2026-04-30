"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trash2, Plus, Pencil, Building, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDate, toTitleCase } from '@/lib/format';

interface Rider {
  id: string;
  riderId: string;
  riderName: string;
  vehicleType: string;
  rateType: string;
  companyCode?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRiderId, setNewRiderId] = useState('');
  const [newRiderName, setNewRiderName] = useState('');
  const [newVehicle, setNewVehicle] = useState('BIKE');
  const [newRateType, setNewRateType] = useState('TARGET');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (vehicleFilter !== 'ALL') params.append('vehicleType', vehicleFilter);
      if (companyFilter !== 'ALL') params.append('companyCode', companyFilter);

      const res = await api.get(`/riders?${params.toString()}`);
      setRiders(res.data);
      
      // Update available companies filter list if we don't have filters active 
      // This is a simple way to populate the dropdown without a separate endpoint
      if (search === '' && vehicleFilter === 'ALL' && companyFilter === 'ALL') {
         const companies = Array.from(new Set(res.data.map((r: Rider) => r.companyCode).filter(Boolean))) as string[];
         setAvailableCompanies(companies);
      }
    } catch (error) {
      toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchRiders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, vehicleFilter, companyFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setNewRiderId('');
    setNewRiderName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    setNewVehicle('BIKE');
    setNewRateType('TARGET');
    setOpen(true);
  };

  const openEditModal = (rider: Rider) => {
    setEditingId(rider.id);
    setNewRiderId(rider.riderId);
    setNewRiderName(rider.riderName);
    setNewCompany(rider.companyCode || '');
    setNewEmail(rider.email || '');
    setNewPhone(rider.phoneNumber || '');
    setNewVehicle(rider.vehicleType);
    setNewRateType(rider.rateType || 'TARGET');
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!newRiderId || !newRiderName) return toast.error("Please fill in required details");
      
      if (editingId) {
        await api.patch(`/riders/${editingId}`, {
          riderId: newRiderId,
          riderName: newRiderName,
          vehicleType: newVehicle,
          rateType: newRateType,
          companyCode: newCompany,
          email: newEmail,
          phoneNumber: newPhone,
        });
      } else {
        await api.post('/riders', {
          riderId: newRiderId,
          riderName: newRiderName,
          vehicleType: newVehicle,
          rateType: newRateType,
          companyCode: newCompany,
          email: newEmail,
          phoneNumber: newPhone,
        });
      }
      toast.success(editingId ? "Pilot profile updated" : "New pilot enrolled successfully");
      
      setOpen(false);
      fetchRiders();
    } catch(err) {
      toast.error(editingId ? 'Failed to update rider.' : 'Failed to create rider. ID might already exist.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name} and all associated entries?`)) return;
    try {
      await api.delete(`/riders/${id}`);
      toast.success('Rider deleted securely.');
      fetchRiders();
    } catch (err) {
      toast.error('Failed to delete rider.');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <Users className="text-emerald-500" size={32} />
              Riders Directory
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Manage and enroll pilot profiles for neqtra logistics.</p>
          </div>
          
          <div className="flex flex-row gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <Button 
                variant="outline"
                onClick={() => {
                    const url = `/api/reports/riders/export`;
                    const token = localStorage.getItem('token');
                    fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then(res => res.blob())
                    .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `riders_directory.csv`;
                        a.click();
                    });
                }}
                className="flex-1 md:flex-none border-2 border-slate-900 text-slate-900 rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-10 md:h-12"
            >
                Export
            </Button>
            <Button onClick={openCreateModal} className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3 group h-10 md:h-12">
                <Plus className="group-hover:rotate-90 transition-transform duration-300 shrink-0" size={16} />
                <span className="hidden sm:inline">Enroll New Pilot</span>
                <span className="sm:hidden">Enroll</span>
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 bg-slate-900 text-white">
              <div className="flex items-center gap-4 mb-2">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Users className="text-emerald-500" size={24} />
                 </div>
                 <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        {editingId ? "Update Pilot Profile" : "New Pilot Enrollment"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        {editingId 
                          ? "Modify driver identity and assignment parameters." 
                          : "Manually establish a new pilot entry in the directory."}
                    </DialogDescription>
                 </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">PILOT ID (READ-ONLY)</Label>
                  <Input 
                    value={newRiderId} 
                    onChange={e => setNewRiderId(e.target.value)} 
                    placeholder="e.g. 1545800" 
                    disabled={!!editingId} 
                    className={cn(
                        "rounded-xl h-12 border-slate-200 font-black tracking-widest transition-all",
                        editingId ? 'bg-slate-50 text-slate-400' : 'focus:border-emerald-500'
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">FULL NAME</Label>
                  <Input 
                    value={newRiderName} 
                    onChange={e => setNewRiderName(e.target.value)} 
                    placeholder="Ex. John Doe"
                    className="rounded-xl h-12 border-slate-200 focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">EMAIL ADDRESS</Label>
                  <Input 
                    type="email"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    placeholder="pilot@company.com"
                    className="rounded-xl h-12 border-slate-200 focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">PHONE (WHATSAPP)</Label>
                  <Input 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)} 
                    placeholder="9665xxxxxxxx"
                    className="rounded-xl h-12 border-slate-200 focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">COMPANY CODE</Label>
                <Input 
                  value={newCompany} 
                  onChange={e => setNewCompany(e.target.value)} 
                  placeholder="Ex. BLR-HUB-01" 
                  className="rounded-xl h-12 border-slate-200 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">VEHICLE CLASS</Label>
                  <Select value={newVehicle} onValueChange={(v) => v && setNewVehicle(v)}>
                    <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                      <SelectValue placeholder="Vehicle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="BIKE" className="font-bold">🏍️ BIKE</SelectItem>
                      <SelectItem value="CAR" className="font-bold">🚗 CAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">PAYROLL SCHEME</Label>
                  <Select value={newRateType} onValueChange={(v) => v && setNewRateType(v)}>
                    <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                      <SelectValue placeholder="Rate Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="TARGET" className="font-bold">🎯 TARGET BASED</SelectItem>
                      <SelectItem value="NO_TARGET" className="font-bold">⚡ NO TARGET / FLAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSave}
                className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-slate-900/20 transition-all active:scale-95 mt-4" 
              >
                {editingId ? "Apply Modifications" : "Complete Enrollment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      
      {/* Search, Filters and Stats Row */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center glass-card p-6 rounded-2xl mb-8 premium-shadow">
        {/* Quick Stat */}
        <div className="flex items-center gap-4 lg:pr-8 lg:border-r border-slate-200/50 h-10 min-w-fit w-full lg:w-auto">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl emerald-glow shrink-0">
            <Users className="text-emerald-600 animate-pulse" size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] leading-none mb-1">Total Pilots</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{riders.length}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="flex-1 space-y-2 w-full">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">Search Crew</Label>
              <Input 
                  placeholder="Search by Name or Rider ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-premium h-11 px-4"
              />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">Vehicle</Label>
                <Select value={vehicleFilter} onValueChange={(v) => v && setVehicleFilter(v)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-11 rounded-xl md:w-36">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                        <SelectItem value="ALL">All Vehicles</SelectItem>
                        <SelectItem value="BIKE">Bikes Only</SelectItem>
                        <SelectItem value="CAR">Cars Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">Company</Label>
                <Select value={companyFilter} onValueChange={(v) => v && setCompanyFilter(v)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-11 rounded-xl md:w-36">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                        <SelectItem value="ALL">All Companies</SelectItem>
                        {availableCompanies.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <div className="lg:pt-5 w-full lg:w-auto">
          <Button variant="ghost" onClick={() => { setSearch(''); setVehicleFilter('ALL'); setCompanyFilter('ALL'); }} className="w-full lg:w-auto text-slate-500 font-bold hover:bg-slate-50 h-11 px-6 rounded-xl transition-all">
              Reset
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden premium-shadow border border-white/60 bg-white/40 backdrop-blur-xl">
        {/* Mobile View: Card List */}
        <div className="block md:hidden">
          {riders.map((r) => (
            <div key={r.id} className="p-5 border-b border-slate-200/60 relative group hover:bg-emerald-50/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rider ID</p>
                  <p className="text-base font-black text-slate-900 tabular-nums">{r.riderId}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(r)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl h-9 w-9">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.riderName)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pilot Name</p>
                  <p className="text-sm font-bold text-slate-800">{toTitleCase(r.riderName)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Company</p>
                    <Badge variant="outline" className="font-black text-[9px] text-slate-500 border-slate-200 bg-white uppercase px-2 py-0.5">
                      {r.companyCode || '—'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vehicle Status</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={cn(
                        "font-black text-[9px] tracking-widest uppercase px-2 py-0.5 border-none",
                        r.vehicleType === 'BIKE' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {r.vehicleType}
                      </Badge>
                      <Badge variant="outline" className="font-black text-[8px] tracking-[0.1em] uppercase px-1.5 py-0 border-slate-200 text-slate-400">
                        {r.rateType === 'NO_TARGET' ? 'NO TARGET' : 'TARGET'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {riders.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic text-sm">No riders found.</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900/5 hover:bg-slate-900/5 border-b border-slate-200/60">
                <TableHead className="font-black text-slate-900 text-center w-32 tracking-widest text-[10px] uppercase h-14">RIDER ID</TableHead>
                <TableHead className="font-black text-slate-900 tracking-widest text-[10px] uppercase h-14">PILOT NAME</TableHead>
                <TableHead className="font-black text-slate-900 text-center tracking-widest text-[10px] uppercase h-14">COMPANY</TableHead>
                <TableHead className="font-black text-slate-900 text-center tracking-widest text-[10px] uppercase h-14">VEHICLE</TableHead>
                <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase h-14 px-8">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((r) => (
                <TableRow key={r.id} className="group hover:bg-emerald-50/30 transition-all duration-300 h-16 border-b border-slate-100/60">
                  <TableCell className="font-black text-slate-400 text-center tabular-nums">{r.riderId}</TableCell>
                  <TableCell className="font-bold text-slate-900 tabular-nums tracking-tight">
                    {toTitleCase(r.riderName)}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.companyCode ? (
                      <Badge variant="outline" className="font-black text-[10px] text-slate-500 border-slate-200 bg-white shadow-sm uppercase px-3 py-1">
                        <Building size={12} className="mr-1.5 text-slate-400" /> {r.companyCode}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Badge className={cn(
                        "font-black text-[10px] tracking-widest uppercase px-3 py-1 border-none shadow-sm",
                        r.vehicleType === 'BIKE' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {r.vehicleType}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "font-black text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 border-slate-200 text-slate-400",
                        r.rateType === 'NO_TARGET' && "bg-slate-100 text-slate-600 border-slate-300"
                      )}>
                        {r.rateType === 'NO_TARGET' ? 'NO TARGET' : 'TARGET'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-4 md:px-8">
                    <div className="flex justify-end gap-1 md:gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(r)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all h-8 w-8 md:h-10 md:w-10">
                        <Pencil size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.riderName)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all h-8 w-8 md:h-10 md:w-10">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {riders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-20 italic font-medium">
                    No riders found matching your criteria.
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
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Fleet Integrity</h3>
            <p className="text-slate-400 max-w-xl">
              Maintain a synchronized database of all active pilots. Ensure vehicle classifications are updated to maintain payout accuracy.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={14} className="text-emerald-500" /> Verified Data
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Users size={14} className="text-blue-500" /> Active Fleet
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl transition-all">
             Audit All Records <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
